import { route, ok, HttpError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { Game, GameScore, GameSession } from "@/lib/server/models";
import { assertGameType } from "@/lib/server/games";
import { generateGame, levelLabel, maxScoreFor } from "@/lib/shared/numbers";

export const POST = route(async (req, { type }) => {
  assertGameType(type);
  const me = await requireUser();
  const score =
    (await GameScore.findOne({ user: me._id, game_type: type })) ||
    (await GameScore.create({ user: me._id, game_type: type, level: 15, marks: 0 }));
  const game = await Game.findOne({ gameType: type, level: score.level }).lean();
  if (!game) throw new HttpError(409, `${levelLabel(score.level)} has no game set up yet. Please ask your teacher.`);

  const questions = generateGame(game.settings);
  if (!questions.length) throw new HttpError(409, "This level has no questions configured.");

  await GameSession.deleteMany({ user: me._id, gameType: type });
  const session = await GameSession.create({
    user: me._id,
    gameType: type,
    level: score.level,
    questions,
    expiresAt: new Date(Date.now() + (questions.length * 90 + 600) * 1000),
  });

  return ok({
    sessionId: String(session._id),
    level: score.level,
    label: levelLabel(score.level),
    passMark: game.passMark,
    maxScore: maxScoreFor(questions.length),
    // answers stay on the server
    questions: questions.map((q) => ({ type: q.type, numbers: q.numbers })),
  });
});
