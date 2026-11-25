import { LoginAttempt } from "./models";
import { HttpError } from "./http";

const MAX_ATTEMPTS = 8; // per 15 minutes (the TTL on LoginAttempt)

export function clientIp(req) {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
}

/** Throttles by email and by IP. Stored in MongoDB so it works across serverless instances. */
export async function checkLoginRate(req, email) {
  const keys = [`ip:${clientIp(req)}`, `email:${email}`];
  const counts = await Promise.all(keys.map((key) => LoginAttempt.countDocuments({ key })));
  if (counts.some((c) => c >= MAX_ATTEMPTS)) {
    throw new HttpError(429, "Too many attempts. Please wait 15 minutes and try again.");
  }
  return keys;
}

export async function recordFailedLogin(keys) {
  await LoginAttempt.insertMany(keys.map((key) => ({ key })));
}

export async function clearLoginAttempts(keys) {
  await LoginAttempt.deleteMany({ key: { $in: keys } });
}
