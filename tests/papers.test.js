import { describe, it, expect, vi } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

vi.mock("@/lib/server/models", () => ({ BasicEquation: { find: () => ({ select: () => ({ lean: async () => [] }) }) } }));
const { generateQuestions, answersFor, buildPaperDocx, equationsSchema, templateSchema } = await import("@/lib/server/papers");

describe("papers", () => {
  const equations = [
    { type: "sum", num: 6, rows: 3, digits: { min: 1, max: 2 } },
    { type: "sub", num: 4, rows: 2, digits: { min: 2, max: 2 } },
    { type: "mul", num: 3, digits: { digits1: 2, digits2: 1 } },
    { type: "div", num: 5, digits: { numerator: 3, denominator: 1 } },
  ];

  it("validates templates and rejects bad input", () => {
    expect(equationsSchema.parse(equations)).toHaveLength(4);
    expect(() => equationsSchema.parse([{ type: "sum", num: 5, rows: 3, digits: { min: 3, max: 1 } }])).toThrow();
    expect(() => templateSchema.parse({ name: "L1", equations })).toThrow(); // level is required now
    expect(templateSchema.parse({ name: "L1", level: 5, equations }).num_columns_format).toBe(4);
  });

  it("generates questions in the stored format with whole-number answers", async () => {
    const qs = await generateQuestions(equations);
    expect(qs.map((q) => q.type)).toEqual(["sum", "sub", "mul", "div"]);
    expect(qs[0].equations).toHaveLength(6);
    const ans = answersFor(qs);
    expect(ans.div.every(Number.isInteger)).toBe(true);
    expect(ans.sub.every((a) => a >= 0)).toBe(true);
    expect(ans.sum).toHaveLength(6);
  });

  it("answers old stored papers (including old non-exact division)", () => {
    expect(answersFor([{ type: "div", equations: [[10, 3]] }, { type: "sum", equations: [[5, 6]] }])).toEqual({ sum: [11], div: [3.33] });
  });

  it("builds a valid Word document", async () => {
    const qs = await generateQuestions(equations);
    const buf = await buildPaperDocx(qs, 4, { level: 7 });
    expect(buf.subarray(0, 2).toString()).toBe("PK");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "docx-"));
    const file = path.join(dir, "p.docx");
    fs.writeFileSync(file, buf);
    const xml = execFileSync("unzip", ["-p", file, "word/document.xml"]).toString();
    expect(xml).toContain("Level: 7");
    expect(xml).toContain("Multiplication");
    expect(xml).toContain(String(qs[2].equations[0][0]));
  });
});
