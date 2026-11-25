import { route, notFound, assertObjectId } from "@/lib/server/http";
import { requireUser, resolveTargetUser } from "@/lib/server/auth";
import { PaperHistory } from "@/lib/server/models";
import { buildPaperDocx, docxResponse } from "@/lib/server/papers";

export const GET = route(async (req, { id }) => {
  const me = await requireUser();
  assertObjectId(id);
  const paper = await PaperHistory.findById(id).lean();
  if (!paper) throw notFound("Paper not found");
  resolveTargetUser(me, paper.user_id); // owner or admin
  const buf = await buildPaperDocx(paper.questions, paper.num_columns_format, { level: paper.level });
  return docxResponse(buf, `paper-level-${paper.level}.docx`);
});
