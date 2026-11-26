// Builds a complete set of demo records for every collection the app uses.
// Pure: no database access, so it can be checked in tests.
import mongoose from "mongoose";
import { ANZAN, DICTATION, toGameDoc } from "./game-levels-spec.mjs";
import {
  generateAddition, generateAddSub, generateMultiplication, generateDivision,
} from "../src/lib/shared/numbers.js";

const { ObjectId } = mongoose.Types;

// Small seeded random generator so every run gives the same demo data.
function seeded(seed = 20261125) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GROUPS = ["Group A", "Group B", "Group C", "Group D"];
const STUDENTS = [
  ["Amaya", "Perera", "F"], ["Liam", "Fernando", "M"], ["Sofia", "Nguyen", "F"], ["Noah", "Silva", "M"],
  ["Isla", "Jayasinghe", "F"], ["Ethan", "Wilson", "M"], ["Mia", "Rodrigo", "F"], ["Lucas", "Bandara", "M"],
  ["Chloe", "Tan", "F"], ["Oliver", "Dias", "M"], ["Ava", "Kumar", "F"], ["Jack", "Wickramasinghe", "M"],
  ["Zara", "Ali", "F"], ["Leo", "Gunawardena", "M"], ["Ruby", "Chen", "F"], ["Arjun", "Patel", "M"],
  ["Emily", "Herath", "F"], ["Kai", "Yamamoto", "M"], ["Nethmi", "Rathnayake", "F"], ["Henry", "Brown", "M"],
  ["Ishara", "de Silva", "F"], ["Thomas", "Walker", "M"], ["Hana", "Sato", "F"], ["Dilan", "Mendis", "M"],
];
const SCHOOLS = ["Riverside Primary", "Hillcrest Public School", "St Mary's Primary", "Lakeview Grammar"];
const CITIES = ["Hobart", "Launceston", "Sandy Bay", "Kingston", "Glenorchy", "Bellerive"];

const daysAgo = (n, rnd) => new Date(Date.now() - n * 86400000 - Math.floor(rnd() * 8 * 3600000));
const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];
const phone = (n) => `0400 000 ${String(100 + n).padStart(3, "0")}`; // obviously fake numbers

// ---------- paper templates (paper level 10 = start, 1 = hardest) ----------
function paperTemplates() {
  const out = [];
  for (let level = 10; level >= 1; level--) {
    const step = 10 - level; // 0..9
    const digits = Math.min(1 + Math.floor(step / 3), 4);
    const rows = Math.min(3 + step, 10);
    const equations = [
      { type: "sum", num: 12, rows, digits: { min: 1, max: digits } },
      { type: "sub", num: 8, rows: Math.max(2, rows - 1), digits: { min: Math.max(1, digits - 1), max: digits } },
    ];
    if (step >= 3) equations.push({ type: "mul", num: 10, digits: { digits1: Math.min(1 + Math.floor(step / 3), 3), digits2: 1 } });
    if (step >= 5) equations.push({ type: "div", num: 10, digits: { numerator: Math.min(2 + Math.floor((step - 5) / 2), 4), denominator: 1 } });
    out.push({ _id: new ObjectId(), name: `Paper level ${level}`, level, equations, num_columns_format: 4 });
  }
  return out;
}

function questionsFor(template, rnd) {
  return template.equations.map((eq) => {
    const list = [];
    for (let i = 0; i < eq.num; i++) {
      if (eq.type === "sum") list.push(generateAddition({ digits: eq.digits, rows: eq.rows }, rnd));
      else if (eq.type === "sub") list.push(generateAddSub({ digits: eq.digits, rows: eq.rows }, rnd));
      else if (eq.type === "mul") list.push(generateMultiplication({ first: eq.digits.digits1, second: eq.digits.digits2 }, rnd));
      else list.push(generateDivision({ first: eq.digits.numerator, second: eq.digits.denominator }, rnd));
    }
    return { type: eq.type, equations: list };
  });
}

// ---------- course ----------
const VIDEOS = [
  "https://www.youtube.com/watch?v=xQDr0DFGL40",
  "https://www.youtube.com/watch?v=SkUdjlQy3rk",
];

const COURSE = {
  foundation: [
    ["Meet the soroban", "The frame, rods, beam and beads, and how to hold the soroban.", [
      ["video", "Parts of the soroban"],
      ["question", "Quick check: parts of the soroban", [["How many beads are below the beam on each rod?", "4"], ["What is the upper bead worth?", "5"], ["What is the name of the bar that divides the beads?", "beam"], ["How many beads are above the beam on each rod?", "1"]]],
    ]],
    ["Showing numbers 0–9", "Setting and reading single digits with thumb and index finger.", [
      ["video", "Setting numbers 1 to 9"],
      ["paper", "Worksheet: show the number"],
      ["question", "Read the soroban", [["Upper bead down and two lower beads up. Which number?", "7"], ["Only three lower beads up. Which number?", "3"], ["Upper bead down, no lower beads. Which number?", "5"], ["All four lower beads up, upper bead down. Which number?", "9"]]],
    ]],
  ],
  beginner: [
    ["Simple addition", "Adding without changing rods.", [
      ["video", "Direct addition"],
      ["question", "Direct addition practice", [["2 + 2", "4"], ["5 + 3", "8"], ["11 + 21", "32"], ["40 + 15", "55"]]],
    ]],
    ["Small friends (5)", "Using the pairs that make 5: 1+4, 2+3.", [
      ["video", "Small friends explained"],
      ["paper", "Worksheet: small friends"],
      ["question", "Small friends quiz", [["What is the small friend of 1?", "4"], ["What is the small friend of 2?", "3"], ["4 + 3", "7"], ["3 + 4", "7"]]],
    ]],
  ],
  pre_intermediate: [
    ["Big friends (10)", "Using the pairs that make 10 to carry to the next rod.", [
      ["video", "Big friends explained"],
      ["question", "Big friends quiz", [["What is the big friend of 7?", "3"], ["8 + 5", "13"], ["9 + 6", "15"], ["26 + 8", "34"]]],
    ]],
    ["Subtraction", "Taking away directly and with friends.", [
      ["video", "Subtraction on the soroban"],
      ["paper", "Worksheet: subtraction"],
    ]],
  ],
  intermediate: [
    ["Two-digit calculation", "Adding and subtracting columns of two-digit numbers.", [
      ["video", "Working left to right"],
      ["question", "Two-digit practice", [["45 + 37", "82"], ["90 - 46", "44"], ["38 + 27 - 15", "50"], ["72 - 18 + 6", "60"]]],
    ]],
    ["Introducing anzan", "Picturing the soroban in your head.", [
      ["video", "Mental soroban (anzan)"],
    ]],
  ],
  advance: [
    ["Multiplication", "Multiplying 2-digit by 1-digit numbers.", [
      ["video", "Multiplication method"],
      ["question", "Multiplication quiz", [["12 × 3", "36"], ["25 × 4", "100"], ["47 × 6", "282"], ["83 × 9", "747"]]],
    ]],
    ["Division", "Dividing by a 1-digit number.", [
      ["video", "Division method"],
      ["paper", "Worksheet: division"],
      ["question", "Division quiz", [["84 ÷ 4", "21"], ["96 ÷ 8", "12"], ["135 ÷ 5", "27"], ["672 ÷ 7", "96"]]],
    ]],
  ],
};

function buildCourse(pdfUrl) {
  const chapters = [];
  const lessons = [];
  let v = 0;
  for (const [level, list] of Object.entries(COURSE)) {
    list.forEach(([title, description, items], ci) => {
      const chapter = { _id: new ObjectId(), title, description, order: ci + 1, level };
      chapters.push(chapter);
      let order = 0;
      for (const [type, lt, qs] of items) {
        if (type === "paper" && !pdfUrl) continue; // needs Blob storage for the PDF
        order++;
        const base = { _id: new ObjectId(), type, icon: type, title: lt, order, chapter_id: chapter._id };
        if (type === "video") lessons.push({ ...base, video_link: [{ link: VIDEOS[v++ % VIDEOS.length], description: `Demo video. Replace it with your own lesson in Teacher → Course editor.` }] });
        else if (type === "paper") lessons.push({ ...base, download: [{ name: lt.replace("Worksheet: ", "Worksheet - "), description: "Print, complete and bring to class.", url: pdfUrl }] });
        else lessons.push({ ...base, questions: qs.map(([question, answer]) => ({ question, answer })) });
      }
    });
  }
  return { chapters, lessons };
}

function orderedLessonIds(chapters, lessons) {
  const levels = Object.keys(COURSE);
  const ch = new Map(chapters.map((c) => [String(c._id), c]));
  return [...lessons]
    .sort((a, b) => {
      const ca = ch.get(String(a.chapter_id)), cb = ch.get(String(b.chapter_id));
      return levels.indexOf(ca.level) - levels.indexOf(cb.level) || ca.order - cb.order || a.order - b.order;
    })
    .map((l) => ({ lesson: l, chapter: ch.get(String(l.chapter_id)) }));
}

// ---------- tutorials ----------
const TUTORIALS = [
  ["Holding the soroban", "<p>Place the soroban flat on the table with the beam closest to you a little below the middle. Rest your left hand on the left side of the frame to keep it still.</p><h2>Fingers</h2><ul><li><strong>Thumb</strong> pushes lower beads <em>up</em>.</li><li><strong>Index finger</strong> pushes lower beads <em>down</em> and moves the upper bead.</li></ul><p>Before each sum, run your index finger along the beam to clear the soroban to zero.</p>"],
  ["Reading numbers", "<p>A bead counts when it touches the beam. The upper bead is worth <strong>5</strong>, each lower bead <strong>1</strong>.</p><p>Choose a rod with a dot on the beam as the <em>units</em> rod. The rod to its left is tens, then hundreds.</p><blockquote>Tip: say the number aloud as you set it.</blockquote>"],
  ["Small friends: pairs that make 5", "<p>When you cannot add a number directly, use its <strong>small friend</strong>: the number that makes 5 with it.</p><ol><li>Add 4 to 1? Not enough lower beads.</li><li>Bring the 5 bead down and take away 4's friend, 1.</li><li>The soroban shows 5.</li></ol><p>Pairs: 1 + 4, 2 + 3.</p>"],
  ["Big friends: pairs that make 10", "<p>When a rod is full, carry to the next rod using the <strong>big friend</strong> — the number that makes 10.</p><p>Example: 7 + 6. Add 10 on the tens rod, then take away 4 (6's big friend) on the units rod. Answer: 13.</p><p>Pairs: 1 + 9, 2 + 8, 3 + 7, 4 + 6, 5 + 5.</p>"],
  ["Getting started with anzan", "<p>Anzan means calculating with a soroban you picture in your head.</p><ul><li>Start with 1-digit numbers and 2–3 rows.</li><li>Move your fingers as if the beads were there.</li><li>Speed up only once you are always correct.</li></ul><p>Try the <strong>Anzan</strong> game in practice mode at 2 seconds per number.</p>"],
  ["Preparing for a grading", "<p>Before a level test, practise the paper for your level every day for a week.</p><p>Time yourself, check answers with your teacher, and focus on the question types you get wrong most.</p>"],
];

// ---------- forum ----------
const FORUM = [
  ["How do I get faster at anzan?", "I keep losing track after 5 numbers at 1 second. Any tips?", [["Try 1.5 seconds for a week first, then go back to 1 second.", "admin"], ["I say the running total in my head after each number, it helps!", 3]]],
  ["What is the big friend of 6?", "I always mix up big friends and small friends.", [["Big friends make 10, so 6's big friend is 4. Small friends make 5.", "admin"]]],
  ["Dictation voice too quick", "The fast voice speed is very hard. Is that normal for level 12?", [["Use Medium speed in practice. Level games use the normal speed.", "admin"], ["Same for me, it gets easier after a few days.", 7]]],
  ["Which rod is the units rod?", "There are dots on the beam. Which one do I use?", [["Any rod with a dot can be the units rod. Pick one near the middle.", "admin"]]],
  ["Paper level 8 multiplication", "Do we have to show working on the paper?", []],
  ["Leaderboard question", "Do practice games count for the leaderboard?", [["Only level games count. Practice is for practice!", "admin"], ["Thanks!", 12]]],
  ["Best way to practise at home", "How many minutes a day should I practise?", [["10–15 minutes every day is better than one long session.", "admin"], ["I do one anzan game and one times-tables round each day.", 5], ["Me too!", 9]]],
  ["Number bonds of 100", "Is 30 + 70 the only bond for 30?", [["Yes, each number has one partner that makes 100.", 1]]],
];

/**
 * @param {{ adminEmail: string, adminName: string, adminHash: string, studentHash: string,
 *           fullLevels?: boolean, pdfUrl?: string|null }} opts
 */
export function buildDemoData(opts) {
  const rnd = seeded();
  const { adminEmail, adminName, adminHash, studentHash, fullLevels = false, pdfUrl = null } = opts;

  // users
  const admin = {
    _id: new ObjectId(), email: adminEmail.toLowerCase(), password: adminHash, isAdmin: true, name: adminName, sessionVersion: 0,
    profile: { birthday: "1990-01-01", address: "School office", gender: "Prefer not to say", city: "Hobart" },
  };
  const students = STUDENTS.map(([first, last, g], i) => ({
    _id: new ObjectId(),
    email: `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "") + "@example.com",
    password: studentHash,
    isAdmin: false,
    sessionVersion: 0,
    name: `${first} ${last}`,
    group: GROUPS[i % GROUPS.length],
    profile: {
      birthday: `${2013 + (i % 6)}-${String(1 + (i % 12)).padStart(2, "0")}-${String(1 + ((i * 7) % 28)).padStart(2, "0")}`,
      address: `${10 + i} Demo Street`, gender: g === "F" ? "Female" : "Male", city: pick(CITIES, rnd),
      postal_code: `70${String(i).padStart(2, "0")}`, school: pick(SCHOOLS, rnd), grade: `Year ${2 + (i % 6)}`,
    },
    guardian: {
      name: `${pick(["Kamal", "Sarah", "David", "Nadeesha", "Priya", "Michael", "Anna", "Ruwan"], rnd)} ${last}`,
      guardian_type: pick(["Father", "Mother", "Guardian"], rnd),
      email: `parent.${last}`.toLowerCase().replace(/[^a-z.]/g, "") + `${i}@example.com`,
      mobile: phone(i), profession: pick(["Engineer", "Nurse", "Teacher", "Accountant", "Chef", "Doctor"], rnd),
    },
    emergency: { name: `Emergency contact ${i + 1}`, relationship: pick(["Aunt", "Uncle", "Grandparent", "Neighbour"], rnd), mobile: phone(50 + i) },
    ...(i % 5 === 0 ? { special_note: "Demo note: needs glasses for reading the board." } : {}),
  }));
  const users = [admin, ...students];

  // game levels
  const shorten = (doc) => {
    if (fullLevels) return doc;
    // Demo: same digits and rows as the spec, but 10 + 5 + 5 questions so a test game takes a few minutes.
    const counts = [10, 5, 5];
    const settings = doc.settings.map((s, i) => ({ ...s, no_of_ques: counts[i] }));
    const n = 20;
    const max = n * 4 + Math.floor(n / 3) * 2;
    return { ...doc, settings, passMark: Math.round(max * 0.6) };
  };
  const games = [
    ...ANZAN.map((r) => shorten(toGameDoc("anzan", r, 60))),
    ...DICTATION.map((r) => shorten(toGameDoc("dictation", r, 60))),
  ].map((g) => ({ _id: new ObjectId(), ...g }));

  // scores: a spread of levels and marks so the leaderboard looks real
  const gamescores = [];
  students.forEach((s, i) => {
    const skill = 1 - i / STUDENTS.length; // earlier students are further ahead
    const anzanLevel = Math.max(1, 15 - Math.round(skill * 12 * (0.7 + rnd() * 0.3)));
    const dictLevel = Math.max(1, 15 - Math.round(skill * 10 * (0.6 + rnd() * 0.4)));
    gamescores.push(
      { _id: new ObjectId(), user: s._id, game_type: "anzan", level: anzanLevel, marks: (15 - anzanLevel) * 55 + Math.floor(rnd() * 60) },
      { _id: new ObjectId(), user: s._id, game_type: "dictation", level: dictLevel, marks: (15 - dictLevel) * 50 + Math.floor(rnd() * 60) },
      { _id: new ObjectId(), user: s._id, game_type: "paper", level: Math.max(1, 10 - Math.round(skill * 6)), marks: 0 },
    );
  });
  gamescores.push(
    { _id: new ObjectId(), user: admin._id, game_type: "anzan", level: 15, marks: 0 },
    { _id: new ObjectId(), user: admin._id, game_type: "dictation", level: 15, marks: 0 },
    { _id: new ObjectId(), user: admin._id, game_type: "paper", level: 10, marks: 0 },
  );

  // papers and history
  const papers = paperTemplates();
  const paperhistories = [];
  students.forEach((s, i) => {
    const current = gamescores.find((g) => g.user === s._id && g.game_type === "paper").level;
    // finished papers for the levels already passed, plus the current one (not marked yet)
    for (let lvl = Math.min(10, current + 2); lvl >= current; lvl--) {
      const t = papers.find((p) => p.level === lvl);
      const done = lvl > current;
      paperhistories.push({
        _id: new ObjectId(), user_id: String(s._id), level: lvl, num_columns_format: 4,
        marks: done ? 70 + Math.floor(rnd() * 30) : 0,
        date: daysAgo((lvl - current) * 14 + (i % 5), rnd),
        questions: questionsFor(t, rnd),
      });
    }
  });

  // basic pairs for paper "subtype" sections (small friends / big friends)
  const basic_equations = [];
  for (const [a, b] of [[1, 4], [2, 3], [3, 2], [4, 1], [4, 4], [3, 4], [4, 3], [2, 4], [4, 2], [1, 4]]) basic_equations.push({ _id: new ObjectId(), type: "sum", level: "small_friends", num1: a, num2: b });
  for (const [a, b] of [[7, 3], [8, 5], [9, 6], [6, 7], [5, 8], [9, 9], [7, 8], [6, 6]]) basic_equations.push({ _id: new ObjectId(), type: "sum", level: "big_friends", num1: a, num2: b });
  for (const [a, b] of [[5, 1], [6, 2], [7, 3], [8, 4], [5, 3], [6, 4], [7, 4], [5, 2]]) basic_equations.push({ _id: new ObjectId(), type: "sub", level: "small_friends", num1: a, num2: b });

  // course and each student's place in it
  const { chapters, lessons } = buildCourse(pdfUrl);
  const ordered = orderedLessonIds(chapters, lessons);
  const courselevels = [admin, ...students].map((u, i) => {
    const idx = u.isAdmin ? 0 : Math.min(ordered.length - 1, Math.floor((1 - (i - 1) / STUDENTS.length) * ordered.length * 0.8));
    const { lesson, chapter } = ordered[idx];
    return { _id: new ObjectId(), user: u._id, level: chapter.level, chapter_id: String(chapter._id), lesson_id: String(lesson._id) };
  });

  // tutorials
  const blogs = TUTORIALS.map(([title, description], i) => ({ _id: new ObjectId(), title, description, blognumber: i + 1, type: "tutorial", date: daysAgo(60 - i * 7, rnd) }));

  // forum
  const author = (who) => (who === "admin" ? admin._id : students[who % students.length]._id);
  const forumposts = FORUM.map(([topic, description, answers], i) => {
    const posted = 40 - i * 4;
    return {
      _id: new ObjectId(), topic, description, user_id: students[(i * 5 + 2) % students.length]._id, date: daysAgo(posted, rnd),
      answers: answers.map(([answer, who], k) => ({ _id: new ObjectId(), answer, user_id: author(who), date: daysAgo(Math.max(0, posted - 1 - k), rnd) })),
    };
  });

  return { users, gamescores, courselevels, games, papers, basic_equations, paperhistories, forumposts, blogs, chapters, courses: lessons };
}

/** A small one-page PDF worksheet (no extra libraries needed). */
export function demoWorksheetPdf() {
  const lines = [
    "Abacus Playground - demo worksheet",
    "",
    "Set each number on your soroban, then write what you see.",
    "",
    "1)  4        2)  7        3)  12       4)  35",
    "5)  58       6)  90       7)  106      8)  249",
    "",
    "Add on the soroban:",
    "9)  3 + 1 =       10)  5 + 4 =       11)  21 + 13 =",
    "12) 44 + 5 =      13)  60 + 27 =     14)  32 + 16 =",
    "",
    "Replace this file with your own worksheet in Teacher > Course editor.",
  ];
  const esc = (s) => s.replace(/[\\()]/g, (c) => `\\${c}`);
  const text = ["BT", "/F1 14 Tf", "60 780 Td", "20 TL", ...lines.map((l) => `(${esc(l)}) Tj T*`), "ET"].join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(Buffer.byteLength(out));
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out);
}
