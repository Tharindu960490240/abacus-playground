"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { ArrowBackRounded, DownloadRounded, FactCheckRounded, SaveRounded } from "@mui/icons-material";
import RequireAuth from "@/components/RequireAuth";
import StudentEditor from "@/components/StudentEditor";
import { api, downloadFile } from "@/lib/client/api";
import { useNotify } from "@/components/NotifyProvider";
import { levelLabel } from "@/lib/shared/numbers";

const GAME_LEVELS = [...Array.from({ length: 15 }, (_, i) => 15 - i), 0, -1, -2, -3, -4];
const TYPE_NAMES = { sum: "Addition", sub: "Subtraction", mul: "Multiplication", div: "Division" };

function LevelControls({ userId, scores, reload }) {
  const { notify, notifyError, withLoading } = useNotify();
  const [paperLevels, setPaperLevels] = useState([]);
  // the parent re-mounts this card (key) when scores change, so this initial value stays in step
  const [values, setValues] = useState(() => ({ anzan: scores.anzan?.level ?? 15, dictation: scores.dictation?.level ?? 15, paper: scores.paper?.level ?? 10 }));
  useEffect(() => { api.get("/api/papers/levels").then(setPaperLevels).catch(() => {}); }, []);

  const save = async (game_type) => {
    try {
      await withLoading(api.put(`/api/users/${userId}/levels`, { game_type, level: values[game_type] }));
      notify("Level changed", "success");
      reload();
    } catch (err) {
      notifyError(err);
    }
  };
  const paperOptions = paperLevels.length ? [...new Map(paperLevels.map((p) => [p.level, p])).values()] : Array.from({ length: 10 }, (_, i) => ({ level: 10 - i, name: `Level ${10 - i}` }));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Change levels</Typography>
        <Stack spacing={2}>
          {["anzan", "dictation", "paper"].map((t) => (
            <Box key={t} sx={{ display: "flex", gap: 1 }}>
              <TextField select size="small" label={t[0].toUpperCase() + t.slice(1)} value={values[t] ?? ""} onChange={(e) => setValues({ ...values, [t]: Number(e.target.value) })}>
                {t === "paper"
                  ? paperOptions.map((p) => <MenuItem key={p.level} value={p.level}>{p.name} (level {p.level})</MenuItem>)
                  : GAME_LEVELS.map((l) => <MenuItem key={l} value={l}>{levelLabel(l)}</MenuItem>)}
              </TextField>
              <IconButton color="primary" onClick={() => save(t)} aria-label={`Save ${t} level`}><SaveRounded /></IconButton>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

function PaperHistory({ userId }) {
  const { notify, notifyError, withLoading } = useNotify();
  const [rows, setRows] = useState([]);
  const [marks, setMarks] = useState({});
  const [answers, setAnswers] = useState(null);
  const load = useCallback(() => api.get(`/api/papers/history?user=${userId}`).then(setRows).catch(notifyError), [userId, notifyError]);
  useEffect(() => { load(); }, [load]);

  const saveMarks = async (id) => {
    try {
      await withLoading(api.patch(`/api/papers/history/${id}`, { marks: Number(marks[id]) }));
      notify("Marks saved", "success");
      load();
    } catch (err) {
      notifyError(err);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>Papers</Typography>
        {rows.length === 0 ? <Typography color="text.secondary" variant="body2">No papers yet.</Typography> : (
          <Table size="small">
            <TableHead><TableRow><TableCell>Level</TableCell><TableCell>Marks</TableCell><TableCell /></TableRow></TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r._id}>
                  <TableCell>{r.level}<Typography variant="caption" display="block" color="text.secondary">{new Date(r.date).toLocaleDateString()}</Typography></TableCell>
                  <TableCell>
                    <Box component="form" onSubmit={(e) => { e.preventDefault(); saveMarks(r._id); }} sx={{ display: "flex", gap: 0.5 }}>
                      <TextField size="small" value={marks[r._id] ?? r.marks} onChange={(e) => setMarks({ ...marks, [r._id]: e.target.value.replace(/[^\d.]/g, "") })} sx={{ width: 80 }} slotProps={{ htmlInput: { inputMode: "decimal", "aria-label": "Marks" } }} />
                      <IconButton type="submit" size="small" aria-label="Save marks"><SaveRounded fontSize="small" /></IconButton>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <IconButton size="small" aria-label="Answer key" onClick={() => api.get(`/api/papers/history/${r._id}/answers`).then(setAnswers).catch(notifyError)}><FactCheckRounded fontSize="small" /></IconButton>
                    <IconButton size="small" aria-label="Download paper" onClick={() => withLoading(downloadFile(`/api/papers/history/${r._id}/docx`, `paper-level-${r.level}.docx`)).catch(notifyError)}><DownloadRounded fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <Dialog open={!!answers} onClose={() => setAnswers(null)} fullWidth maxWidth="sm" scroll="paper">
        <DialogTitle>Answer key — level {answers?.level}</DialogTitle>
        <DialogContent dividers>
          {answers && Object.entries(answers.answers).map(([type, list]) => (
            <Box key={type} sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>{TYPE_NAMES[type]}</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 1 }}>
                {list.map((a, i) => <Typography key={i} variant="body2"><strong>{i + 1}.</strong> {a}</Typography>)}
              </Box>
            </Box>
          ))}
        </DialogContent>
        <DialogActions><Button onClick={() => window.print()}>Print</Button><Button onClick={() => setAnswers(null)}>Close</Button></DialogActions>
      </Dialog>
    </Card>
  );
}

function Student() {
  const { id } = useParams();
  return (
    <>
      <Button component={Link} href="/admin/students" startIcon={<ArrowBackRounded />} sx={{ mb: 2 }}>All students</Button>
      <StudentEditor userId={id} adminView extra={({ scores, reload }) => (
        <>
          <LevelControls key={JSON.stringify(scores)} userId={id} scores={scores} reload={reload} />
          <PaperHistory userId={id} />
        </>
      )} />
    </>
  );
}

export default function Page() {
  return <RequireAuth admin><Student /></RequireAuth>;
}
