import { z } from "zod";
import { route, readJson, ok, notFound, forbidden, badRequest, assertObjectId } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { Course } from "@/lib/server/models";
import { getProgress, orderedLessons, isUnlocked } from "@/lib/server/course";
import { normaliseAnswer } from "@/lib/server/courseSchemas";

/** Checks one quiz answer without revealing it. */
export const POST = route(async (req, { id }) => {
  const me = await requireUser();
  assertObjectId(id);
  const { index, answer } = z.object({ index: z.number().int().min(0), answer: z.string().max(200) }).parse(await readJson(req));
  const lesson = await Course.findById(id).select("questions").lean();
  if (!lesson) throw notFound("Lesson not found");
  if (!me.isAdmin) {
    const list = await orderedLessons();
    if (!isUnlocked(list, await getProgress(me._id, list), id)) throw forbidden("Finish the earlier lessons first");
  }
  const q = lesson.questions?.[index];
  if (!q) throw badRequest("No such question");
  return ok({ correct: normaliseAnswer(q.answer) === normaliseAnswer(answer) });
});
