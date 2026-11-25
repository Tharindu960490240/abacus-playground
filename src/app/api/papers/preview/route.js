import { z } from "zod";
import { route, readJson, ok } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { equationsSchema, generateQuestions, answersFor } from "@/lib/server/papers";

// Fixed: the old /paper/generate returned an un-awaited promise, i.e. {}.
export const POST = route(async (req) => {
  await requireAdmin();
  const { equations } = z.object({ equations: equationsSchema }).parse(await readJson(req));
  const questions = await generateQuestions(equations);
  return ok({ questions, answers: answersFor(questions) });
});
