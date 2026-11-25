import { route, readJson, ok, notFound, forbidden, assertObjectId } from "@/lib/server/http";
import { requireAdmin, requireUser } from "@/lib/server/auth";
import { Chapter, Course, CourseLevel } from "@/lib/server/models";
import { getProgress, orderedLessons, isUnlocked, lessonIndex } from "@/lib/server/course";
import { lessonSchema } from "@/lib/server/courseSchemas";
import { deleteFile } from "@/lib/server/uploads";

export const dynamic = "force-dynamic";

export const GET = route(async (req, { id }) => {
  const me = await requireUser();
  assertObjectId(id);
  const lesson = await Course.findById(id).lean();
  if (!lesson) throw notFound("Lesson not found");
  const list = await orderedLessons();
  if (!me.isAdmin) {
    const progress = await getProgress(me._id, list);
    if (!isUnlocked(list, progress, id)) throw forbidden("Finish the earlier lessons first");
  }
  const chapter = await Chapter.findById(lesson.chapter_id).select("title level order").lean();
  const siblings = list.filter((l) => l.chapter_id === String(lesson.chapter_id));
  const pos = siblings.findIndex((l) => l._id === id);
  const at = lessonIndex(list, id);
  return ok({
    _id: String(lesson._id),
    title: lesson.title,
    type: lesson.type,
    order: lesson.order,
    chapter: chapter ? { _id: String(chapter._id), title: chapter.title, level: chapter.level } : null,
    video_link: lesson.video_link || [],
    download: (lesson.download || []).map((d) => ({ description: d.description, name: d.name, url: d.url || null })),
    // students never receive the answers
    questions: (lesson.questions || []).map((q) => (me.isAdmin ? { question: q.question, answer: q.answer } : { question: q.question })),
    position: pos + 1,
    count: siblings.length,
    prev: at > 0 ? list[at - 1]._id : null,
    next: at >= 0 && at + 1 < list.length ? list[at + 1]._id : null,
  });
});

export const PATCH = route(async (req, { id }) => {
  await requireAdmin();
  assertObjectId(id);
  const body = lessonSchema.parse(await readJson(req));
  const lesson = await Course.findById(id);
  if (!lesson) throw notFound("Lesson not found");
  if (body.type === "paper") {
    const keep = new Set(body.download.map((d) => d.url));
    for (const d of lesson.download || []) if (d.url && !keep.has(d.url)) await deleteFile(d.url);
  }
  lesson.set({ ...body, video_link: body.video_link || [], download: body.download || [], questions: body.questions || [] });
  await lesson.save();
  return ok({ _id: String(lesson._id) });
});

export const DELETE = route(async (req, { id }) => {
  await requireAdmin();
  assertObjectId(id);
  const lesson = await Course.findByIdAndDelete(id);
  if (lesson) for (const d of lesson.download || []) await deleteFile(d.url);
  await CourseLevel.updateMany({ lesson_id: id }, { $set: { lesson_id: null } });
  return ok(null);
});
