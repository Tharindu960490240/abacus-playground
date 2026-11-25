// The same five rules the PasswordStrength checklist shows. Used by the
// registration form and enforced again on the server.
export const PASSWORD_RULES = [
  { key: "length", test: (p) => p.length >= 8 },
  { key: "upper", test: (p) => /[A-Z]/.test(p) },
  { key: "lower", test: (p) => /[a-z]/.test(p) },
  { key: "number", test: (p) => /[0-9]/.test(p) },
  { key: "symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

// bcrypt only reads the first 72 bytes, so longer passwords are refused.
export const MAX_PASSWORD_BYTES = 72;

export function passwordByteLength(p) {
  return new TextEncoder().encode(String(p ?? "")).length;
}

export function isStrongPassword(p) {
  const s = typeof p === "string" ? p : "";
  return PASSWORD_RULES.every((r) => r.test(s)) && passwordByteLength(s) <= MAX_PASSWORD_BYTES;
}
