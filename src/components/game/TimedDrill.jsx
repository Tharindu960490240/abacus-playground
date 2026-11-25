"use client";
import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { PlayArrowRounded, StopRounded, VolumeOffRounded, VolumeUpRounded, SkipNextRounded } from "@mui/icons-material";
import { useNotify } from "@/components/NotifyProvider";
import { useSounds } from "@/components/useSounds";
import ResultsDialog from "./ResultsDialog";
import FeatureIcon from "@/components/FeatureIcon";
import { numberBondQuestion, scoreResults, tablesQuestion } from "@/lib/shared/numbers";

const TIMES = [
  { value: 20, label: "20 seconds" },
  { value: 30, label: "30 seconds" },
  { value: 60, label: "1 minute" },
  { value: 120, label: "2 minutes" },
  { value: 180, label: "3 minutes" },
];
const BONDS = [
  { value: 5, label: "Number bonds of 5" },
  { value: 10, label: "Number bonds of 10" },
  { value: 15, label: "Number bonds of 5 & 10" },
  { value: 20, label: "Number bonds of 5, 10 & 100" },
];

/** Beat-the-clock drill used by Times tables and Number bonds. */
export default function TimedDrill({ kind }) {
  const isTables = kind === "tables";
  const { notify } = useNotify();
  const { play, muted, toggleMute } = useSounds();
  const [operation, setOperation] = useState(isTables ? "multiplication" : "addition");
  const [time, setTime] = useState(60);
  const [bond, setBond] = useState(10);
  const [tables, setTables] = useState([2, 3, 4, 5]);
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(0);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [flashState, setFlashState] = useState(null);
  const askedAt = useRef(0);
  const inputRef = useRef(null);
  const resultsRef = useRef([]);

  const nextQuestion = () => {
    const q = isTables ? tablesQuestion(tables, operation) : numberBondQuestion(bond, operation);
    setQuestion(q);
    setAnswer("");
    askedAt.current = performance.now();
    setTimeout(() => inputRef.current?.focus(), 20);
  };

  const start = () => {
    if (isTables && tables.length === 0) return notify("Pick at least one times table", "warning");
    resultsRef.current = [];
    setResults([]);
    setSummary(null);
    setLeft(time);
    setRunning(true);
    nextQuestion();
  };

  const end = (timedOut) => {
    setRunning(false);
    setQuestion(null);
    play(timedOut ? "timeout" : "over");
    const all = resultsRef.current;
    setSummary({ ...scoreResults(all), mode: "practice", review: all });
  };

  useEffect(() => {
    if (!running) return undefined;
    const t = setTimeout(() => {
      if (left <= 1) {
        setLeft(0);
        end(true);
      } else setLeft(left - 1);
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, left]);

  const submit = (skip) => {
    if (!running || !question) return;
    const given = skip || answer.trim() === "" ? null : Number(answer);
    const status = given === null ? "skipped" : given === question.answer ? "correct" : "wrong";
    play(status === "correct" ? "success" : status === "wrong" ? "fail" : "click");
    const entry = { text: question.text, answer: question.answer, given, status, seconds: (performance.now() - askedAt.current) / 1000 };
    resultsRef.current = [...resultsRef.current, entry];
    setResults(resultsRef.current);
    setFlashState(status);
    setTimeout(() => setFlashState(null), 350);
    nextQuestion();
  };

  const live = scoreResults(results);
  const toggleTable = (n) => setTables((t) => (t.includes(n) ? t.filter((x) => x !== n) : [...t, n].sort()));

  return (
    <>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <TextField select label="Operation" value={operation} onChange={(e) => setOperation(e.target.value)} disabled={running}>
                  {isTables
                    ? [<MenuItem key="m" value="multiplication">Multiplication</MenuItem>, <MenuItem key="d" value="division">Division</MenuItem>]
                    : [<MenuItem key="a" value="addition">Addition (what makes the number?)</MenuItem>, <MenuItem key="s" value="subtraction">Subtraction</MenuItem>]}
                </TextField>
                <TextField select label="Time" value={time} onChange={(e) => setTime(Number(e.target.value))} disabled={running}>
                  {TIMES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
                {isTables ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Times tables</Typography>
                    <FormGroup row>
                      {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <FormControlLabel key={n} sx={{ width: "25%", m: 0 }} control={<Checkbox checked={tables.includes(n)} onChange={() => toggleTable(n)} disabled={running} />} label={n} />
                      ))}
                    </FormGroup>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => setTables([2, 3, 4, 5, 6, 7, 8, 9])} disabled={running}>Select all</Button>
                      <Button size="small" onClick={() => setTables([])} disabled={running}>Clear</Button>
                    </Stack>
                  </Box>
                ) : (
                  <TextField select label="Number bond" value={bond} onChange={(e) => setBond(Number(e.target.value))} disabled={running}>
                    {BONDS.map((b) => <MenuItem key={b.value} value={b.value}>{b.label}</MenuItem>)}
                  </TextField>
                )}
                {running ? (
                  <Button size="large" color="error" variant="outlined" startIcon={<StopRounded />} onClick={() => end(false)}>Stop</Button>
                ) : (
                  <Button size="large" variant="contained" startIcon={<PlayArrowRounded />} onClick={start}>Start</Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2, height: "100%" }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                <Chip color={left <= 10 && running ? "error" : "default"} label={`${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`} sx={{ fontFamily: "Digital7, monospace", fontSize: 20 }} />
                <Chip color="success" variant="outlined" label={`${live.correct} correct`} />
                <Chip color="error" variant="outlined" label={`${live.wrong} wrong`} />
                <Chip color="primary" label={`${live.marks} marks`} />
                <Box sx={{ flex: 1 }} />
                <IconButton onClick={toggleMute} aria-label={muted ? "Turn sound on" : "Turn sound off"}>{muted ? <VolumeOffRounded /> : <VolumeUpRounded />}</IconButton>
              </Box>
              <LinearProgress variant="determinate" value={running ? (left / time) * 100 : 0} color={left <= 10 ? "error" : "primary"} />
              <Box sx={{
                flex: 1, minHeight: 280, borderRadius: 4, display: "grid", placeItems: "center", border: 1, borderColor: "divider",
                bgcolor: flashState === "correct" ? "#e8f8ee" : flashState === "wrong" ? "#fdeaea" : "#fff", color: "#1a202c", transition: "background-color .2s",
              }}>
                {question ? (
                  <Box component="form" onSubmit={(e) => { e.preventDefault(); submit(false); }} sx={{ textAlign: "center", width: "100%", maxWidth: 360, p: 2 }}>
                    <Typography aria-live="polite" sx={{ fontFamily: "Digital7, monospace", fontSize: { xs: 52, sm: 72 }, color: "#282c7d", mb: 2 }}>{question.text}</Typography>
                    <TextField
                      inputRef={inputRef}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ""))}
                      autoComplete="off"
                      slotProps={{ htmlInput: { inputMode: "numeric", "aria-label": "Your answer", style: { fontSize: 36, textAlign: "center", color: "#1a202c" } } }}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                    />
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      <Button onClick={() => submit(true)} startIcon={<SkipNextRounded />} variant="outlined" color="inherit" sx={{ color: "#333" }}>Skip</Button>
                      <Button type="submit" variant="contained" sx={{ flex: 1 }} disabled={!answer}>Check</Button>
                    </Stack>
                  </Box>
                ) : (
                  <Stack sx={{ alignItems: "center", gap: 1, textAlign: "center", p: 2 }}>
                    <FeatureIcon name={kind} size={88} />
                    <Typography variant="h5" sx={{ color: "#1a202c" }}>How many can you answer?</Typography>
                    <Typography sx={{ color: "#555" }}>Choose your settings and press Start.</Typography>
                  </Stack>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <ResultsDialog summary={summary} onClose={() => setSummary(null)} onAgain={() => { setSummary(null); start(); }} />
    </>
  );
}
