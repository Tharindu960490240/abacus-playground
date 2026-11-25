import { z } from "zod";
import { route, readJson, ok, notFound, forbidden, assertObjectId } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { Course } from "@/lib/server/models";
import { completeLesson, getProgress, orderedLessons, isUnlocked } from "@/lib/server/course";
import { normaliseAnswer, QUIZ_PASS_PERCENT } from "@/lib/server/courseSchemas";

/**
 * Marks a lesson done and moves the student to the next one. Quiz lessons are
 * marked here, on the server, and need 75% to pass (the old pass mark).
 * Fixed: the old "next lesson" mixed lessons from every chapter together and
 * sometimes never replied.
 */
export const POST = route(async (req, { id }) => {
  const me = await requireUser();
  assertObjectId(id);
  const { answers } = z.object({ answers: z.array(z.string().max(200)).max(100).optional() }).parse(await readJson(req).catch(() => ({})));
  const lesson = await Course.findById(id).lean();
  if (!lesson) throw notFound("Lesson not found");
  if (!me.isAdmin) {
    const list = await orderedLessons();
    if (!isUnlocked(list, await getProgress(me._id, list), id)) throw forbidden("Finish the earlier lessons first");
  }

  let score = null;
  if (lesson.type === "question") {
    const qs = lesson.questions || [];
    const right = qs.filter((q, i) => normaliseAnswer(q.answer) === normaliseAnswer(answers?.[i])).length;
    score = qs.length ? Math.round((right / qs.length) * 100) : 100;
    if (score < QUIZ_PASS_PERCENT) return ok({ passed: false, score, passMark: QUIZ_PASS_PERCENT, next: null });
  }
  if (me.isAdmin) return ok({ passed: true, score, passMark: QUIZ_PASS_PERCENT, next: null });
  const { next, finishedCourse } = await completeLesson(me._id, id);
  return ok({ passed: true, score, passMark: QUIZ_PASS_PERCENT, finishedCourse, next: next ? { _id: next._id, level: next.level, chapter_id: next.chapter_id } : null });
});
