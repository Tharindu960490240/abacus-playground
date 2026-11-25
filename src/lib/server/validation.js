import { z } from "zod";
import { GROUPS } from "./models";
import { isStrongPassword } from "../shared/password";

const str = (max = 200) => z.string().trim().max(max);
const optStr = (max = 200) => str(max).optional().or(z.literal("").transform(() => undefined));

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")).pipe(z.string().max(254));

export const passwordSchema = z
  .string()
  .refine(isStrongPassword, "Password must be 8+ characters with upper and lower case letters, a number and a symbol (max 72 bytes)");

const profileShape = {
  name: str(120).min(1, "Name is required"),
  group: z.enum(GROUPS).optional(),
  profile: z.object({
    birthday: str(40).min(1, "Birthday is required"),
    address: str(300).min(1, "Address is required"),
    gender: str(40).min(1, "Gender is required"),
    city: optStr(), postal_code: optStr(20), school: optStr(), grade: optStr(40),
  }),
  guardian: z.object({
    name: str(120).min(1, "Guardian name is required"),
    email: emailSchema,
    mobile: str(40).min(1, "Guardian mobile is required"),
    home: optStr(40), profession: optStr(),
    guardian_type: z.enum(["Father", "Mother", "Guardian"]).optional(),
  }),
  emergency: z.object({
    name: str(120).min(1, "Emergency contact name is required"),
    mobile: str(40).min(1, "Emergency mobile is required"),
    home: optStr(40),
    relationship: str(60).min(1, "Relationship is required"),
  }),
  special_note: optStr(2000),
};

export const registerSchema = z.object({ email: emailSchema, password: passwordSchema, ...profileShape });

// Profile edits: same fields, email/password/isAdmin can never be changed here.
export const profileUpdateSchema = z.object(profileShape).partial().strict();

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(200) });

export const changePasswordSchema = z.object({ current: z.string().min(1).max(200), password: passwordSchema });

export function publicUser(u) {
  if (!u) return null;
  const o = typeof u.toObject === "function" ? u.toObject() : { ...u };
  delete o.password;
  delete o.sessionVersion;
  delete o.__v;
  o._id = String(o._id);
  return o;
}
