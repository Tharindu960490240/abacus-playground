import { z } from "zod";
import { COURSE_LEVELS } from "./models";

export const chapterSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(5000),
  order: z.coerce.number().int().min(0).max(10000),
  level: z.enum(COURSE_LEVELS),
});

const videoLink = z.object({ description: z.string().trim().max(300).default(""), link: z.url("Enter a full video link (https://...)").max(500) });
const download = z.object({ description: z.string().trim().max(300).default(""), name: z.string().trim().max(200), url: z.string().max(1000) });
const question = z.object({ question: z.string().trim().min(1).max(1000), answer: z.string().trim().min(1).max(200) });

export const lessonSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("video"), title: z.string().trim().min(1).max(200), order: z.coerce.number().int().min(0), chapter_id: z.string(), video_link: z.array(videoLink).min(1).max(20) }),
  z.object({ type: z.literal("paper"), title: z.string().trim().min(1).max(200), order: z.coerce.number().int().min(0), chapter_id: z.string(), download: z.array(download).min(1).max(20) }),
  z.object({ type: z.literal("question"), title: z.string().trim().min(1).max(200), order: z.coerce.number().int().min(0), chapter_id: z.string(), questions: z.array(question).min(1).max(100) }),
]);

export const QUIZ_PASS_PERCENT = 75;

export function normaliseAnswer(a) {
  return String(a ?? "").trim().toLowerCase().replace(/\s+/g, " ").replace(/,/g, "");
}
