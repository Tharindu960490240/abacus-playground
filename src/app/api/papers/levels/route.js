import { route, ok } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { Paper } from "@/lib/server/models";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireUser();
  const rows = await Paper.find({ level: { $ne: null } }).select("name level").sort({ level: -1 }).lean();
  return ok(rows.map((r) => ({ _id: String(r._id), name: r.name, level: r.level })));
});
