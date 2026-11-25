import { z } from "zod";
import { route, readJson, ok, notFound, assertObjectId } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { Blog } from "@/lib/server/models";
import { sanitizeHtml } from "@/lib/shared/sanitize";
import { deleteFile } from "@/lib/server/uploads";

export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(200000).default(""),
  blognumber: z.coerce.number().int().min(0),
});

export const GET = route(async (req, { id }) => {
  assertObjectId(id);
  const post = await Blog.findOne({ _id: id, type: "tutorial" }).lean();
  if (!post) throw notFound("Tutorial not found"); // fixed: was an undefined function
  const all = await Blog.find({ type: "tutorial" }).select("_id").sort({ blognumber: 1 }).lean();
  const index = all.findIndex((x) => String(x._id) === id);
  return ok({
    ...post,
    _id: String(post._id),
    description: sanitizeHtml(post.description),
    index: index + 1,
    count: all.length,
    prev: index > 0 ? String(all[index - 1]._id) : null,
    next: index >= 0 && index + 1 < all.length ? String(all[index + 1]._id) : null,
  });
});

export const PATCH = route(async (req, { id }) => {
  await requireAdmin();
  assertObjectId(id);
  const body = schema.parse(await readJson(req));
  const doc = await Blog.findByIdAndUpdate(id, { $set: { ...body, description: sanitizeHtml(body.description) } }, { new: true });
  if (!doc) throw notFound("Tutorial not found");
  return ok({ _id: String(doc._id) });
});

export const DELETE = route(async (req, { id }) => {
  await requireAdmin();
  assertObjectId(id);
  const doc = await Blog.findByIdAndDelete(id);
  if (doc) await deleteFile(doc.imageUrl);
  return ok(null);
});
