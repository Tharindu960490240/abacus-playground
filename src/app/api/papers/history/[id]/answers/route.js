import { route, ok, notFound, assertObjectId } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { PaperHistory } from "@/lib/server/models";
import { answersFor } from "@/lib/server/papers";

export const dynamic = "force-dynamic";

// Teachers only: before, any logged-in student could fetch any answer key.
export const GET = route(async (req, { id }) => {
  await requireAdmin();
  assertObjectId(id);
  const paper = await PaperHistory.findById(id).select("questions level").lean();
  if (!paper) throw notFound("Paper not found");
  return ok({ level: paper.level, answers: answersFor(paper.questions) });
});
