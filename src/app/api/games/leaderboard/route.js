import { route, ok, badRequest } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { GameScore, User, GAME_TYPES, GROUPS } from "@/lib/server/models";
import { levelLabel } from "@/lib/shared/numbers";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  const me = await requireUser();
  const q = new URL(req.url).searchParams;
  const type = q.get("type") || "anzan";
  const stat = q.get("stat") === "level" ? "level" : "marks";
  const group = q.get("group") || "";
  const limit = Math.min(50, Math.max(1, Number(q.get("limit")) || 10));
  if (!GAME_TYPES.includes(type)) throw badRequest("Unknown game");
  if (group && !GROUPS.includes(group)) throw badRequest("Unknown group");

  const userFilter = { isAdmin: false, ...(group ? { group } : {}) };
  const userIds = await User.find(userFilter).distinct("_id");
  const filter = { game_type: type, user: { $in: userIds } };
  // Level 15 is the starting level, so a lower number is further ahead.
  const sort = stat === "level" ? { level: 1, marks: -1 } : { marks: -1, level: 1 };

  const rows = await GameScore.find(filter).sort(sort).limit(limit).populate("user", "name avatarUrl group").lean();
  const out = [];
  let rank = 0, prev = null;
  rows.forEach((r, i) => {
    const key = stat === "level" ? r.level : r.marks;
    if (key !== prev) { rank = i + 1; prev = key; }
    out.push({ rank, name: r.user?.name ?? "Former student", avatarUrl: r.user?.avatarUrl ?? null, level: r.level, label: levelLabel(r.level), marks: r.marks, me: String(r.user?._id) === String(me._id) });
  });

  // The student's own rank without loading the whole collection.
  let mine = null;
  const own = await GameScore.findOne({ game_type: type, user: me._id }).lean();
  if (own && !me.isAdmin) {
    const better = stat === "level"
      ? { $or: [{ level: { $lt: own.level } }] }
      : { $or: [{ marks: { $gt: own.marks } }] };
    const ahead = await GameScore.countDocuments({ ...filter, ...better });
    mine = { rank: ahead + 1, name: me.name, avatarUrl: me.avatarUrl ?? null, level: own.level, label: levelLabel(own.level), marks: own.marks, me: true };
  }
  return ok({ rows: out, mine });
});
