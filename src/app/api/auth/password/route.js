import bcrypt from "bcryptjs";
import { route, readJson, ok, HttpError } from "@/lib/server/http";
import { User } from "@/lib/server/models";
import { changePasswordSchema } from "@/lib/server/validation";
import { createSession, requireUser } from "@/lib/server/auth";

export const POST = route(async (req) => {
  const me = await requireUser();
  const { current, password } = changePasswordSchema.parse(await readJson(req));
  const user = await User.findById(me._id).select("+password");
  if (!(await bcrypt.compare(current, user.password))) throw new HttpError(400, "Current password is incorrect");
  user.password = await bcrypt.hash(password, 12);
  user.sessionVersion = (user.sessionVersion || 0) + 1; // signs out other devices
  await user.save();
  await createSession(user);
  return ok(null);
});
