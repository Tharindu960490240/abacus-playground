import mongoose from "mongoose";

// Collection names are pinned to the ones the old Express app created, so the
// existing Atlas database works without a data migration.
//
// Fixed: every `default: Date.now()` / `default: new Date()` was evaluated once
// when the server started, so all records got the server start time. Mongoose
// needs the function itself (`Date.now`).

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

function model(name, schema, collection) {
  return mongoose.models[name] || mongoose.model(name, schema, collection);
}

export const GROUPS = ["Group A", "Group B", "Group C", "Group D"];
export const COURSE_LEVELS = ["foundation", "beginner", "pre_intermediate", "intermediate", "advance"];
export const GAME_TYPES = ["anzan", "dictation"];

// ---------- users ----------
const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, maxlength: 1024, select: false },
    isAdmin: { type: Boolean, default: false, required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    group: { type: String, enum: GROUPS },
    avatarUrl: { type: String },
    // bumped on password change / logout-everywhere so old sessions stop working
    sessionVersion: { type: Number, default: 0 },
    profile: {
      birthday: String, address: String, gender: String, city: String,
      postal_code: String, school: String, grade: String,
    },
    guardian: {
      name: String, email: String, profession: String, home: String, mobile: String,
      guardian_type: { type: String, enum: ["Father", "Mother", "Guardian"] },
    },
    emergency: { name: String, home: String, mobile: String, relationship: String },
    special_note: String,
  },
  { timestamps: true }
);
export const User = model("User", userSchema, "users");

const scoreSchema = new Schema({
  game_type: { type: String, required: true },
  level: { type: Number, required: true, default: 15 },
  marks: { type: Number, required: true, default: 0 },
  user: { type: ObjectId, ref: "User", required: true, index: true },
});
scoreSchema.index({ game_type: 1, marks: -1 });
scoreSchema.index({ user: 1, game_type: 1 }, { unique: true });
export const GameScore = model("GameScore", scoreSchema, "gamescores");

const courseLevelSchema = new Schema({
  level: { type: String, default: "foundation" },
  chapter_id: { type: String, default: null },
  lesson_id: { type: String, default: null },
  user: { type: ObjectId, ref: "User", required: true, index: true },
});
export const CourseLevel = model("Courselevel", courseLevelSchema, "courselevels");

/** Creates the per-student rows the old register route created (now awaited). */
export async function initialiseStudent(userId) {
  await GameScore.bulkWrite(
    [
      { game_type: "anzan", level: 15 },
      { game_type: "dictation", level: 15 },
      { game_type: "paper", level: 10 },
    ].map((s) => ({
      updateOne: { filter: { user: userId, game_type: s.game_type }, update: { $setOnInsert: { ...s, marks: 0, user: userId } }, upsert: true },
    }))
  );
  await CourseLevel.updateOne(
    { user: userId },
    { $setOnInsert: { user: userId, level: "foundation", chapter_id: null, lesson_id: null } },
    { upsert: true }
  );
}

// ---------- games ----------
const sectionSchema = new Schema(
  {
    type: { type: String, enum: ["addition", "additionsubtraction", "multiplication", "division"], required: true },
    no_of_digits: Number,
    no_of_rows: Number,
    first_digit: Number,
    second_digit: Number,
    no_of_ques: { type: Number, required: true },
  },
  { _id: false }
);
const gameSchema = new Schema({
  gameType: { type: String, required: true, enum: GAME_TYPES },
  level: { type: Number, required: true },
  settings: { type: [sectionSchema], required: true },
  passMark: { type: Number, required: true },
});
gameSchema.index({ gameType: 1, level: 1 }, { unique: true });
export const Game = model("games", gameSchema, "games");

// One active game per student per type. Questions and answers stay on the
// server; the old flow handed the signing key to the browser, so any score
// could be forged.
const gameSessionSchema = new Schema({
  user: { type: ObjectId, ref: "User", required: true },
  gameType: { type: String, required: true },
  level: { type: Number, required: true },
  questions: { type: [Schema.Types.Mixed], required: true },
  startedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});
gameSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
gameSessionSchema.index({ user: 1, gameType: 1 });
export const GameSession = model("GameSession", gameSessionSchema, "gamesessions");

// ---------- papers ----------
const paperSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  equations: { type: Schema.Types.Mixed, required: true },
  num_columns_format: { type: Number, default: 4 },
  level: { type: Number, index: true },
});
export const Paper = model("Paper", paperSchema, "papers");

const basicEquationSchema = new Schema({
  type: { type: String, required: true },
  level: { type: String, required: true },
  num1: { type: Number, required: true },
  num2: { type: Number, required: true },
});
export const BasicEquation = model("Basic_Equations", basicEquationSchema, "basic_equations");

const paperHistorySchema = new Schema({
  level: { type: Number, required: true, default: 0 },
  marks: { type: Number, required: true, default: 0 },
  user_id: { type: String, required: true, index: true },
  questions: { type: Schema.Types.Mixed },
  date: { type: Date, default: Date.now },
  num_columns_format: { type: Number, default: 4 },
});
export const PaperHistory = model("paperhistory", paperHistorySchema, "paperhistories");

// ---------- forum ----------
const forumAnswerSchema = new Schema({
  answer: { type: String, required: true, maxlength: 5000 },
  user_id: { type: ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now },
});
const forumPostSchema = new Schema({
  topic: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 10000 },
  user_id: { type: ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now, index: true },
  answers: [forumAnswerSchema],
});
export const ForumPost = model("forumPosts", forumPostSchema, "forumposts");

// ---------- tutorials (old "blog") ----------
const blogSchema = new Schema({
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String }, // sanitised HTML
  date: { type: Date, required: true, default: Date.now },
  blognumber: { type: Number, required: true, index: true },
  type: { type: String, required: true, enum: ["course", "tutorial"] },
  imageUrl: { type: String },
});
export const Blog = model("Blog", blogSchema, "blogs");

// ---------- course ----------
const chapterSchema = new Schema(
  {
    description: { type: String, required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true },
    level: { type: String, required: true, enum: COURSE_LEVELS },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
// Fixed: the old code added this virtual after compiling the model and never
// enabled virtuals in JSON, so chapter lessons were never returned.
chapterSchema.virtual("chapterLessons", { ref: "Course", localField: "_id", foreignField: "chapter_id" });
export const Chapter = model("Chapter", chapterSchema, "chapters");

const courseSchema = new Schema({
  icon: { type: String, default: "video" },
  type: { type: String, required: true, enum: ["video", "paper", "question"] },
  title: { type: String, required: true },
  order: { type: Number, required: true },
  video_link: [{ description: String, link: String }],
  download: [{ description: String, name: String, path: String, url: String }],
  questions: [{ question: String, answer: String }],
  chapter_id: { type: ObjectId, ref: "Chapter", required: true, index: true },
});
export const Course = model("Course", courseSchema, "courses");

// ---------- login throttling ----------
const loginAttemptSchema = new Schema({
  key: { type: String, required: true, index: true },
  at: { type: Date, default: Date.now, expires: 60 * 15 },
});
export const LoginAttempt = model("LoginAttempt", loginAttemptSchema, "loginattempts");
