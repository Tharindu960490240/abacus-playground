import { route, readJson, ok, notFound } from "@/lib/server/http";
import { requireUser, resolveTargetUser } from "@/lib/server/auth";
import { User } from "@/lib/server/models";
import { profileUpdateSchema, publicUser } from "@/lib/server/validation";

export const dynamic = "force-dynamic";

export const GET = route(async (req, { id }) => {
  const me = await requireUser();
  const target = resolveTargetUser(me, id); // students: only themselves
  const user = await User.findById(target);
  if (!user) throw notFound("Student not found");
  return ok(publicUser(user));
});

export const PATCH = route(async (req, { id }) => {
  const me = await requireUser();
  const target = resolveTargetUser(me, id);
  const changes = profileUpdateSchema.parse(await readJson(req));
  if (!me.isAdmin) delete changes.group; // groups are set by the teacher
  const set = {};
  // flatten nested objects so a partial update does not wipe sibling fields
  for (const [k, v] of Object.entries(changes)) {
    if (v && typeof v === "object") for (const [k2, v2] of Object.entries(v)) set[`${k}.${k2}`] = v2;
    else set[k] = v;
  }
  const user = await User.findByIdAndUpdate(target, { $set: set }, { new: true, runValidators: true });
  if (!user) throw notFound("Student not found");
  return ok(publicUser(user));
});
