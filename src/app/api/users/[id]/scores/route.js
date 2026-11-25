import { route, ok } from "@/lib/server/http";
import { requireUser, resolveTargetUser } from "@/lib/server/auth";
import { GameScore } from "@/lib/server/models";

export const dynamic = "force-dynamic";

export const GET = route(async (req, { id }) => {
  const me = await requireUser();
  const target = resolveTargetUser(me, id);
  const rows = await GameScore.find({ user: target }).select("game_type level marks -_id").lean();
  return ok(Object.fromEntries(rows.map((r) => [r.game_type, { level: r.level, marks: r.marks }])));
});
