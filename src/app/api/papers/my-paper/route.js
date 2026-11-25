import { route, ok, HttpError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { GameScore, Paper, PaperHistory } from "@/lib/server/models";
import { generateQuestions } from "@/lib/server/papers";

/**
 * Gets (or creates once) the student's paper for their current paper level.
 * Fixed: the old route crashed when no template had that level and shared
 * global variables between requests.
 */
export const POST = route(async () => {
  const me = await requireUser();
  const score = await GameScore.findOne({ user: me._id, game_type: "paper" }).lean();
  const level = score?.level ?? 10;
  let paper = await PaperHistory.findOne({ user_id: String(me._id), level }).sort({ date: -1 });
  if (!paper) {
    const template = await Paper.findOne({ level }).lean();
    if (!template) throw new HttpError(409, `There is no paper for level ${level} yet. Please ask your teacher.`);
    const questions = await generateQuestions(template.equations);
    paper = await PaperHistory.create({ level, marks: 0, user_id: String(me._id), questions, num_columns_format: template.num_columns_format || 4 });
  }
  return ok({ _id: String(paper._id), level: paper.level, date: paper.date });
});
