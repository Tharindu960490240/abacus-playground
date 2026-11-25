import { z } from "zod";
import { route, readJson, ok, notFound, assertObjectId } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { PaperHistory } from "@/lib/server/models";

// Fixed: /paper/marks/add had no login check at all.
export const PATCH = route(async (req, { id }) => {
  await requireAdmin();
  assertObjectId(id);
  const { marks } = z.object({ marks: z.coerce.number().min(0).max(100000) }).parse(await readJson(req));
  const doc = await PaperHistory.findByIdAndUpdate(id, { $set: { marks } }, { new: true });
  if (!doc) throw notFound("Paper not found");
  return ok({ _id: String(doc._id), marks: doc.marks });
});
