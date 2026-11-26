// Shared database connection for the scripts in this folder.
//
// Node.js 24 on Windows has a known bug where the DNS lookup behind
// "mongodb+srv://" connection strings fails with "querySrv ECONNREFUSED".
// If that happens, we retry once using public DNS servers
// (override with DNS_SERVERS=8.8.8.8,1.1.1.1). The deployed site on Vercel
// runs on Linux and is not affected.
import dns from "node:dns";
import mongoose from "mongoose";

const SRV_CODES = new Set(["ECONNREFUSED", "ETIMEOUT", "ESERVFAIL", "ENOTFOUND"]);

export async function connect(uri = process.env.MONGODB_URI) {
  const options = { serverSelectionTimeoutMS: 15000 };
  try {
    return await mongoose.connect(uri, options);
  } catch (err) {
    const srvFailed = err?.syscall === "querySrv" && SRV_CODES.has(err.code);
    if (!srvFailed) throw err;
    const servers = (process.env.DNS_SERVERS || "1.1.1.1,8.8.8.8").split(",").map((s) => s.trim()).filter(Boolean);
    console.warn(`DNS lookup for the database failed (${err.code}). Retrying with DNS servers ${servers.join(", ")}…`);
    dns.setServers(servers);
    await mongoose.disconnect().catch(() => {});
    return mongoose.connect(uri, options);
  }
}
