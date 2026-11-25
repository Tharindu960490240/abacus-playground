import { Chapter, Course, CourseLevel, COURSE_LEVELS } from "./models";

/** Every lesson in teaching order: level → chapter order → lesson order. */
export async function orderedLessons() {
  const chapters = await Chapter.find({}).select("level order title").lean();
  const lessons = await Course.find({}).select("chapter_id order type title").lean();
  const chapterById = new Map(chapters.map((c) => [String(c._id), c]));
  const levelIndex = (l) => {
    const i = COURSE_LEVELS.indexOf(l);
    return i < 0 ? COURSE_LEVELS.length : i;
  };
  return lessons
    .filter((l) => chapterById.has(String(l.chapter_id)))
    .map((l) => {
      const ch = chapterById.get(String(l.chapter_id));
      return { _id: String(l._id), chapter_id: String(ch._id), level: ch.level, chapterOrder: ch.order, order: l.order, type: l.type, title: l.title };
    })
    .sort((a, b) => levelIndex(a.level) - levelIndex(b.level) || a.chapterOrder - b.chapterOrder || a.order - b.order);
}

/**
 * Returns the student's progress row, creating or repairing it if needed.
 * Fixed: the old code compared an array to "null", so new students were never
 * given their first chapter and lesson.
 */
export async function getProgress(userId, list) {
  let row = await CourseLevel.findOne({ user: userId });
  if (!row) row = await CourseLevel.create({ user: userId, level: "foundation" });
  const all = list || (await orderedLessons());
  const valid = row.lesson_id && row.lesson_id !== "null" && all.some((l) => l._id === String(row.lesson_id));
  if (!valid) {
    const first = all.find((l) => l.level === row.level) || all[0];
    if (first) {
      row.level = first.level;
      row.chapter_id = first.chapter_id;
      row.lesson_id = first._id;
      await row.save();
    }
  }
  return row;
}

export function lessonIndex(list, lessonId) {
  return list.findIndex((l) => l._id === String(lessonId));
}

export function isUnlocked(list, progress, lessonId) {
  const cur = lessonIndex(list, progress.lesson_id);
  const idx = lessonIndex(list, lessonId);
  return idx >= 0 && cur >= 0 && idx <= cur;
}

/** Moves the student on if they just finished their current lesson. */
export async function completeLesson(userId, lessonId) {
  const list = await orderedLessons();
  const progress = await getProgress(userId, list);
  const idx = lessonIndex(list, lessonId);
  const cur = lessonIndex(list, progress.lesson_id);
  if (idx === cur && idx + 1 < list.length) {
    const next = list[idx + 1];
    progress.level = next.level;
    progress.chapter_id = next.chapter_id;
    progress.lesson_id = next._id;
    await progress.save();
  }
  return { progress, next: idx + 1 < list.length ? list[idx + 1] : null, finishedCourse: idx === list.length - 1 };
}
