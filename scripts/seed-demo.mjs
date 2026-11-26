// DELETES EVERYTHING in the database, then loads demo data into every collection.
//
//   npm run seed:demo -- --yes
//
// Reads MONGODB_URI (and optionally BLOB_READ_WRITE_TOKEN) from the environment
// or from .env.local. Options:
//   --yes            required: confirms you want the database wiped
//   --full-levels    use the full question counts from "game mode data.docx"
//                    (default: same digits/rows, but 10 + 5 + 5 questions per level game)
// Environment:
//   ADMIN_EMAIL      default tharindumadusankachika@gmail.com
//   ADMIN_NAME       default "Tharindu Madusanka"
//   ADMIN_PASSWORD   if not set, a strong one is generated and printed once
//   DEMO_STUDENT_PASSWORD   shared password for the 24 demo students (generated if not set)
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { put } from "@vercel/blob";
import {
  User, GameScore, CourseLevel, Game, Paper, BasicEquation, PaperHistory, ForumPost, Blog, Chapter, Course,
  GameSession, LoginAttempt,
} from "../src/lib/server/models/index.js";
import { isStrongPassword } from "../src/lib/shared/password.js";
import { buildDemoData, demoWorksheetPdf } from "./demo-data.mjs";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* no .env.local: use the real environment */
}

const args = process.argv.slice(2);
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set (put it in .env.local or the environment).");
  process.exit(1);
}

const makePassword = () => `Demo-${randomBytes(6).toString("base64url")}7!a`;
const adminEmail = (process.env.ADMIN_EMAIL || "tharindumadusankachika@gmail.com").trim().toLowerCase();
const adminName = process.env.ADMIN_NAME || "Tharindu Madusanka";
const adminPassword = process.env.ADMIN_PASSWORD || makePassword();
const studentPassword = process.env.DEMO_STUDENT_PASSWORD || makePassword();
for (const [label, pw] of [["ADMIN_PASSWORD", adminPassword], ["DEMO_STUDENT_PASSWORD", studentPassword]]) {
  if (!isStrongPassword(pw)) {
    console.error(`${label} must be 8+ characters with upper and lower case letters, a number and a symbol.`);
    process.exit(1);
  }
}

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const db = mongoose.connection.db;
const host = mongoose.connection.host;

if (!args.includes("--yes")) {
  const names = (await db.listCollections().toArray()).map((c) => c.name);
  console.log(`\nThis will DELETE ALL DATA in database "${db.databaseName}" on ${host}`);
  console.log(`Collections there now: ${names.join(", ") || "(none)"}`);
  console.log("\nRun again with --yes to go ahead:  npm run seed:demo -- --yes\n");
  await mongoose.disconnect();
  process.exit(0);
}

// 1. clear: drop every collection (works with a plain readWrite Atlas user)
const existing = await db.listCollections().toArray();
for (const c of existing) {
  if (c.name.startsWith("system.")) continue;
  await db.dropCollection(c.name);
}
console.log(`Cleared ${existing.length} collections from "${db.databaseName}".`);

// 2. demo worksheet PDF for the course (only if Blob storage is configured)
let pdfUrl = null;
if (process.env.BLOB_READ_WRITE_TOKEN) {
  const blob = await put("course/demo-worksheet.pdf", demoWorksheetPdf(), { access: "public", contentType: "application/pdf", addRandomSuffix: true });
  pdfUrl = blob.url;
} else {
  console.log("BLOB_READ_WRITE_TOKEN not set: skipping worksheet (PDF) lessons.");
}

// 3. build and insert
const data = buildDemoData({
  adminEmail,
  adminName,
  adminHash: await bcrypt.hash(adminPassword, 12),
  studentHash: await bcrypt.hash(studentPassword, 12),
  fullLevels: args.includes("--full-levels"),
  pdfUrl,
});

const plan = [
  [User, data.users], [Game, data.games], [GameScore, data.gamescores], [Paper, data.papers],
  [BasicEquation, data.basic_equations], [PaperHistory, data.paperhistories], [Chapter, data.chapters],
  [Course, data.courses], [CourseLevel, data.courselevels], [Blog, data.blogs], [ForumPost, data.forumposts],
];
for (const [Model, docs] of plan) {
  await Model.insertMany(docs); // validated against the app's schemas
  console.log(`  ${Model.collection.collectionName.padEnd(16)} ${docs.length}`);
}

// 4. indexes (unique emails, one score row per game, session expiry, login throttling…)
for (const Model of [...plan.map(([m]) => m), GameSession, LoginAttempt]) await Model.createIndexes();

console.log(`
Done. Log in at your site with:

  Admin (teacher):  ${adminEmail}
  Password:         ${process.env.ADMIN_PASSWORD ? "(the ADMIN_PASSWORD you set)" : adminPassword}

  Any demo student, e.g. ${data.users[1].email}
  Password:         ${process.env.DEMO_STUDENT_PASSWORD ? "(the DEMO_STUDENT_PASSWORD you set)" : studentPassword}

Change the admin password after logging in (Profile → Change password).
`);
await mongoose.disconnect();
