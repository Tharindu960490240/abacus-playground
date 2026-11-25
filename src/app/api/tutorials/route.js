import { z } from "zod";
import { route, readJson, ok } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { Blog } from "@/lib/server/models";
import { sanitizeHtml } from "@/lib/shared/sanitize";

export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().max(200000).default(""),
  blognumber: z.coerce.number().int().min(0).optional(),
});

export const GET = route(async () => {
  const rows = await Blog.find({ type: "tutorial" }).select("title blognumber imageUrl date").sort({ blognumber: 1 }).lean();
  return ok(rows.map((r) => ({ ...r, _id: String(r._id) })));
});

export const POST = route(async (req) => {
  await requireAdmin();
  const body = schema.parse(await readJson(req));
  const last = await Blog.findOne({ type: "tutorial" }).sort({ blognumber: -1 }).select("blognumber").lean();
  const doc = await Blog.create({
    title: body.title,
    description: sanitizeHtml(body.description),
    blognumber: body.blognumber ?? (last?.blognumber ?? 0) + 1,
    type: "tutorial",
  });
  return ok({ _id: String(doc._id) }, { status: 201 });
});
