import mongoose from "mongoose";

// One cached connection per server instance. Vercel Functions reuse warm
// instances, so without this every request would open a new pool.
const cached = globalThis.__mongoose || (globalThis.__mongoose = { conn: null, promise: null });

export async function connectDb() {
  if (cached.conn) return cached.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (!cached.promise) {
    mongoose.set("strictQuery", true);
    cached.promise = mongoose
      .connect(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 10000 })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
