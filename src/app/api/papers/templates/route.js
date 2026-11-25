import { route, readJson, ok } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { Paper } from "@/lib/server/models";
import { templateSchema } from "@/lib/server/papers";

export const dynamic = "force-dynamic";



export const GET = route(async () => {
  await requireAdmin();
  return ok(await Paper.find({}).sort({ level: -1, name: 1 }).lean());
});

export const POST = route(async (req) => {
  await requireAdmin();
  const body = templateSchema.parse(await readJson(req));
  return ok(await Paper.create(body), { status: 201 });
});
