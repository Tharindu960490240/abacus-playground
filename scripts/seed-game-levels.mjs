// Seeds the `games` collection from game-levels-spec.mjs.
//   MONGODB_URI=... node scripts/seed-game-levels.mjs            (adds missing levels only)
//   MONGODB_URI=... node scripts/seed-game-levels.mjs --force    (overwrites existing levels)
//   --pass=60   pass mark as % of the maximum score (default 60)
import mongoose from "mongoose";
import { connect } from "./connect.mjs";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* no .env.local: use the real environment */
}
import { ANZAN, DICTATION, toGameDoc } from "./game-levels-spec.mjs";

const force = process.argv.includes("--force");
const pass = Number((process.argv.find((a) => a.startsWith("--pass=")) || "--pass=60").split("=")[1]);
if (!process.env.MONGODB_URI) { console.error("Set MONGODB_URI first"); process.exit(1); }

await connect();
const games = mongoose.connection.collection("games");
let added = 0, skipped = 0, updated = 0;
for (const [type, rows] of [["anzan", ANZAN], ["dictation", DICTATION]]) {
  for (const row of rows) {
    const doc = toGameDoc(type, row, pass);
    const existing = await games.findOne({ gameType: type, level: doc.level });
    if (existing && !force) { skipped++; continue; }
    await games.updateOne({ gameType: type, level: doc.level }, { $set: doc }, { upsert: true });
    existing ? updated++ : added++;
  }
}
console.log(`Game levels: ${added} added, ${updated} overwritten, ${skipped} left as they were.`);
await mongoose.disconnect();
