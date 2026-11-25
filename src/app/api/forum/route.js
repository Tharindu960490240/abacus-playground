import { z } from "zod";
import { route, readJson, ok } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { ForumPost } from "@/lib/server/models";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  topic: z.string().trim().min(1, "Topic is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(10000),
});

export const GET = route(async () => {
  await requireUser();
  const posts = await ForumPost.find({}).populate("user_id", "name avatarUrl").sort({ date: -1 }).limit(200).lean();
  return ok(posts.map((p) => ({
    _id: String(p._id), topic: p.topic, description: p.description, date: p.date,
    author: p.user_id ? { _id: String(p.user_id._id), name: p.user_id.name, avatarUrl: p.user_id.avatarUrl ?? null } : null,
    answerCount: p.answers?.length ?? 0,
  })));
});

export const POST = route(async (req) => {
  const me = await requireUser();
  const body = postSchema.parse(await readJson(req));
  const post = await ForumPost.create({ ...body, user_id: me._id });
  return ok({ _id: String(post._id) }, { status: 201 });
});
