// Route tests with the database and session mocked, checking the security
// and marking rules that matter most.
import { describe, it, expect, vi, beforeEach } from "vitest";

const state = { user: null, session: null, score: null, games: {}, updates: [] };

vi.mock("@/lib/server/db", () => ({ connectDb: async () => {} }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }));
vi.mock("@/lib/server/auth", async () => {
  const { forbidden, unauthorized } = await import("@/lib/server/http");
  return {
    requireUser: async () => { if (!state.user) throw unauthorized(); return state.user; },
    requireAdmin: async () => { if (!state.user) throw unauthorized(); if (!state.user.isAdmin) throw forbidden(); return state.user; },
    resolveTargetUser: (me, id) => { const t = !id || id === "me" ? String(me._id) : String(id); if (!me.isAdmin && t !== String(me._id)) throw forbidden(); return t; },
    getCurrentUser: async () => state.user,
  };
});
vi.mock("@/lib/server/models", () => ({
  GAME_TYPES: ["anzan", "dictation"],
  GameSession: { findOneAndDelete: async () => state.session },
  Game: {
    findOne: (q) => ({ lean: async () => state.games[q.level] ?? null }),
    exists: async (q) => !!state.games[q.level],
  },
  GameScore: {
    findOneAndUpdate: async (filter, update) => {
      state.updates.push({ filter, update });
      if (filter.level !== undefined && filter.level !== state.score.level) return null;
      if (update.$set?.level !== undefined) state.score.level = update.$set.level;
      state.score.marks += update.$inc.marks;
      return { ...state.score };
    },
  },
  PaperHistory: { findByIdAndUpdate: async () => ({ _id: "x", marks: 5 }) },
  User: {}, Paper: {},
}));

const { POST: finish } = await import("@/app/api/games/[type]/finish/route.js");
const { PATCH: setMarks } = await import("@/app/api/papers/history/[id]/route.js");

const req = (body, origin) => new Request("http://localhost/api/x", {
  method: "POST",
  headers: { "content-type": "application/json", ...(origin ? { origin } : {}) },
  body: JSON.stringify(body),
});
const ctx = (params) => ({ params: Promise.resolve(params) });
const SID = "507f1f77bcf86cd799439011";

beforeEach(() => {
  state.user = { _id: "u1", isAdmin: false, name: "Sam" };
  state.score = { level: 15, marks: 10 };
  state.games = { 15: { passMark: 10, settings: [] }, 14: { passMark: 10, settings: [] } };
  state.updates = [];
  state.session = {
    level: 15,
    startedAt: new Date(Date.now() - 60000),
    questions: [
      { type: "addition", numbers: [1, 2], answer: 3 },
      { type: "addition", numbers: [4, 4], answer: 8 },
      { type: "multiplication", numbers: [3, 3], answer: 9 },
    ],
  };
});

describe("game finish", () => {
  it("marks on the server and moves the student up a level", async () => {
    const res = await finish(req({ sessionId: SID, answers: [{ answer: 3, seconds: 2 }, { answer: 8, seconds: 3 }, { answer: 9, seconds: 4 }] }), ctx({ type: "anzan" }));
    const { data } = await res.json();
    expect(data).toMatchObject({ marks: 14, bonus: 2, correct: 3, passed: true, levelUp: true, newLevel: 14, totalMarks: 24 });
  });

  it("ignores what the browser claims and checks the real answers", async () => {
    const res = await finish(req({ sessionId: SID, answers: [{ answer: 999, seconds: 1 }, { answer: 8, seconds: 1 }, { answer: null, seconds: 1 }] }), ctx({ type: "anzan" }));
    const { data } = await res.json();
    expect(data).toMatchObject({ correct: 1, wrong: 1, skipped: 1, passed: false, levelUp: false, newLevel: 15 });
    expect(data.gained).toBe(3); // 4 - 1, never negative
  });

  it("does not level up when the next level is not set up", async () => {
    delete state.games[14];
    const res = await finish(req({ sessionId: SID, answers: [{ answer: 3, seconds: 2 }, { answer: 8, seconds: 3 }, { answer: 9, seconds: 4 }] }), ctx({ type: "anzan" }));
    const { data } = await res.json();
    expect(data).toMatchObject({ passed: true, levelUp: false, newLevel: 15 });
  });

  it("rejects a replayed or unknown game", async () => {
    state.session = null;
    const res = await finish(req({ sessionId: SID, answers: [] }), ctx({ type: "anzan" }));
    expect(res.status).toBe(409);
  });

  it("rejects impossibly fast games", async () => {
    state.session.startedAt = new Date();
    const res = await finish(req({ sessionId: SID, answers: [{ answer: 3, seconds: 0 }, { answer: 8, seconds: 0 }, { answer: 9, seconds: 0 }] }), ctx({ type: "anzan" }));
    expect(res.status).toBe(400);
  });

  it("needs a login and blocks cross-site posts", async () => {
    state.user = null;
    expect((await finish(req({ sessionId: SID, answers: [] }), ctx({ type: "anzan" }))).status).toBe(401);
    state.user = { _id: "u1" };
    expect((await finish(req({ sessionId: SID, answers: [] }, "https://evil.example"), ctx({ type: "anzan" }))).status).toBe(403);
  });
});

describe("paper marks (old route had no login check)", () => {
  it("students cannot set marks", async () => {
    const r = new Request("http://localhost/api/x", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ marks: 100 }) });
    expect((await setMarks(r, ctx({ id: SID }))).status).toBe(403);
  });
  it("teachers can", async () => {
    state.user.isAdmin = true;
    const r = new Request("http://localhost/api/x", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ marks: 5 }) });
    expect((await setMarks(r, ctx({ id: SID }))).status).toBe(200);
  });
});
