import { z } from "zod";
import { route, readJson, ok, HttpError, assertObjectId } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { Game, GameScore, GameSession } from "@/lib/server/models";
import { assertGameType } from "@/lib/server/games";
import { levelLabel, scoreResults } from "@/lib/shared/numbers";

const schema = z.object({
  sessionId: z.string(),
  answers: z.array(z.object({ answer: z.number().finite().nullable(), seconds: z.number().min(0).max(3600) })).max(500),
});

const MIN_SECONDS_PER_QUESTION = 1;

export const POST = route(async (req, { type }) => {
  assertGameType(type);
  const me = await requireUser();
  const { sessionId, answers } = schema.parse(await readJson(req));
  assertObjectId(sessionId, "game");

  // Single use: the session is removed as it is read, so a result cannot be replayed.
  const session = await GameSession.findOneAndDelete({ _id: sessionId, user: me._id, gameType: type });
  if (!session) throw new HttpError(409, "This game has already finished or expired. Please start a new one.");

  const qs = session.questions;
  if (answers.length !== qs.length) throw new HttpError(400, "Answers do not match the questions");
  const elapsed = (Date.now() - session.startedAt.getTime()) / 1000;
  if (elapsed < qs.length * MIN_SECONDS_PER_QUESTION) throw new HttpError(400, "That was faster than the numbers can be shown");

  // Marked here, on the server, against the stored answers.
  const results = qs.map((q, i) => {
    const a = answers[i];
    if (a.answer === null) return { status: "skipped", seconds: a.seconds };
    return { status: a.answer === q.answer ? "correct" : "wrong", seconds: a.seconds };
  });
  const summary = scoreResults(results);
  const gained = Math.max(0, summary.marks);

  const game = await Game.findOne({ gameType: type, level: session.level }).lean();
  const passMark = game?.passMark ?? Infinity;
  const passed = summary.marks >= passMark;
  let newLevel = session.level;
  // Move up only if the next level has been set up; at the top the student stays put.
  if (passed && (await Game.exists({ gameType: type, level: session.level - 1 }))) newLevel = session.level - 1;

  // Only move the level if a teacher has not changed it while the game was running.
  let score = await GameScore.findOneAndUpdate(
    { user: me._id, game_type: type, level: session.level },
    { $inc: { marks: gained }, $set: { level: newLevel } },
    { new: true }
  );
  if (!score) {
    score = await GameScore.findOneAndUpdate({ user: me._id, game_type: type }, { $inc: { marks: gained } }, { new: true, upsert: true });
  }

  return ok({
    ...summary,
    gained,
    passMark: game?.passMark ?? null,
    passed,
    levelUp: newLevel !== session.level,
    newLevel: score.level,
    newLabel: levelLabel(score.level),
    totalMarks: score.marks,
    review: qs.map((q, i) => ({ numbers: q.numbers, type: q.type, answer: q.answer, given: answers[i].answer, status: results[i].status })),
  });
});
