// One-off: copies files from the old Express server's upload/ folder into
// Vercel Blob and points the database records at them. Safe to re-run.
//
//   MONGODB_URI=... BLOB_READ_WRITE_TOKEN=... node scripts/migrate-uploads.mjs /path/to/old/bmathteacher
//
// Also lower-cases user emails so login is case-insensitive (the old app
// stored them as typed), reporting any clashes instead of changing them.
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { connect } from "./connect.mjs";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* no .env.local: use the real environment */
}
import { putFile } from "./blob.mjs";

const root = process.argv[2];
if (!process.env.MONGODB_URI || !process.env.BLOB_READ_WRITE_TOKEN || !root) {
  console.error("Usage: MONGODB_URI=... BLOB_READ_WRITE_TOKEN=... node scripts/migrate-uploads.mjs <old backend folder>");
  process.exit(1);
}
await connect();
const db = mongoose.connection;
const TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".pdf": "application/pdf" };

async function upload(file, folder) {
  const buf = await fs.readFile(file);
  const ext = path.extname(file).toLowerCase();
  return putFile(`${folder}/${path.basename(file)}`, buf, TYPES[ext] || "application/octet-stream");
}
const exists = (p) => fs.access(p).then(() => true, () => false);
const stats = { avatars: 0, tutorials: 0, coursePdfs: 0, missing: 0 };

// profile pictures: upload/profile_pic/full/<userId>.jpg
for (const u of await db.collection("users").find({ avatarUrl: { $exists: false } }).project({ _id: 1 }).toArray()) {
  const file = path.join(root, "upload/profile_pic/full", `${u._id}.jpg`);
  if (!(await exists(file))) continue;
  await db.collection("users").updateOne({ _id: u._id }, { $set: { avatarUrl: await upload(file, "avatars") } });
  stats.avatars++;
}

// tutorial / blog images: upload/tutorial/<blogId>.jpg and upload/course/<blogId>.jpg
for (const b of await db.collection("blogs").find({ imageUrl: { $exists: false } }).toArray()) {
  const file = path.join(root, b.type === "course" ? "upload/course" : "upload/tutorial", `${b._id}.jpg`);
  if (!(await exists(file))) continue;
  await db.collection("blogs").updateOne({ _id: b._id }, { $set: { imageUrl: await upload(file, "tutorials") } });
  stats.tutorials++;
}

// course PDFs: courses.download[].path (relative to the old backend folder)
for (const c of await db.collection("courses").find({ type: "paper" }).toArray()) {
  let changed = false;
  for (const d of c.download || []) {
    if (d.url || !d.path) continue;
    const file = path.resolve(root, d.path);
    if (!file.startsWith(path.resolve(root)) || !(await exists(file))) { stats.missing++; console.warn("missing:", d.path); continue; }
    d.url = await upload(file, "course");
    changed = true;
    stats.coursePdfs++;
  }
  if (changed) await db.collection("courses").updateOne({ _id: c._id }, { $set: { download: c.download } });
}

// emails to lower case
const users = await db.collection("users").find({}).project({ email: 1 }).toArray();
const seen = new Map(users.map((u) => [u.email, u._id]));
for (const u of users) {
  const lower = String(u.email || "").trim().toLowerCase();
  if (lower === u.email) continue;
  if (seen.has(lower)) { console.warn(`email clash, left unchanged: ${u.email}`); continue; }
  await db.collection("users").updateOne({ _id: u._id }, { $set: { email: lower } });
}

// old signing keys are no longer used
await db.collection("gamekeys").drop().catch(() => {});

console.log("Migrated:", stats);
await mongoose.disconnect();
