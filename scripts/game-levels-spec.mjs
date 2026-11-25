// Transcribed from "game mode data.docx". Levels 15..1, then Dan 1..5 stored as
// levels 0..-4 (shown as "Dan 1".."Dan 5").
// Format: [level, addSub [digits, rows, questions], mul [first, second, questions], div [first, second, questions]]
// Note: the spec lists dictation level 10 division as "multiplication"; it is treated as division here.
export const ANZAN = [
  [15, [1, 2, 30], [1, 1, 30], [1, 1, 30]],
  [14, [1, 3, 30], [1, 1, 30], [1, 1, 30]],
  [13, [1, 5, 30], [1, 1, 30], [2, 1, 30]],
  [12, [1, 10, 20], [2, 1, 30], [2, 1, 30]],
  [11, [1, 15, 20], [1, 2, 30], [2, 1, 30]],
  [10, [2, 2, 20], [2, 1, 30], [2, 1, 30]],
  [9, [2, 3, 20], [3, 1, 30], [3, 1, 30]],
  [8, [2, 4, 20], [1, 3, 30], [3, 1, 30]],
  [7, [2, 5, 20], [3, 1, 30], [3, 1, 30]],
  [6, [2, 6, 20], [1, 3, 30], [3, 1, 30]],
  [5, [2, 7, 20], [3, 1, 30], [3, 1, 30]],
  [4, [2, 10, 20], [1, 3, 30], [3, 1, 30]],
  [3, [3, 5, 20], [3, 1, 30], [4, 1, 30]],
  [2, [3, 7, 20], [2, 2, 30], [4, 2, 30]],
  [1, [3, 10, 20], [3, 3, 30], [5, 3, 30]],
];

export const DICTATION = [
  [15, [1, 2, 50], [1, 1, 30], [1, 1, 30]],
  [14, [1, 3, 50], [1, 1, 30], [1, 1, 30]],
  [13, [1, 5, 50], [1, 1, 30], [1, 1, 30]],
  [12, [1, 7, 50], [1, 1, 30], [1, 1, 30]],
  [11, [1, 10, 50], [1, 1, 30], [1, 1, 30]],
  [10, [2, 2, 30], [1, 1, 30], [1, 1, 30]],
  [9, [2, 3, 30], [1, 1, 30], [2, 1, 30]],
  [8, [2, 4, 20], [2, 1, 30], [2, 1, 30]],
  [7, [2, 5, 20], [1, 2, 30], [3, 1, 30]],
  [6, [2, 10, 20], [3, 1, 30], [3, 1, 30]],
  [5, [3, 5, 20], [1, 3, 30], [4, 1, 30]],
  [4, [3, 10, 20], [2, 2, 30], [2, 2, 30]],
  [3, [4, 5, 20], [3, 2, 30], [3, 2, 30]],
  [2, [4, 10, 20], [3, 3, 30], [4, 2, 30]],
  [1, [5, 5, 20], [4, 2, 30], [4, 3, 30]],
  [0, [5, 10, 20], [4, 3, 30], [4, 3, 30]],
  [-1, [7, 5, 20], [3, 4, 30], [5, 3, 30]],
  [-2, [7, 10, 20], [5, 3, 30], [6, 2, 30]],
  [-3, [8, 5, 20], [6, 3, 30], [6, 3, 30]],
  [-4, [8, 10, 20], [7, 4, 30], [7, 3, 30]],
];

export function toGameDoc(gameType, [level, as, mul, div], passPercent) {
  const settings = [
    { type: "additionsubtraction", no_of_digits: as[0], no_of_rows: as[1], no_of_ques: as[2] },
    { type: "multiplication", first_digit: mul[0], second_digit: mul[1], no_of_ques: mul[2] },
    { type: "division", first_digit: div[0], second_digit: div[1], no_of_ques: div[2] },
  ];
  const count = settings.reduce((n, s) => n + s.no_of_ques, 0);
  const max = count * 4 + Math.floor(count / 3) * 2;
  return { gameType, level, settings, passMark: Math.round((max * passPercent) / 100) };
}
