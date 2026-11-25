import { route, readJson, ok, badRequest } from "@/lib/server/http";
import { requireAdmin, requireUser } from "@/lib/server/auth";
import { Chapter, Course, COURSE_LEVELS } from "@/lib/server/models";
import { getProgress, orderedLessons, isUnlocked } from "@/lib/server/course";
import { chapterSchema } from "@/lib/server/courseSchemas";

export const dynamic = "force-dynamic";

/** Chapters of one level with their lessons and a locked flag for students. */
export const GET = route(async (req) => {
  const me = await requireUser();
  const level = new URL(req.url).searchParams.get("level");
  if (level && !COURSE_LEVELS.includes(level)) throw badRequest("Unknown level");
  const chapters = await Chapter.find(level ? { level } : {}).sort({ order: 1 }).lean();
  const lessons = await Course.find({ chapter_id: { $in: chapters.map((c) => c._id) } }).select("chapter_id title type order").sort({ order: 1 }).lean();
  const list = await orderedLessons();
  const progress = me.isAdmin ? null : await getProgress(me._id, list);
  return ok(chapters.map((c) => {
    const own = lessons.filter((l) => String(l.chapter_id) === String(c._id)).map((l) => ({
      _id: String(l._id), title: l.title, type: l.type, order: l.order,
      locked: progress ? !isUnlocked(list, progress, l._id) : false,
      current: progress ? String(progress.lesson_id) === String(l._id) : false,
    }));
    return { _id: String(c._id), title: c.title, description: c.description, order: c.order, level: c.level, lessons: own, locked: own.length > 0 && own.every((l) => l.locked) };
  }));
});

export const POST = route(async (req) => {
  await requireAdmin();
  const doc = await Chapter.create(chapterSchema.parse(await readJson(req)));
  return ok({ _id: String(doc._id) }, { status: 201 });
});
