import { route, ok, notFound, assertObjectId } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { Blog } from "@/lib/server/models";
import { readUpload, storeFile, deleteFile } from "@/lib/server/uploads";

// Fixed: any logged-in student could upload tutorial images before.
export const POST = route(async (req, { id }) => {
  await requireAdmin();
  assertObjectId(id);
  const doc = await Blog.findById(id);
  if (!doc) throw notFound("Tutorial not found");
  const url = await storeFile("tutorials", await readUpload(req, "file", "image"));
  const old = doc.imageUrl;
  doc.imageUrl = url;
  await doc.save();
  await deleteFile(old);
  return ok({ imageUrl: url });
});

export const DELETE = route(async (req, { id }) => {
  await requireAdmin();
  assertObjectId(id);
  const doc = await Blog.findById(id);
  if (!doc) throw notFound("Tutorial not found");
  await deleteFile(doc.imageUrl);
  doc.imageUrl = undefined;
  await doc.save();
  return ok(null);
});
