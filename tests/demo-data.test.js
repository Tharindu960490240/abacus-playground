import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  User, GameScore, CourseLevel, Game, Paper, BasicEquation, PaperHistory, ForumPost, Blog, Chapter, Course,
} from "@/lib/server/models";
import { buildDemoData, demoWorksheetPdf } from "../scripts/demo-data.mjs";
import { equationsSchema, answersFor } from "@/lib/server/papers";

const data = buildDemoData({ adminEmail: "TharinduMadusankaChika@gmail.com", adminName: "Tharindu", adminHash: "x".repeat(60), studentHash: "y".repeat(60), pdfUrl: "https://example.public.blob.vercel-storage.com/w.pdf" });
const MODELS = { users: User, gamescores: GameScore, courselevels: CourseLevel, games: Game, papers: Paper, basic_equations: BasicEquation, paperhistories: PaperHistory, forumposts: ForumPost, blogs: Blog, chapters: Chapter, courses: Course };

describe("demo data", () => {
  it("fills every collection and every record passes the app's schema", async () => {
    for (const [key, Model] of Object.entries(MODELS)) {
      expect(data[key].length, key).toBeGreaterThan(0);
      for (const doc of data[key]) {
        const err = await new Model(doc).validate().then(() => undefined, (e) => e);
        expect(err, `${key}: ${err?.message}`).toBeUndefined();
      }
    }
  });

  it("makes the given email the only admin (lower-cased)", () => {
    const admins = data.users.filter((u) => u.isAdmin);
    expect(admins.map((u) => u.email)).toEqual(["tharindumadusankachika@gmail.com"]);
    expect(new Set(data.users.map((u) => u.email)).size).toBe(data.users.length);
    expect(data.users.filter((u) => !u.isAdmin).every((u) => u.email.endsWith("@example.com"))).toBe(true);
  });

  it("gives every student scores for all three games, one row each", () => {
    const keys = data.gamescores.map((s) => `${s.user}:${s.game_type}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(data.gamescores.length).toBe(data.users.length * 3);
    const anzan = data.gamescores.filter((s) => s.game_type === "anzan" && s.marks > 0);
    expect(anzan.length).toBe(24); // all students show on the leaderboard
  });

  it("has a playable game for every level a student is on", () => {
    for (const s of data.gamescores.filter((g) => g.game_type !== "paper")) {
      expect(data.games.some((g) => g.gameType === s.game_type && g.level === s.level), `${s.game_type} ${s.level}`).toBe(true);
    }
    expect(data.games.filter((g) => g.gameType === "anzan")).toHaveLength(15);
    expect(data.games.filter((g) => g.gameType === "dictation")).toHaveLength(20);
    expect(data.games[0].settings.reduce((n, s) => n + s.no_of_ques, 0)).toBe(20);
  });

  it("has valid paper templates and papers for each student's level", () => {
    for (const p of data.papers) equationsSchema.parse(p.equations);
    for (const s of data.gamescores.filter((g) => g.game_type === "paper" && !String(g.user).startsWith("x"))) {
      expect(data.papers.some((p) => p.level === s.level)).toBe(true);
    }
    for (const h of data.paperhistories) expect(Object.keys(answersFor(h.questions)).length).toBeGreaterThan(0);
  });

  it("points every student's course progress at a real lesson", () => {
    const lessons = new Set(data.courses.map((c) => String(c._id)));
    for (const p of data.courselevels) expect(lessons.has(p.lesson_id)).toBe(true);
    expect(new Set(data.chapters.map((c) => c.level)).size).toBe(5);
  });

  it("links forum answers to real users", () => {
    const ids = new Set(data.users.map((u) => String(u._id)));
    for (const p of data.forumposts) {
      expect(ids.has(String(p.user_id))).toBe(true);
      for (const a of p.answers) expect(ids.has(String(a.user_id))).toBe(true);
    }
  });

  it("skips worksheet lessons when there is no Blob storage", () => {
    const noBlob = buildDemoData({ adminEmail: "a@b.co", adminName: "A", adminHash: "x", studentHash: "y" });
    expect(noBlob.courses.some((c) => c.type === "paper")).toBe(false);
    expect(data.courses.some((c) => c.type === "paper")).toBe(true);
  });

  it("makes a readable worksheet PDF", () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "pdf-")), "w.pdf");
    fs.writeFileSync(file, demoWorksheetPdf());
    const text = execFileSync("pdftotext", [file, "-"]).toString();
    expect(text).toContain("demo worksheet");
  });
});
