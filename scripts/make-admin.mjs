// Gives an existing account teacher (admin) rights.
//   MONGODB_URI=... node scripts/make-admin.mjs teacher@example.com
import mongoose from "mongoose";

const email = (process.argv[2] || "").trim().toLowerCase();
if (!process.env.MONGODB_URI || !email) { console.error("Usage: MONGODB_URI=... node scripts/make-admin.mjs <email>"); process.exit(1); }
await mongoose.connect(process.env.MONGODB_URI);
const res = await mongoose.connection.collection("users").updateOne({ email }, { $set: { isAdmin: true } });
console.log(res.matchedCount ? `${email} is now an admin.` : `No account found for ${email}.`);
await mongoose.disconnect();
