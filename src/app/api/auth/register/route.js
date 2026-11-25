import bcrypt from "bcryptjs";
import { route, readJson, ok, HttpError } from "@/lib/server/http";
import { User, initialiseStudent } from "@/lib/server/models";
import { registerSchema, publicUser } from "@/lib/server/validation";
import { createSession } from "@/lib/server/auth";
import { checkLoginRate, recordFailedLogin } from "@/lib/server/rateLimit";

export const POST = route(async (req) => {
  const body = registerSchema.parse(await readJson(req));
  const keys = await checkLoginRate(req, body.email);
  if (await User.exists({ email: body.email })) {
    await recordFailedLogin(keys);
    throw new HttpError(409, "An account with this email already exists");
  }
  const { password, ...fields } = body;
  const user = await User.create({ ...fields, isAdmin: false, password: await bcrypt.hash(password, 12) });
  await initialiseStudent(user._id); // awaited now; the old code fired and forgot
  await createSession(user);
  return ok(publicUser(user), { status: 201 });
});
