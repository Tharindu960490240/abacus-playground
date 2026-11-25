import { route, ok } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { Game, GameScore } from "@/lib/server/models";
import { assertGameType } from "@/lib/server/games";
import { levelLabel, maxScoreFor } from "@/lib/shared/numbers";

export const dynamic = "force-dynamic";

/** The student's current level and what that level's game contains. */
export const GET = route(async (req, { type }) => {
  assertGameType(type);
  const me = await requireUser();
  const score = await GameScore.findOne({ user: me._id, game_type: type }).lean();
  const level = score?.level ?? 15;
  const game = await Game.findOne({ gameType: type, level }).lean();
  const count = game ? game.settings.reduce((n, s) => n + (s.no_of_ques || 0), 0) : 0;
  return ok({
    level,
    label: levelLabel(level),
    marks: score?.marks ?? 0,
    configured: !!game,
    passMark: game?.passMark ?? null,
    settings: game?.settings ?? [],
    questionCount: count,
    maxScore: maxScoreFor(count),
  });
});
