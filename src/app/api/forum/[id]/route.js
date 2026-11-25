import { z } from "zod";
import { route, readJson, ok, notFound, forbidden, assertObjectId } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { ForumPost } from "@/lib/server/models";

export const dynamic = "force-dynamic";

const schema = z.object({ topic: z.string().trim().min(1).max(200), description: z.string().trim().min(1).max(10000) });

const person = (u) => (u ? { _id: String(u._id), name: u.name, avatarUrl: u.avatarUrl ?? null } : null);

async function loadOwned(id, me) {
  assertObjectId(id);
  const post = await ForumPost.findById(id);
  if (!post) throw notFound("Post not found");
  // Fixed: before, any logged-in user could edit or delete anyone's post.
  if (!me.isAdmin && String(post.user_id) !== String(me._id)) throw forbidden("You can only change your own posts");
  return post;
}

export const GET = route(async (req, { id }) => {
  await requireUser();
  assertObjectId(id);
  const p = await ForumPost.findById(id).populate("user_id", "name avatarUrl").populate("answers.user_id", "name avatarUrl").lean();
  if (!p) throw notFound("Post not found");
  return ok({
    _id: String(p._id), topic: p.topic, description: p.description, date: p.date, author: person(p.user_id),
    answers: (p.answers || []).map((a) => ({ _id: String(a._id), answer: a.answer, date: a.date, author: person(a.user_id) })),
  });
});

export const PATCH = route(async (req, { id }) => {
  const me = await requireUser();
  const post = await loadOwned(id, me);
  Object.assign(post, schema.parse(await readJson(req)));
  await post.save(); // awaited now
  return ok({ _id: String(post._id) });
});

export const DELETE = route(async (req, { id }) => {
  const me = await requireUser();
  const post = await loadOwned(id, me);
  await post.deleteOne();
  return ok(null);
});
