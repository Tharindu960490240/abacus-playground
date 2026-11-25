import { route, readJson, ok, notFound, assertObjectId } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { Chapter, Course, CourseLevel } from "@/lib/server/models";
import { chapterSchema } from "@/lib/server/courseSchemas";
import { deleteFile } from "@/lib/server/uploads";

export const PATCH = route(async (req, { id }) => {
  await requireAdmin();
  assertObjectId(id);
  const doc = await Chapter.findByIdAndUpdate(id, { $set: chapterSchema.parse(await readJson(req)) }, { new: true, runValidators: true });
  if (!doc) throw notFound("Chapter not found");
  return ok({ _id: String(doc._id) });
});

// Fixed: chapter and lesson delete had no login check at all.
export const DELETE = route(async (req, { id }) => {
  await requireAdmin();
  assertObjectId(id);
  const lessons = await Course.find({ chapter_id: id }).lean();
  for (const l of lessons) for (const d of l.download || []) await deleteFile(d.url);
  await Course.deleteMany({ chapter_id: id });
  await Chapter.deleteOne({ _id: id });
  // students pointing at the removed chapter get re-placed on their next visit
  await CourseLevel.updateMany({ chapter_id: id }, { $set: { chapter_id: null, lesson_id: null } });
  return ok(null);
});
