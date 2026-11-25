"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {
  PlayArrowRounded, StopRounded, VolumeOffRounded, VolumeUpRounded, ReplayRounded, SkipNextRounded,
  EmojiEventsRounded, SchoolRounded,
} from "@mui/icons-material";
import { api } from "@/lib/client/api";
import { useNotify } from "@/components/NotifyProvider";
import { useSounds } from "@/components/useSounds";
import Soroban from "@/components/Soroban";
import FeatureIcon from "@/components/FeatureIcon";
import ResultsDialog from "./ResultsDialog";
import {
  answerFor, generateAddSub, generateAddition, generateDivision, generateMultiplication, levelLabel, scoreResults,
} from "@/lib/shared/numbers";

// red is kept for numbers to subtract
const COLOURS = ["#0d47a1", "#9933CC", "#007E33", "#c2410c", "#282c7d"];
const TYPES = [
  { value: "addition", label: "Addition" },
  { value: "additionsubtraction", label: "Addition / subtraction" },
  { value: "multiplication", label: "Multiplication" },
  { value: "division", label: "Division" },
];
const FLASH_SPEEDS = [3000, 2500, 2000, 1500, 1000, 700, 500, 300];
const VOICE_SPEEDS = [
  { value: 0.7, label: "Slow" },
  { value: 1, label: "Medium" },
  { value: 1.3, label: "Fast" },
];
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const sign = (type) => (type === "multiplication" ? "×" : type === "division" ? "÷" : "+");
const fmt = (n) => Math.abs(n).toLocaleString();

class Aborted extends Error {}
const noopSubscribe = () => () => {};

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Aborted());
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => { clearTimeout(t); reject(new Aborted()); }, { once: true });
  });
}

function speak(text, rate, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Aborted());
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = "en-GB";
    u.rate = rate;
    const voice = synth.getVoices().find((v) => v.lang === "en-GB") || synth.getVoices().find((v) => v.lang?.startsWith("en"));
    if (voice) u.voice = voice;
    // some browsers never fire "end", so there is a time-based fallback
    const fallback = setTimeout(resolve, 600 + String(text).length * 180 / rate);
    u.onend = () => { clearTimeout(fallback); resolve(); };
    u.onerror = () => { clearTimeout(fallback); resolve(); };
    signal.addEventListener("abort", () => { clearTimeout(fallback); synth.cancel(); reject(new Aborted()); }, { once: true });
    synth.speak(u);
  });
}

function makePracticeQuestions(s) {
  const out = [];
  for (let i = 0; i < s.questions; i++) {
    let numbers;
    if (s.type === "addition") numbers = generateAddition({ digits: { min: s.minDigits, max: s.maxDigits }, rows: s.rows });
    else if (s.type === "additionsubtraction") numbers = generateAddSub({ digits: { min: s.minDigits, max: s.maxDigits }, rows: s.rows, minusChance: 0.4, forceTwoRowMinus: false });
    else if (s.type === "multiplication") numbers = generateMultiplication({ first: s.first, second: s.second });
    else numbers = generateDivision({ first: s.first, second: s.second });
    out.push({ type: s.type, numbers });
  }
  return out;
}

export default function FlashGame({ kind }) {
  const isDictation = kind === "dictation";
  const { notify, notifyError, withLoading } = useNotify();
  const { play, muted, toggleMute } = useSounds();

  const [mode, setMode] = useState("practice");
  const [settings, setSettings] = useState({
    type: "addition", minDigits: 1, maxDigits: 1, rows: 3, first: 2, second: 1,
    speed: isDictation ? 1 : 1000, questions: 10, display: "digits",
  });
  const [levelInfo, setLevelInfo] = useState(null);
  const [phase, setPhase] = useState("setup"); // setup | countdown | flash | answer | feedback
  const [light, setLight] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [flash, setFlash] = useState(null); // { text, colour, value, negative }
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [summary, setSummary] = useState(null);
  const [sessionLabel, setSessionLabel] = useState("");
  const speechOk = useSyncExternalStore(noopSubscribe, () => "speechSynthesis" in window, () => true);

  const abortRef = useRef(null);
  const sessionRef = useRef(null);
  const answerStart = useRef(0);
  const inputRef = useRef(null);

  const set = (k) => (e) => setSettings((s) => ({ ...s, [k]: e.target.value }));
  const isAddType = settings.type === "addition" || settings.type === "additionsubtraction";

  const loadLevel = useCallback(async () => {
    try {
      setLevelInfo(await api.get(`/api/games/${kind}/level`));
    } catch (err) {
      notifyError(err);
    }
  }, [kind, notifyError]);

  useEffect(() => {
    let alive = true;
    api.get(`/api/games/${kind}/level`).then((d) => alive && setLevelInfo(d)).catch((e) => alive && notifyError(e));
    // voices load asynchronously in some browsers; asking early warms them up
    if (isDictation && "speechSynthesis" in window) window.speechSynthesis.getVoices();
    const abort = abortRef;
    return () => {
      alive = false;
      abort.current?.abort();
    };
  }, [kind, isDictation, notifyError]);

  // ----- showing one question -----
  const present = useCallback(async (q, signal, speed) => {
    if (isDictation) {
      if (q.type === "multiplication") await speak(`${q.numbers[0]} times ${q.numbers[1]}`, speed, signal);
      else if (q.type === "division") await speak(`${q.numbers[0]} divided by ${q.numbers[1]}`, speed, signal);
      else {
        for (const [i, n] of q.numbers.entries()) {
          setFlash({ text: `${i + 1} / ${q.numbers.length}`, colour: COLOURS[i % COLOURS.length], muted: true });
          await speak(n < 0 ? `minus ${Math.abs(n)}` : n, speed, signal);
          await sleep(250, signal);
        }
      }
      setFlash(null);
      await speak("Answer", 1, signal);
      return;
    }
    if (q.type === "multiplication" || q.type === "division") {
      play("pop");
      setFlash({ text: `${fmt(q.numbers[0])} ${sign(q.type)} ${fmt(q.numbers[1])}`, colour: COLOURS[3], value: null });
      await sleep(Math.max(2000, speed * 2), signal);
      setFlash(null);
      return;
    }
    for (const [i, n] of q.numbers.entries()) {
      play("pop");
      setFlash({ text: `${n < 0 ? "−" : ""}${fmt(n)}`, colour: n < 0 ? "#CC0000" : COLOURS[i % COLOURS.length], value: Math.abs(n), negative: n < 0 });
      await sleep(speed, signal);
      setFlash(null);
      await sleep(Math.min(500, Math.max(200, speed * 0.35)), signal);
    }
  }, [isDictation, play]);

  const runQuestion = useCallback(async (list, i, speed) => {
    const signal = abortRef.current.signal;
    try {
      setIndex(i);
      setAnswer("");
      setPhase("flash");
      await present(list[i], signal, speed);
      setPhase("answer");
      answerStart.current = performance.now();
      setTimeout(() => inputRef.current?.focus(), 30);
    } catch (err) {
      if (!(err instanceof Aborted)) throw err;
    }
  }, [present]);

  const countdown = useCallback(async (signal) => {
    setPhase("countdown");
    for (const step of ["red", "yellow", "green"]) {
      setLight(step);
      play("click");
      await sleep(800, signal);
    }
    setLight(null);
  }, [play]);

  const start = async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setResults([]);
    setSummary(null);
    let list, speed;
    if (mode === "game") {
      try {
        const s = await withLoading(api.post(`/api/games/${kind}/start`));
        sessionRef.current = s;
        setSessionLabel(s.label);
        list = s.questions;
        speed = isDictation ? 1 : 1000;
      } catch (err) {
        return notifyError(err);
      }
    } else {
      if (isAddType && Number(settings.maxDigits) < Number(settings.minDigits)) return notify("Max digits must be at least min digits", "warning");
      sessionRef.current = null;
      list = makePracticeQuestions({ ...settings, minDigits: +settings.minDigits, maxDigits: +settings.maxDigits, rows: +settings.rows, first: +settings.first, second: +settings.second, questions: +settings.questions });
      speed = Number(settings.speed);
    }
    setQuestions(list);
    try {
      await countdown(abortRef.current.signal);
      await runQuestion(list, 0, speed);
    } catch (err) {
      if (!(err instanceof Aborted)) notifyError(err);
    }
  };

  const speedNow = mode === "game" ? (isDictation ? 1 : 1000) : Number(settings.speed);

  const finish = async (all) => {
    setPhase("setup");
    setFlash(null);
    if (mode === "game" && sessionRef.current) {
      try {
        const res = await withLoading(api.post(`/api/games/${kind}/finish`, {
          sessionId: sessionRef.current.sessionId,
          answers: all.map((r) => ({ answer: r.answer, seconds: Math.round(r.seconds * 10) / 10 })),
        }));
        play(res.levelUp ? "levelup" : "over");
        setSummary({ ...res, mode: "game" });
        loadLevel();
      } catch (err) {
        notifyError(err);
      }
    } else {
      play("over");
      setSummary({ ...scoreResults(all), mode: "practice", review: all.map((r, i) => ({ ...questions[i], answer: r.correctAnswer, given: r.answer, status: r.status })) });
    }
  };

  const submit = (skip = false) => {
    if (phase !== "answer") return;
    const q = questions[index];
    const correctAnswer = answerFor(q.type, q.numbers);
    const seconds = (performance.now() - answerStart.current) / 1000;
    const given = skip || answer.trim() === "" ? null : Number(answer.replace(/[,\s]/g, ""));
    const status = given === null ? "skipped" : given === correctAnswer ? "correct" : "wrong";
    play(status === "correct" ? "success" : status === "wrong" ? "fail" : "click");
    const entry = { answer: given, seconds, status, correctAnswer };
    const all = [...results, entry];
    setResults(all);
    setFeedback({ status, correctAnswer });
    setPhase("feedback");
    setTimeout(() => {
      setFeedback(null);
      if (index + 1 < questions.length) runQuestion(questions, index + 1, speedNow).catch(notifyError);
      else finish(all);
    }, status === "correct" ? 700 : 1400);
  };

  const replay = () => {
    if (mode !== "practice" || phase !== "answer") return;
    runQuestion(questions, index, speedNow).catch(notifyError);
  };

  const stop = () => {
    abortRef.current?.abort();
    if (isDictation && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setPhase("setup");
    setFlash(null);
    setLight(null);
    sessionRef.current = null;
    notify("Game stopped", "info");
  };

  const playing = phase !== "setup";
  const live = scoreResults(results);
  const current = questions[index];

  // ----- setup panel -----
  const setup = (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <ToggleButtonGroup exclusive fullWidth value={mode} onChange={(_, v) => v && setMode(v)} sx={{ mb: 3 }} color="primary" aria-label="Mode">
          <ToggleButton value="practice"><SchoolRounded sx={{ mr: 1 }} />Practice</ToggleButton>
          <ToggleButton value="game"><EmojiEventsRounded sx={{ mr: 1 }} />Level game</ToggleButton>
        </ToggleButtonGroup>

        {mode === "game" ? (
          <Stack spacing={2}>
            {levelInfo ? (
              <>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip color="primary" label={levelInfo.label} />
                  <Chip variant="outlined" label={`${levelInfo.marks} total marks`} />
                </Box>
                {levelInfo.configured ? (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {levelInfo.questionCount} questions. Score {levelInfo.passMark} or more (out of about {levelInfo.maxScore}) to move up a level.
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2.5, color: "text.secondary" }}>
                      {levelInfo.settings.map((s, i) => (
                        <li key={i}>
                          <Typography variant="body2">
                            {s.no_of_ques} × {TYPES.find((t) => t.value === s.type)?.label.toLowerCase()}
                            {s.no_of_digits ? `, ${s.no_of_digits}-digit, ${s.no_of_rows} rows` : `, ${s.first_digit}-digit by ${s.second_digit}-digit`}
                          </Typography>
                        </li>
                      ))}
                    </Box>
                  </>
                ) : (
                  <Alert severity="info">{levelInfo.label} has not been set up yet. Ask your teacher, or use practice mode.</Alert>
                )}
              </>
            ) : (
              <LinearProgress />
            )}
          </Stack>
        ) : (
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField select label="Type" value={settings.type} onChange={set("type")}>
                {TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            {isAddType ? (
              <>
                <Grid size={6}>
                  <TextField select label="Min digits" value={settings.minDigits} onChange={set("minDigits")}>
                    {range(1, isDictation ? 8 : 10).map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={6}>
                  <TextField select label="Max digits" value={settings.maxDigits} onChange={set("maxDigits")}>
                    {range(1, isDictation ? 8 : 10).map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={12}>
                  <TextField select label="Rows" value={settings.rows} onChange={set("rows")}>
                    {range(2, isDictation ? 15 : 50).map((n) => <MenuItem key={n} value={n}>{n} rows</MenuItem>)}
                  </TextField>
                </Grid>
              </>
            ) : (
              <>
                <Grid size={6}>
                  <TextField select label={settings.type === "division" ? "Dividend digits" : "Multiplicand digits"} value={settings.first} onChange={set("first")}>
                    {range(1, settings.type === "division" ? 7 : 5).map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={6}>
                  <TextField select label={settings.type === "division" ? "Divisor digits" : "Multiplier digits"} value={settings.second} onChange={set("second")}>
                    {range(1, 5).map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                  </TextField>
                </Grid>
              </>
            )}
            <Grid size={6}>
              <TextField select label={isDictation ? "Voice speed" : "Speed"} value={settings.speed} onChange={set("speed")}>
                {isDictation
                  ? VOICE_SPEEDS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)
                  : FLASH_SPEEDS.map((s) => <MenuItem key={s} value={s}>{s / 1000} s per number</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={6}>
              <TextField select label="Questions" value={settings.questions} onChange={set("questions")}>
                {range(1, 50).map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
              </TextField>
            </Grid>
            {!isDictation && (
              <Grid size={12}>
                <ToggleButtonGroup exclusive fullWidth size="small" value={settings.display} onChange={(_, v) => v && setSettings((s) => ({ ...s, display: v }))} aria-label="Show numbers as">
                  <ToggleButton value="digits">Show digits</ToggleButton>
                  <ToggleButton value="soroban">Show soroban</ToggleButton>
                </ToggleButtonGroup>
              </Grid>
            )}
          </Grid>
        )}
        <Button
          fullWidth size="large" variant="contained" sx={{ mt: 3 }} startIcon={<PlayArrowRounded />}
          onClick={start}
          disabled={(mode === "game" && !levelInfo?.configured) || (isDictation && !speechOk)}
        >
          {mode === "game" ? `Play ${levelInfo?.label || ""}` : "Start practice"}
        </Button>
      </CardContent>
    </Card>
  );

  // ----- display board -----
  const board = (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 2, height: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {playing && <Chip label={`Question ${Math.min(index + 1, questions.length)} of ${questions.length}`} />}
          {playing && <Chip color="success" variant="outlined" label={`${live.correct} correct`} />}
          {playing && <Chip color="error" variant="outlined" label={`${live.wrong} wrong`} />}
          {playing && <Chip color="primary" label={`${live.marks} marks`} />}
          <Box sx={{ flex: 1 }} />
          <Tooltip title={muted ? "Sound off" : "Sound on"}>
            <IconButton onClick={toggleMute} aria-label={muted ? "Turn sound on" : "Turn sound off"}>{muted ? <VolumeOffRounded /> : <VolumeUpRounded />}</IconButton>
          </Tooltip>
          {playing && <Button color="error" startIcon={<StopRounded />} onClick={stop}>Stop</Button>}
        </Box>
        {playing && <LinearProgress variant="determinate" value={(results.length / Math.max(1, questions.length)) * 100} />}

        <Box
          aria-live="polite"
          sx={{
            flex: 1, minHeight: { xs: 240, md: 320 }, borderRadius: 4, display: "grid", placeItems: "center",
            bgcolor: "#fff", color: "#1a202c", border: 1, borderColor: "divider", position: "relative", overflow: "hidden",
          }}
        >
          {phase === "setup" && (
            <Stack sx={{ alignItems: "center", gap: 1, p: 2, textAlign: "center" }}>
              <FeatureIcon name={kind} size={88} />
              <Typography variant="h5" sx={{ color: "#1a202c" }}>Are you ready?</Typography>
              <Typography sx={{ color: "#555" }}>{isDictation ? "Listen carefully, then type the answer." : "Watch the numbers, then type the answer."}</Typography>
            </Stack>
          )}
          {phase === "countdown" && (
            <Stack direction="row" spacing={2} aria-label="Get ready">
              {["red", "yellow", "green"].map((c) => (
                <Box key={c} sx={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid #333", bgcolor: light === c ? { red: "#ff2b2b", yellow: "#ffd400", green: "#16c60c" }[c] : "#eee", transition: "background-color .15s" }} />
              ))}
            </Stack>
          )}
          {phase === "flash" && flash && (
            settings.display === "soroban" && mode === "practice" && flash.value != null ? (
              <Stack sx={{ alignItems: "center" }}>
                {flash.negative && <Typography sx={{ color: "#CC0000", fontSize: 40, fontWeight: 800 }}>−</Typography>}
                <Soroban value={flash.value} digits={Math.max(3, String(flash.value).length)} size="large" />
              </Stack>
            ) : (
              <Typography sx={{ fontFamily: "Digital7, monospace", fontSize: flash.muted ? 48 : { xs: 72, sm: 110, md: 140 }, color: flash.colour, lineHeight: 1, px: 2, textAlign: "center", wordBreak: "break-all" }}>
                {flash.text}
              </Typography>
            )
          )}
          {phase === "flash" && !flash && isDictation && (
            <VolumeUpRounded sx={{ fontSize: 96, color: "#282c7d", opacity: 0.6 }} />
          )}
          {(phase === "answer" || phase === "feedback") && current && (
            <Stack sx={{ alignItems: "center", gap: 2, width: "100%", maxWidth: 360, p: 2 }}>
              {feedback ? (
                <Stack sx={{ alignItems: "center", gap: 1 }}>
                  <Typography variant="h3" sx={{ color: feedback.status === "correct" ? "#16a34a" : feedback.status === "wrong" ? "#ed1f24" : "#555" }}>
                    {feedback.status === "correct" ? "Correct!" : feedback.status === "wrong" ? "Not quite" : "Skipped"}
                  </Typography>
                  {feedback.status !== "correct" && <Typography sx={{ color: "#333" }}>The answer was <strong>{feedback.correctAnswer.toLocaleString()}</strong></Typography>}
                </Stack>
              ) : (
                <Box component="form" onSubmit={(e) => { e.preventDefault(); submit(); }} sx={{ width: "100%" }}>
                  <Typography sx={{ textAlign: "center", mb: 1.5, color: "#555" }}>Your answer</Typography>
                  <TextField
                    inputRef={inputRef}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value.replace(/[^\d.,\s]/g, ""))}
                    autoComplete="off"
                    slotProps={{ htmlInput: { inputMode: "decimal", "aria-label": "Your answer", style: { fontSize: 40, textAlign: "center", fontFamily: "Digital7, monospace", color: "#1a202c" } } }}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                  />
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    {mode === "practice" && (
                      <Button onClick={replay} startIcon={<ReplayRounded />} variant="outlined">Again</Button>
                    )}
                    <Button onClick={() => submit(true)} startIcon={<SkipNextRounded />} variant="outlined" color="inherit" sx={{ color: "#333" }}>Skip</Button>
                    <Button type="submit" variant="contained" sx={{ flex: 1 }} disabled={!answer.trim()}>Check</Button>
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </Box>
        {isDictation && !speechOk && <Alert severity="warning">This browser cannot read numbers aloud. Try Chrome, Edge or Safari.</Alert>}
      </CardContent>
    </Card>
  );

  return (
    <>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: playing ? { xs: "none", md: "block" } : "block" }}>
          {playing ? (
            <Card>
              <CardContent>
                <Typography variant="h6">{mode === "game" ? sessionLabel || "Level game" : "Practice"}</Typography>
                <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                  Points per correct answer: 4 within 10 s, 3 within 20 s, 2 within 30 s, 1 within 40 s. Three quick correct answers in a row earn a 2 point bonus. A wrong answer costs 1 point.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            setup
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>{board}</Grid>
      </Grid>
      <Box sx={{ mt: 3, display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <Button component={Link} href="/leaderboard" startIcon={<EmojiEventsRounded />}>Leaderboard</Button>
      </Box>
      <ResultsDialog summary={summary} onClose={() => setSummary(null)} onAgain={() => { setSummary(null); start(); }} levelLabelFn={levelLabel} />
    </>
  );
}
