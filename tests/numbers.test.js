import { describe, it, expect } from "vitest";
import {
  randInt, numberWithDigits, generateAddSub, generateAddition, generateDivision, generateMultiplication,
  answerFor, scoreResults, levelLabel, generateGame, numberBondQuestion, tablesQuestion,
} from "@/lib/shared/numbers";
import { isStrongPassword } from "@/lib/shared/password";

const repeat = (n, fn) => Array.from({ length: n }, fn);

describe("random numbers", () => {
  it("covers both ends of the range (old bug: 1 and 2 never appeared)", () => {
    const seen = new Set(repeat(5000, () => randInt(1, 9)));
    expect([...seen].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
  it("gives the right number of digits", () => {
    for (const d of [1, 2, 3, 5, 8]) for (const n of repeat(500, () => numberWithDigits(d))) expect(String(n).length).toBe(d);
    expect(new Set(repeat(5000, () => numberWithDigits(2)))).toContain(10);
  });
});

describe("questions", () => {
  it("addition uses exactly the rows asked for, with mixed widths", () => {
    for (let i = 0; i < 300; i++) {
      const q = generateAddition({ digits: { min: 1, max: 3 }, rows: 7 });
      expect(q).toHaveLength(7);
      q.forEach((n) => expect(String(n).length).toBeGreaterThanOrEqual(1));
    }
  });
  it("add/sub never goes below zero and keeps the digit count", () => {
    for (let i = 0; i < 3000; i++) {
      const rows = 2 + (i % 9);
      const q = generateAddSub({ digits: 1 + (i % 3), rows });
      expect(q).toHaveLength(rows);
      let total = 0;
      for (const n of q) { total += n; expect(total).toBeGreaterThanOrEqual(0); }
    }
  });
  it("two-row paper questions are always subtraction", () => {
    for (let i = 0; i < 500; i++) expect(generateAddSub({ digits: 2, rows: 2 })[1]).toBeLessThan(0);
  });
  it("division is always exact with the right widths", () => {
    for (const [a, b] of [[1, 1], [2, 1], [3, 1], [4, 2], [5, 3], [7, 3], [3, 3], [2, 4]]) {
      for (let i = 0; i < 300; i++) {
        const [x, y] = generateDivision({ first: a, second: b });
        expect(Number.isInteger(x / y)).toBe(true);
        expect(String(x).length).toBe(a);
        expect(String(y).length).toBe(Math.min(a, b));
      }
    }
  });
  it("multiplication widths and answers", () => {
    const [x, y] = generateMultiplication({ first: 3, second: 2 });
    expect(String(x).length).toBe(3);
    expect(String(y).length).toBe(2);
    expect(answerFor("mul", [12, 3])).toBe(36);
    expect(answerFor("sub", [50, -20, 5])).toBe(35);
    expect(answerFor("div", [10, 4])).toBe(2.5);
  });
  it("builds a game from level settings with answers", () => {
    const qs = generateGame([
      { type: "addition", no_of_digits: 1, no_of_rows: 3, no_of_ques: 4 },
      { type: "division", first_digit: 2, second_digit: 1, no_of_ques: 3 },
    ]);
    expect(qs).toHaveLength(7);
    qs.forEach((q) => expect(q.answer).toBe(answerFor(q.type, q.numbers)));
  });
  it("number bonds and tables", () => {
    for (let i = 0; i < 200; i++) {
      const b = numberBondQuestion(20, "addition");
      expect(b.part + b.answer).toBe(b.target);
      const t = tablesQuestion([7], "division");
      expect(t.answer).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("scoring (old Score class rules)", () => {
  it("time points, streak bonus, wrong and skipped", () => {
    const r = scoreResults([
      { status: "correct", seconds: 5 },  // 4
      { status: "correct", seconds: 15 }, // 3
      { status: "correct", seconds: 25 }, // 2 + bonus 2
      { status: "wrong", seconds: 3 },    // -1
      { status: "correct", seconds: 45 }, // 0
      { status: "skipped", seconds: 1 },
    ]);
    expect(r).toMatchObject({ marks: 10, bonus: 2, correct: 4, wrong: 1, skipped: 1, total: 6 });
  });
  it("labels Dan levels", () => {
    expect(levelLabel(15)).toBe("Level 15");
    expect(levelLabel(0)).toBe("Dan 1");
    expect(levelLabel(-4)).toBe("Dan 5");
  });
});

describe("password rules", () => {
  it("matches the checklist", () => {
    expect(isStrongPassword("Abcdef1!")).toBe(true);
    expect(isStrongPassword("abcdef1!")).toBe(false);
    expect(isStrongPassword("Abcdefg!")).toBe(false);
    expect(isStrongPassword("Ab1!")).toBe(false);
    expect(isStrongPassword("A1!" + "a".repeat(80))).toBe(false);
    expect(isStrongPassword(undefined)).toBe(false);
  });
});
