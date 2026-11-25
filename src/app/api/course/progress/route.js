import { route, ok } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { getProgress, orderedLessons } from "@/lib/server/course";
import { COURSE_LEVELS } from "@/lib/server/models";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const me = await requireUser();
  const list = await orderedLessons();
  const p = await getProgress(me._id, list);
  return ok({
    isAdmin: !!me.isAdmin,
    level: p.level,
    levelIndex: me.isAdmin ? COURSE_LEVELS.length - 1 : Math.max(0, COURSE_LEVELS.indexOf(p.level)),
    chapter_id: p.chapter_id ? String(p.chapter_id) : null,
    lesson_id: p.lesson_id ? String(p.lesson_id) : null,
    levels: COURSE_LEVELS,
  });
});
