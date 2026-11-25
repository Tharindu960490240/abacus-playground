import { z } from "zod";
import { route, readJson, ok, badRequest } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { Game, GAME_TYPES } from "@/lib/server/models";

export const dynamic = "force-dynamic";

const n = (min, max) => z.coerce.number().int().min(min).max(max);
const section = z.discriminatedUnion("type", [
  z.object({ type: z.enum(["addition", "additionsubtraction"]), no_of_digits: n(1, 12), no_of_rows: n(2, 50), no_of_ques: n(0, 100) }),
  z.object({ type: z.enum(["multiplication", "division"]), first_digit: n(1, 9), second_digit: n(1, 9), no_of_ques: n(0, 100) }),
]);
const schema = z.object({
  gameType: z.enum(GAME_TYPES),
  level: n(-10, 30),
  passMark: n(0, 10000),
  settings: z.array(section).min(1).max(8),
});

export const GET = route(async (req) => {
  await requireAdmin();
  const type = new URL(req.url).searchParams.get("type") || "anzan";
  if (!GAME_TYPES.includes(type)) throw badRequest("Unknown game");
  return ok(await Game.find({ gameType: type }).sort({ level: -1 }).lean());
});

export const PUT = route(async (req) => {
  await requireAdmin();
  const body = schema.parse(await readJson(req));
  const doc = await Game.findOneAndUpdate({ gameType: body.gameType, level: body.level }, { $set: body }, { upsert: true, new: true, runValidators: true });
  return ok(doc);
});

export const DELETE = route(async (req) => {
  await requireAdmin();
  const q = new URL(req.url).searchParams;
  const type = q.get("type");
  const level = Number(q.get("level"));
  if (!GAME_TYPES.includes(type) || !Number.isInteger(level)) throw badRequest("type and level are required");
  await Game.deleteOne({ gameType: type, level });
  return ok(null);
});
