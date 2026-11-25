import bcrypt from "bcryptjs";
import { route, readJson, ok, HttpError } from "@/lib/server/http";
import { User } from "@/lib/server/models";
import { loginSchema, publicUser } from "@/lib/server/validation";
import { createSession } from "@/lib/server/auth";
import { checkLoginRate, recordFailedLogin, clearLoginAttempts } from "@/lib/server/rateLimit";

// Compared against when the email does not exist, so both cases take the same time.
const DUMMY_HASH = "$2b$12$FPbO9mUjdtw/Hk.18yS.P.hNmXqNt33SIG7vuP8DXIlqpFE0CAJcu";

export const POST = route(async (req) => {
  const { email, password } = loginSchema.parse(await readJson(req));
  const keys = await checkLoginRate(req, email);
  const user = await User.findOne({ email }).select("+password");
  const valid = await bcrypt.compare(password, user?.password || DUMMY_HASH);
  if (!user || !valid) {
    await recordFailedLogin(keys);
    // One message for both cases so the form does not reveal which emails exist.
    throw new HttpError(401, "Email or password is incorrect");
  }
  await clearLoginAttempts(keys);
  await createSession(user);
  return ok(publicUser(user));
});
