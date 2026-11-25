import { route, readJson, ok, notFound, assertObjectId } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { Chapter, Course } from "@/lib/server/models";
import { lessonSchema } from "@/lib/server/courseSchemas";

const ICONS = { video: "video", paper: "paper", question: "question" };

export const POST = route(async (req) => {
  await requireAdmin();
  const body = lessonSchema.parse(await readJson(req));
  assertObjectId(body.chapter_id, "chapter");
  if (!(await Chapter.exists({ _id: body.chapter_id }))) throw notFound("Chapter not found");
  const doc = await Course.create({ ...body, icon: ICONS[body.type] });
  return ok({ _id: String(doc._id) }, { status: 201 });
});
