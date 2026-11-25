import { NextResponse } from "next/server";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { connectDb } from "./db";

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (msg = "Bad request", details) => new HttpError(400, msg, details);
export const unauthorized = (msg = "Please log in") => new HttpError(401, msg);
export const forbidden = (msg = "You are not allowed to do that") => new HttpError(403, msg);
export const notFound = (msg = "Not found") => new HttpError(404, msg);

export function ok(data, init) {
  return NextResponse.json({ success: true, data }, init);
}

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function allowedOrigins(req) {
  const list = new Set();
  const self = new URL(req.url);
  list.add(self.origin);
  if (process.env.APP_URL) list.add(new URL(process.env.APP_URL).origin);
  if (process.env.VERCEL_URL) list.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) list.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") || self.protocol.replace(":", "");
    list.add(`${proto}://${host}`);
  }
  return list;
}

/**
 * Wraps a route handler: connects to the database, blocks cross-site form
 * posts (the session lives in a SameSite cookie, this is the second guard),
 * turns thrown errors into JSON, and never leaks stack traces.
 */
export function route(fn) {
  return async (req, ctx) => {
    try {
      if (MUTATING.has(req.method)) {
        const origin = req.headers.get("origin");
        if (origin && !allowedOrigins(req).has(origin)) throw forbidden("Cross-site request blocked");
      }
      await connectDb();
      const params = ctx?.params ? await ctx.params : {};
      const res = await fn(req, params);
      return res ?? ok(null);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ success: false, error: err.message, details: err.details }, { status: err.status });
      }
      if (err instanceof ZodError) {
        const first = err.issues[0];
        const where = first?.path?.length ? `${first.path.join(".")}: ` : "";
        return NextResponse.json({ success: false, error: `${where}${first?.message || "Invalid input"}` }, { status: 400 });
      }
      if (err instanceof mongoose.Error.CastError) {
        return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
      }
      if (err?.code === 11000) {
        return NextResponse.json({ success: false, error: "That already exists" }, { status: 409 });
      }
      console.error(`[api] ${req.method} ${new URL(req.url).pathname}`, err);
      return NextResponse.json({ success: false, error: "Something went wrong on our side" }, { status: 500 });
    }
  };
}

export async function readJson(req) {
  try {
    return await req.json();
  } catch {
    throw badRequest("Expected a JSON body");
  }
}

export function assertObjectId(id, label = "id") {
  if (!mongoose.isValidObjectId(id)) throw badRequest(`Invalid ${label}`);
  return id;
}
