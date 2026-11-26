"use client";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { CheckRounded, CloseRounded, RemoveRounded } from "@mui/icons-material";

function questionText(r) {
  if (r.text) return r.text;
  if (!r.numbers) return "";
  if (r.type === "multiplication") return `${r.numbers[0]} × ${r.numbers[1]}`;
  if (r.type === "division") return `${r.numbers[0]} ÷ ${r.numbers[1]}`;
  return r.numbers.map((n, i) => (i === 0 ? n : n < 0 ? `− ${-n}` : `+ ${n}`)).join(" ");
}

const Stat = ({ label, value, color }) => (
  <Grid size={{ xs: 6, sm: 3 }}>
    <Box sx={{ textAlign: "center", p: 1.5, borderRadius: 3, bgcolor: "action.hover" }}>
      <Typography variant="h4" sx={{ color }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Box>
  </Grid>
);

export default function ResultsDialog({ summary, onClose, onAgain }) {
  const open = !!summary;
  const s = summary || {};
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle>{s.mode === "game" ? (s.levelUp ? "Level up!" : "Game over") : "Practice finished"}</DialogTitle>
      <DialogContent dividers>
        {s.mode === "game" && (
          <Alert severity={s.passed ? "success" : "info"} sx={{ mb: 2 }}>
            {s.levelUp
              ? <>Brilliant! You passed and moved up to <strong>{s.newLabel}</strong>.</>
              : s.passed
                ? <>You passed! You are at the top level that has been set up.</>
                : <>You needed {s.passMark} marks to pass. Keep practising and try again.</>}
          </Alert>
        )}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Stat label="Marks" value={s.marks ?? 0} color="primary.main" />
          <Stat label="Correct" value={s.correct ?? 0} color="success.main" />
          <Stat label="Wrong" value={s.wrong ?? 0} color="error.main" />
          <Stat label="Skipped" value={s.skipped ?? 0} />
        </Grid>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
          {s.bonus > 0 && <Chip color="secondary" label={`${s.bonus} bonus points`} />}
          {s.mode === "game" && <Chip variant="outlined" label={`${s.totalMarks} total marks`} />}
        </Box>
        {s.mode === "practice" && (
          <Alert severity="info" sx={{ mb: 2 }}>Practice marks are not saved. Play a level game (Anzan or Dictation) to get on the leaderboard.</Alert>
        )}
        {Array.isArray(s.review) && s.review.length > 0 && (
          <Table size="small" aria-label="Your answers">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Question</TableCell>
                <TableCell align="right">You</TableCell>
                <TableCell align="right">Answer</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {s.review.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace", maxWidth: 220, overflowWrap: "anywhere" }}>{questionText(r)}</TableCell>
                  <TableCell align="right">{r.given ?? "—"}</TableCell>
                  <TableCell align="right">{r.answer}</TableCell>
                  <TableCell>
                    {r.status === "correct" ? <CheckRounded color="success" aria-label="correct" /> : r.status === "wrong" ? <CloseRounded color="error" aria-label="wrong" /> : <RemoveRounded aria-label="skipped" />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {onAgain && <Button variant="contained" onClick={onAgain}>Play again</Button>}
      </DialogActions>
    </Dialog>
  );
}
