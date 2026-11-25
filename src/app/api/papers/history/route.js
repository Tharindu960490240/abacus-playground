import { route, ok } from "@/lib/server/http";
import { requireUser, resolveTargetUser } from "@/lib/server/auth";
import { PaperHistory } from "@/lib/server/models";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  const me = await requireUser();
  const target = resolveTargetUser(me, new URL(req.url).searchParams.get("user"));
  const rows = await PaperHistory.find({ user_id: target }).select("level marks date").sort({ date: -1 }).lean();
  return ok(rows.map((r) => ({ ...r, _id: String(r._id) })));
});
