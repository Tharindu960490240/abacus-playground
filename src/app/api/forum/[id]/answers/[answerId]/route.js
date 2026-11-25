import { route, ok, notFound, forbidden, assertObjectId } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { ForumPost } from "@/lib/server/models";

export const DELETE = route(async (req, { id, answerId }) => {
  const me = await requireUser();
  assertObjectId(id);
  assertObjectId(answerId);
  const post = await ForumPost.findById(id);
  const answer = post?.answers.id(answerId);
  if (!answer) throw notFound("Answer not found");
  if (!me.isAdmin && String(answer.user_id) !== String(me._id)) throw forbidden("You can only delete your own answers");
  answer.deleteOne();
  await post.save();
  return ok(null);
});
