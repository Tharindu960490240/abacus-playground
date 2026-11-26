// Gives an existing account teacher (admin) rights.
//   MONGODB_URI=... node scripts/make-admin.mjs teacher@example.com
import mongoose from "mongoose";
import { connect } from "./connect.mjs";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* no .env.local: use the real environment */
}

const email = (process.argv[2] || "").trim().toLowerCase();
if (!process.env.MONGODB_URI || !email) { console.error("Usage: MONGODB_URI=... node scripts/make-admin.mjs <email>"); process.exit(1); }
await connect();
const res = await mongoose.connection.collection("users").updateOne({ email }, { $set: { isAdmin: true } });
console.log(res.matchedCount ? `${email} is now an admin.` : `No account found for ${email}.`);
await mongoose.disconnect();
