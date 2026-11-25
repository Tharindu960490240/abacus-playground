import { put, del } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { HttpError, badRequest } from "./http";

// Vercel Functions have no persistent disk, so the old upload/ folder cannot
// work there. Files go to Vercel Blob; in local development without a token
// they are written to public/uploads instead.

const KINDS = {
  image: { maxBytes: 2 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
  pdf: { maxBytes: 15 * 1024 * 1024, types: ["application/pdf"] },
};

// Check the real file signature: the browser-supplied type is not trusted.
function sniff(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length >= 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (buf.length >= 5 && buf.subarray(0, 5).toString() === "%PDF-") return "application/pdf";
  return null;
}

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

export async function readUpload(req, field, kind) {
  const rule = KINDS[kind];
  const len = Number(req.headers.get("content-length") || 0);
  if (len && len > rule.maxBytes + 64 * 1024) throw badRequest(`File is too large (max ${rule.maxBytes / 1024 / 1024} MB)`);
  let form;
  try {
    form = await req.formData();
  } catch {
    throw badRequest("Expected a file upload");
  }
  const file = form.get(field);
  if (!file || typeof file === "string") throw badRequest("No file was sent");
  if (file.size > rule.maxBytes) throw badRequest(`File is too large (max ${rule.maxBytes / 1024 / 1024} MB)`);
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || !rule.types.includes(type)) {
    throw badRequest(kind === "pdf" ? "Only PDF files are allowed" : "Only JPG, PNG or WebP images are allowed");
  }
  const original = String(file.name || "file").replace(/[^\w.\- ]+/g, "").slice(0, 120) || "file";
  return { buf, type, ext: EXT[type], originalName: original };
}

export async function storeFile(folder, upload) {
  const name = `${folder}/${randomUUID()}.${upload.ext}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(name, upload.buf, { access: "public", contentType: upload.type });
    return blob.url;
  }
  if (process.env.NODE_ENV === "production") {
    throw new HttpError(503, "File uploads are not configured (BLOB_READ_WRITE_TOKEN is missing)");
  }
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const target = path.join(process.cwd(), "public", "uploads", name);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, upload.buf);
  return `/uploads/${name}`;
}

export async function deleteFile(url) {
  if (!url) return;
  try {
    if (url.includes(".blob.vercel-storage.com")) {
      if (process.env.BLOB_READ_WRITE_TOKEN) await del(url);
    } else if (url.startsWith("/uploads/") && process.env.NODE_ENV !== "production") {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const root = path.join(process.cwd(), "public", "uploads");
      const target = path.join(process.cwd(), "public", url);
      if (target.startsWith(root)) await fs.unlink(target).catch(() => {});
    }
  } catch (err) {
    console.warn("[uploads] could not delete", url, err?.message);
  }
}
