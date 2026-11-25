import { z } from "zod";
import { route, readJson, ok, assertObjectId, notFound } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { GameScore, User } from "@/lib/server/models";

const schema = z.object({
  game_type: z.enum(["anzan", "dictation", "paper"]),
  level: z.coerce.number().int().min(-10).max(100),
});

export const PUT = route(async (req, { id }) => {
  await requireAdmin();
  assertObjectId(id);
  if (!(await User.exists({ _id: id }))) throw notFound("Student not found");
  const { game_type, level } = schema.parse(await readJson(req));
  const row = await GameScore.findOneAndUpdate(
    { user: id, game_type },
    { $set: { level }, $setOnInsert: { marks: 0 } },
    { upsert: true, new: true }
  );
  return ok({ game_type, level: row.level, marks: row.marks });
});
