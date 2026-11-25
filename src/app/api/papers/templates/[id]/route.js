import { route, readJson, ok, notFound, assertObjectId } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { Paper } from "@/lib/server/models";
import { templateSchema } from "@/lib/server/papers";

export const PUT = route(async (req, { id }) => {
  await requireAdmin();
  assertObjectId(id);
  const body = templateSchema.parse(await readJson(req));
  const doc = await Paper.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true });
  if (!doc) throw notFound("Paper level not found");
  return ok(doc);
});

export const DELETE = route(async (req, { id }) => {
  await requireAdmin();
  assertObjectId(id);
  await Paper.deleteOne({ _id: id });
  return ok(null);
});
