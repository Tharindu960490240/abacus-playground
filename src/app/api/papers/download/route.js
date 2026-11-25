import { z } from "zod";
import { route, readJson } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { equationsSchema, columnsSchema, generateQuestions, buildPaperDocx, docxResponse } from "@/lib/server/papers";

export const POST = route(async (req) => {
  await requireAdmin();
  const { equations, num_columns_format } = z
    .object({ equations: equationsSchema, num_columns_format: columnsSchema })
    .parse(await readJson(req));
  const questions = await generateQuestions(equations);
  return docxResponse(await buildPaperDocx(questions, num_columns_format), "practice-paper.docx");
});
