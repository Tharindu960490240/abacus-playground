// Question generation and scoring shared by the browser (practice mode) and the
// server (game mode and printable papers). Pure functions, no I/O.
//
// Fixes compared with the old common/generator.js and the Angular components:
//  - randInt had its bounds swapped, so 1-digit questions never used 1 or 2 and
//    2-digit questions never used 10 or 11. It is now inclusive on both ends.
//  - subtraction never lets the running total go below zero (abacus rule).
//  - division always divides exactly, so every answer is a whole number.
//  - mixed digit ranges always give exactly the number of rows asked for.

export function randInt(min, max, rnd = Math.random) {
  const lo = Math.ceil(Math.min(min, max));
  const hi = Math.floor(Math.max(min, max));
  return Math.floor(rnd() * (hi - lo + 1)) + lo;
}

export function rangeForDigits(digits) {
  const d = Math.max(1, Math.floor(digits));
  return { min: d === 1 ? 1 : 10 ** (d - 1), max: 10 ** d - 1 };
}

export function numberWithDigits(digits, rnd = Math.random) {
  const { min, max } = rangeForDigits(digits);
  return randInt(min, max, rnd);
}

/** Labels: 15..1 are kyu levels, 0..-4 are Dan 1..5. */
export function levelLabel(level) {
  const n = Number(level);
  if (!Number.isFinite(n)) return "-";
  return n >= 1 ? `Level ${n}` : `Dan ${1 - n}`;
}

function normaliseDigits(digits) {
  if (typeof digits === "number") return { min: digits, max: digits };
  const min = Math.max(1, Number(digits?.min ?? 1));
  const max = Math.max(min, Number(digits?.max ?? min));
  return { min, max };
}

/** Rows of positive numbers to add. */
export function generateAddition({ digits, rows }, rnd = Math.random) {
  const { min, max } = normaliseDigits(digits);
  const out = [];
  for (let i = 0; i < rows; i++) out.push(numberWithDigits(randInt(min, max, rnd), rnd));
  return out;
}

/**
 * Rows for mixed addition/subtraction. Negative numbers are subtracted.
 * The running total never drops below zero. On papers a two-row question is
 * always a subtraction (as before); otherwise about `minusChance` of the rows
 * after the first are.
 */
export function generateAddSub({ digits, rows, minusChance = 0.3, forceTwoRowMinus = true }, rnd = Math.random) {
  const { min, max } = normaliseDigits(digits);
  const out = [];
  let total = 0;
  for (let i = 0; i < rows; i++) {
    const d = randInt(min, max, rnd);
    const range = rangeForDigits(d);
    const forced = rows === 2 && forceTwoRowMinus;
    const wantMinus = i > 0 && (forced || rnd() < minusChance);
    if (wantMinus && total >= range.min) {
      const n = randInt(range.min, Math.min(range.max, total), rnd);
      out.push(-n);
      total -= n;
    } else if (wantMinus && total >= 1 && forced) {
      // total is smaller than the smallest number of this width: use a narrower one
      const n = randInt(1, total, rnd);
      out.push(-n);
      total -= n;
    } else {
      const n = randInt(range.min, range.max, rnd);
      out.push(n);
      total += n;
    }
  }
  return out;
}

export function generateMultiplication({ first, second }, rnd = Math.random) {
  return [numberWithDigits(first, rnd), numberWithDigits(second, rnd)];
}

/** Exact division: dividend has `first` digits, divisor `second` digits. */
export function generateDivision({ first, second }, rnd = Math.random) {
  const dRange = rangeForDigits(first);
  const sDigits = Math.min(second, first);
  const sRange = rangeForDigits(sDigits);
  for (let attempt = 0; attempt < 200; attempt++) {
    const allowTrivial = attempt > 150;
    const divisor = randInt(allowTrivial ? sRange.min : Math.max(2, sRange.min), sRange.max, rnd);
    const qMin = Math.max(allowTrivial ? 1 : 2, Math.ceil(dRange.min / divisor));
    const qMax = Math.floor(dRange.max / divisor);
    if (qMin > qMax) continue;
    const quotient = randInt(qMin, qMax, rnd);
    return [divisor * quotient, divisor];
  }
  return [dRange.max, 1];
}

export function answerFor(type, numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return null;
  switch (type) {
    case "mul":
    case "multiplication":
      return numbers.reduce((a, b) => a * b, 1);
    case "div":
    case "division": {
      const q = numbers.slice(1).reduce((a, b) => a / b, numbers[0]);
      return Number.isInteger(q) ? q : Math.round(q * 100) / 100;
    }
    default:
      return numbers.reduce((a, b) => a + b, 0);
  }
}

/** Section types used by game level settings (kept compatible with the existing `games` collection). */
export const SECTION_TYPES = ["addition", "additionsubtraction", "multiplication", "division"];

export function generateSection(section, rnd = Math.random) {
  const count = Math.max(0, Number(section.no_of_ques || 0));
  const out = [];
  for (let i = 0; i < count; i++) {
    let numbers;
    switch (section.type) {
      case "addition":
        numbers = generateAddition({ digits: section.no_of_digits, rows: section.no_of_rows }, rnd);
        break;
      case "additionsubtraction":
        numbers = generateAddSub({ digits: section.no_of_digits, rows: section.no_of_rows, minusChance: 0.4, forceTwoRowMinus: false }, rnd);
        break;
      case "multiplication":
        numbers = generateMultiplication({ first: section.first_digit, second: section.second_digit }, rnd);
        break;
      case "division":
        numbers = generateDivision({ first: section.first_digit, second: section.second_digit }, rnd);
        break;
      default:
        continue;
    }
    out.push({ type: section.type, numbers, answer: answerFor(section.type, numbers) });
  }
  return out;
}

export function generateGame(settings, rnd = Math.random) {
  return (settings || []).flatMap((s) => generateSection(s, rnd));
}

// ---------- scoring (same rules as the old Score class) ----------
export const MAX_SECONDS_FOR_POINTS = 40;
export const STREAK_LENGTH = 3;
export const STREAK_BONUS = 2;

export function pointsForTime(seconds) {
  if (seconds <= 10) return 4;
  if (seconds <= 20) return 3;
  if (seconds <= 30) return 2;
  if (seconds <= 40) return 1;
  return 0;
}

/**
 * results: [{ status: "correct" | "wrong" | "skipped", seconds }]
 * Correct: 4/3/2/1/0 points by answer time. Every 3 correct answers in a row
 * within 40 seconds adds a 2 point bonus. Wrong: -1. Skipped: 0.
 * Both wrong and skipped break the streak.
 */
export function scoreResults(results) {
  let marks = 0, bonus = 0, streak = 0, correct = 0, wrong = 0, skipped = 0;
  for (const r of results) {
    if (r.status === "correct") {
      correct++;
      const secs = Math.max(0, Number(r.seconds) || 0);
      marks += pointsForTime(secs);
      if (secs <= MAX_SECONDS_FOR_POINTS) {
        streak++;
        if (streak === STREAK_LENGTH) {
          marks += STREAK_BONUS;
          bonus += STREAK_BONUS;
          streak = 0;
        }
      } else streak = 0;
    } else if (r.status === "wrong") {
      wrong++;
      marks -= 1;
      streak = 0;
    } else {
      skipped++;
      streak = 0;
    }
  }
  return { marks, bonus, correct, wrong, skipped, total: results.length };
}

export function maxScoreFor(questionCount) {
  return questionCount * 4 + Math.floor(questionCount / STREAK_LENGTH) * STREAK_BONUS;
}

// ---------- number bonds and times tables ----------
export function numberBondQuestion(bond, operation, rnd = Math.random) {
  const pools = { 5: [5], 10: [10], 15: [5, 10], 20: [5, 10, 100] };
  const pool = pools[bond] || [10];
  const target = pool[randInt(0, pool.length - 1, rnd)];
  const part = target === 100 ? randInt(0, 10, rnd) * 10 : randInt(0, target - 1, rnd);
  // addition: part + ? = target     subtraction: target - part = ?
  return operation === "subtraction"
    ? { text: `${target} − ${part} = ?`, answer: target - part, target, part }
    : { text: `${part} + ? = ${target}`, answer: target - part, target, part };
}

export function tablesQuestion(tables, operation, rnd = Math.random) {
  const a = tables[randInt(0, tables.length - 1, rnd)];
  const b = randInt(1, 9, rnd);
  return operation === "division"
    ? { text: `${a * b} ÷ ${a} = ?`, answer: b }
    : { text: `${a} × ${b} = ?`, answer: a * b };
}
