import {
  AlignmentType, BorderStyle, Document, Packer, PageBreak, Paragraph, Table, TableCell,
  TableRow, TextRun, WidthType,
} from "docx";
import { z } from "zod";
import { BasicEquation } from "./models";
import {
  answerFor, generateAddSub, generateAddition, generateDivision, generateMultiplication, randInt,
} from "../shared/numbers";

// Paper template format (unchanged, so existing `papers` documents still work):
//   { type: "sum" | "sub", num, rows, digits: { min, max }, subtype? }
//   { type: "mul", num, digits: { digits1, digits2 } }
//   { type: "div", num, digits: { numerator, denominator } }
// Generated questions are stored as [{ type, equations: number[][] }] like before.

const int = (min, max) => z.coerce.number().int().min(min).max(max);

export const equationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.enum(["sum", "sub"]),
    num: int(1, 200),
    rows: int(2, 30),
    digits: z.object({ min: int(1, 9), max: int(1, 9) }).refine((d) => d.max >= d.min, "max digits must be ≥ min digits"),
    subtype: z.string().max(40).optional(),
  }),
  z.object({ type: z.literal("mul"), num: int(1, 200), digits: z.object({ digits1: int(1, 7), digits2: int(1, 7) }) }),
  z.object({ type: z.literal("div"), num: int(1, 200), digits: z.object({ numerator: int(1, 9), denominator: int(1, 7) }) }),
]);
export const equationsSchema = z.array(equationSchema).min(1).max(30);
export const columnsSchema = int(1, 8).default(4);

export const templateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  // Fixed: the old save never stored a level, so students' "create paper" could never find one.
  level: z.coerce.number().int().min(-10).max(100),
  equations: equationsSchema,
  num_columns_format: columnsSchema,
});

async function generateBasic(eq) {
  const rows = await BasicEquation.find({ type: eq.type, level: eq.subtype }).select("num1 num2 -_id").lean();
  if (!rows.length) return null;
  const pool = rows.map((r) => [r.num1, r.num2]);
  const out = [];
  while (out.length < eq.num) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    out.push(...shuffled.slice(0, eq.num - out.length).map((p) => [...p]));
  }
  // Scale the basic pairs up to the requested width (e.g. 3 + 4 -> 30 + 40).
  if (eq.digits && eq.digits.max > 1) {
    for (const pair of out) {
      const d1 = randInt(eq.digits.min, eq.digits.max);
      const d2 = randInt(eq.digits.min, d1);
      pair[0] *= 10 ** (d1 - 1);
      pair[1] *= 10 ** (d2 - 1);
    }
  }
  if (eq.type === "sub") for (const pair of out) pair[1] = -Math.min(Math.abs(pair[1]), pair[0]);
  return out;
}

export async function generateQuestions(equations) {
  const result = [];
  for (const eq of equations) {
    let list = [];
    if ((eq.type === "sum" || eq.type === "sub") && eq.subtype && eq.subtype !== "normal") {
      list = (await generateBasic(eq)) || [];
    } else {
      for (let i = 0; i < eq.num; i++) {
        if (eq.type === "sum") list.push(generateAddition({ digits: eq.digits, rows: eq.rows }));
        else if (eq.type === "sub") list.push(generateAddSub({ digits: eq.digits, rows: eq.rows }));
        else if (eq.type === "mul") list.push(generateMultiplication({ first: eq.digits.digits1, second: eq.digits.digits2 }));
        else if (eq.type === "div") list.push(generateDivision({ first: eq.digits.numerator, second: eq.digits.denominator }));
      }
    }
    result.push({ type: eq.type, equations: list });
  }
  return result;
}

/** Answer key grouped by type, numbered in the same order as the printed paper. */
export function answersFor(questions) {
  const out = {};
  for (const type of ["sum", "sub", "mul", "div"]) {
    const list = (questions || []).filter((q) => q.type === type).flatMap((q) => q.equations || []);
    if (list.length) out[type] = list.map((nums) => answerFor(type, nums));
  }
  return out;
}

// ---------- Word document ----------
const FONT = "Comic Sans MS";
const thin = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const borders = { top: thin, bottom: thin, left: thin, right: thin };

const text = (t, opts = {}) => new TextRun({ text: String(t), font: FONT, size: 24, ...opts });

function columnCell(index, numbers, widthPct) {
  const lines = [
    new Paragraph({ alignment: AlignmentType.LEFT, children: [text(`${index}.`, { bold: true, size: 20 })] }),
    ...numbers.map((n) => new Paragraph({ alignment: AlignmentType.RIGHT, children: [text(n < 0 ? `− ${Math.abs(n)}` : n)] })),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      border: { top: { style: BorderStyle.SINGLE, size: 8, color: "000000", space: 2 } },
      children: [text(" ")],
    }),
  ];
  return new TableCell({ children: lines, borders, width: { size: widthPct, type: WidthType.PERCENTAGE }, margins: { left: 120, right: 160, top: 60, bottom: 60 } });
}

function columnTables(questions, columns) {
  const tables = [];
  const width = Math.floor(100 / columns);
  for (let i = 0; i < questions.length; i += columns) {
    const chunk = questions.slice(i, i + columns);
    const cells = chunk.map((nums, j) => columnCell(i + j + 1, nums, width));
    while (cells.length < columns) cells.push(new TableCell({ children: [new Paragraph("")], borders, width: { size: width, type: WidthType.PERCENTAGE } }));
    tables.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: cells, cantSplit: true })] }));
    tables.push(new Paragraph(""));
  }
  return tables;
}

function lineQuestions(list, sign, start) {
  const rows = [];
  for (let i = 0; i < list.length; i += 2) {
    const cells = [0, 1].map((k) => {
      const q = list[i + k];
      const content = q ? `${start + i + k}.   ${q[0]} ${sign} ${q[1]} =` : "";
      return new TableCell({ borders, width: { size: 50, type: WidthType.PERCENTAGE }, margins: { left: 160, top: 120, bottom: 120 }, children: [new Paragraph({ children: [text(content)] })] });
    });
    rows.push(new TableRow({ children: cells, cantSplit: true }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

export async function buildPaperDocx(questions, columns = 4, { title = "Abacus practice paper", level } = {}) {
  const flat = (type) => (questions || []).filter((q) => q.type === type).flatMap((q) => q.equations || []);
  const addSub = [...flat("sum"), ...flat("sub")];
  const mul = flat("mul");
  const div = flat("div");

  const children = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [text(title, { bold: true, size: 32 })] }),
    new Paragraph({
      spacing: { after: 240 },
      children: [text(`Name: ______________________    Date: ____________${level != null ? `    Level: ${level}` : ""}    Marks: ______`, { size: 22 })],
    }),
  ];
  if (addSub.length) children.push(...columnTables(addSub, Math.max(1, Math.min(8, columns))));
  if (mul.length || div.length) {
    if (addSub.length) children.push(new Paragraph({ children: [new PageBreak()] }));
    if (mul.length) {
      children.push(new Paragraph({ spacing: { after: 120 }, children: [text("Multiplication", { bold: true })] }), lineQuestions(mul, "×", 1));
      children.push(new Paragraph(""));
    }
    if (div.length) {
      children.push(new Paragraph({ spacing: { after: 120 }, children: [text("Division", { bold: true })] }), lineQuestions(div, "÷", 1));
    }
  }
  const doc = new Document({
    creator: "Abacus Playground",
    title,
    sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children }],
  });
  return Packer.toBuffer(doc);
}

export function docxResponse(buffer, filename) {
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename.replace(/[^\w.\- ]+/g, "")}"`,
      "Cache-Control": "no-store",
    },
  });
}
