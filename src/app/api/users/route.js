import { route, ok } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { User, GameScore } from "@/lib/server/models";

export const dynamic = "force-dynamic";

// Admin only. The old /api/user/all and /allstudent were open to anyone and
// returned password hashes and guardian phone numbers.
export const GET = route(async () => {
  await requireAdmin();
  const users = await User.find({ isAdmin: false }).select("name email group avatarUrl").sort({ name: 1 }).lean();
  const scores = await GameScore.find({ user: { $in: users.map((u) => u._id) } }).select("user game_type level marks").lean();
  const byUser = new Map();
  for (const s of scores) {
    const k = String(s.user);
    if (!byUser.has(k)) byUser.set(k, {});
    byUser.get(k)[s.game_type] = { level: s.level, marks: s.marks };
  }
  return ok(users.map((u) => ({ ...u, _id: String(u._id), scores: byUser.get(String(u._id)) || {} })));
});
