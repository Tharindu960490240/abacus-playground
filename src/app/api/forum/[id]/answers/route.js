import { z } from "zod";
import { route, readJson, ok, notFound, assertObjectId } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { ForumPost } from "@/lib/server/models";

export const POST = route(async (req, { id }) => {
  const me = await requireUser();
  assertObjectId(id);
  const { answer } = z.object({ answer: z.string().trim().min(1, "Write an answer first").max(5000) }).parse(await readJson(req));
  const res = await ForumPost.updateOne({ _id: id }, { $push: { answers: { answer, user_id: me._id, date: new Date() } } });
  if (!res.matchedCount) throw notFound("Post not found");
  return ok(null, { status: 201 });
});
