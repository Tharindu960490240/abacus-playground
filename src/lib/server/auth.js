import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { User } from "./models";
import { forbidden, unauthorized } from "./http";

export const SESSION_COOKIE = "ap_session";
const SESSION_DAYS = 7;

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(user) {
  const token = await new SignJWT({ adm: !!user.isAdmin, v: user.sessionVersion || 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user._id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true, // not readable from JavaScript, unlike the old localStorage token
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Returns the logged-in user document, or null. */
export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const user = await User.findById(payload.sub);
    if (!user || (user.sessionVersion || 0) !== payload.v) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  // Fixed: the old admin middleware sent 403 and then called next() anyway.
  if (!user.isAdmin) throw forbidden();
  return user;
}

/** Students may act on themselves; admins on anyone. Returns the target id. */
export function resolveTargetUser(currentUser, requestedId) {
  const id = !requestedId || requestedId === "me" ? String(currentUser._id) : String(requestedId);
  if (!currentUser.isAdmin && id !== String(currentUser._id)) throw forbidden();
  return id;
}
