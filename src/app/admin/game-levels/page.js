"use client";
import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { AddRounded, DeleteOutlineRounded, EditRounded } from "@mui/icons-material";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import ConfirmDialog from "@/components/ConfirmDialog";
import { api } from "@/lib/client/api";
import { useNotify } from "@/components/NotifyProvider";
import { levelLabel, maxScoreFor } from "@/lib/shared/numbers";

const SECTION_TYPES = { addition: "Addition", additionsubtraction: "Addition / subtraction", multiplication: "Multiplication", division: "Division" };
const LEVELS = [...Array.from({ length: 15 }, (_, i) => 15 - i), 0, -1, -2, -3, -4];

const describe = (s) => (s.type === "addition" || s.type === "additionsubtraction"
  ? `${s.no_of_ques} × ${s.no_of_digits}-digit, ${s.no_of_rows} rows`
  : `${s.no_of_ques} × ${s.first_digit}-digit by ${s.second_digit}-digit`);

function LevelDialog({ open, onClose, ...rest }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      {open && <LevelForm onClose={onClose} {...rest} />}
    </Dialog>
  );
}

function LevelForm({ initial, gameType, onClose, onSaved }) {
  const { notifyError, withLoading } = useNotify();
  const [level, setLevel] = useState(initial?.level ?? 15);
  const [passMark, setPassMark] = useState(initial?.passMark ?? 0);
  const [settings, setSettings] = useState(initial?.settings ?? [{ type: "additionsubtraction", no_of_digits: 1, no_of_rows: 3, no_of_ques: 10 }]);

  const upd = (i, k, v) => setSettings(settings.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  const changeType = (i, type) => setSettings(settings.map((s, j) => (j !== i ? s : type.startsWith("addition")
    ? { type, no_of_digits: 1, no_of_rows: 3, no_of_ques: s.no_of_ques }
    : { type, first_digit: 2, second_digit: 1, no_of_ques: s.no_of_ques })));
  const count = settings.reduce((n, s) => n + Number(s.no_of_ques || 0), 0);

  const save = async () => {
    try {
      await withLoading(api.put("/api/admin/game-levels", { gameType, level, passMark: Number(passMark), settings }));
      onSaved();
    } catch (err) {
      notifyError(err);
    }
  };

  return (
    <>
      <DialogTitle>{initial ? `Edit ${levelLabel(level)}` : "Add a level"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField select label="Level" value={level} onChange={(e) => setLevel(Number(e.target.value))} disabled={!!initial}>
              {LEVELS.map((l) => <MenuItem key={l} value={l}>{levelLabel(l)}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField type="number" label="Pass mark" value={passMark} onChange={(e) => setPassMark(e.target.value)} helperText={`Max about ${maxScoreFor(count)} for ${count} questions`} />
          </Grid>
          {settings.map((s, i) => (
            <Grid key={i} size={12}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: { xs: "wrap", sm: "nowrap" } }}>
                <TextField select size="small" label="Section" value={s.type} onChange={(e) => changeType(i, e.target.value)} sx={{ minWidth: 200 }}>
                  {Object.entries(SECTION_TYPES).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </TextField>
                <TextField size="small" type="number" label="Questions" value={s.no_of_ques} onChange={(e) => upd(i, "no_of_ques", Number(e.target.value))} />
                {s.type.startsWith("addition") ? (
                  <>
                    <TextField size="small" type="number" label="Digits" value={s.no_of_digits} onChange={(e) => upd(i, "no_of_digits", Number(e.target.value))} />
                    <TextField size="small" type="number" label="Rows" value={s.no_of_rows} onChange={(e) => upd(i, "no_of_rows", Number(e.target.value))} />
                  </>
                ) : (
                  <>
                    <TextField size="small" type="number" label="First digits" value={s.first_digit} onChange={(e) => upd(i, "first_digit", Number(e.target.value))} />
                    <TextField size="small" type="number" label="Second digits" value={s.second_digit} onChange={(e) => upd(i, "second_digit", Number(e.target.value))} />
                  </>
                )}
                <IconButton color="error" onClick={() => setSettings(settings.filter((_, j) => j !== i))} aria-label="Remove section" disabled={settings.length === 1}><DeleteOutlineRounded /></IconButton>
              </Box>
            </Grid>
          ))}
          <Grid size={12}>
            <Button startIcon={<AddRounded />} onClick={() => setSettings([...settings, { type: "multiplication", first_digit: 2, second_digit: 1, no_of_ques: 10 }])}>Add section</Button>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save}>Save level</Button>
      </DialogActions>
    </>
  );
}

function GameLevels() {
  const { notify, notifyError, withLoading } = useNotify();
  const [type, setType] = useState("anzan");
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [del, setDel] = useState(null);
  const load = useCallback(() => api.get(`/api/admin/game-levels?type=${type}`).then(setRows).catch(notifyError), [type, notifyError]);
  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader title="Game levels" subtitle="What each level of the Anzan and Dictation games contains, and the mark needed to move up." action={<Button variant="contained" startIcon={<AddRounded />} onClick={() => setEditing({})}>Add level</Button>} />
      <ToggleButtonGroup exclusive value={type} onChange={(_, v) => v && setType(v)} color="primary" sx={{ mb: 3 }}>
        <ToggleButton value="anzan">Anzan</ToggleButton>
        <ToggleButton value="dictation">Dictation</ToggleButton>
      </ToggleButtonGroup>
      {rows.length === 0 && <Alert severity="info" sx={{ mb: 2 }}>No levels yet. Run <code>npm run seed:levels</code> to load the levels from the spec document, or add them here.</Alert>}
      <Card>
        <Table>
          <TableHead><TableRow><TableCell>Level</TableCell><TableCell>Sections</TableCell><TableCell align="right">Pass mark</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r._id}>
                <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{levelLabel(r.level)}</TableCell>
                <TableCell>
                  <Stack spacing={0.25}>{r.settings.map((s, i) => <Typography key={i} variant="body2"><strong>{SECTION_TYPES[s.type]}:</strong> {describe(s)}</Typography>)}</Stack>
                </TableCell>
                <TableCell align="right">{r.passMark}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  <IconButton onClick={() => setEditing(r)} aria-label={`Edit ${levelLabel(r.level)}`}><EditRounded /></IconButton>
                  <IconButton color="error" onClick={() => setDel(r)} aria-label={`Delete ${levelLabel(r.level)}`}><DeleteOutlineRounded /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <LevelDialog open={!!editing} initial={editing?._id ? editing : null} gameType={type} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); notify("Level saved", "success"); load(); }} />
      <ConfirmDialog open={!!del} title={`Delete ${del ? levelLabel(del.level) : ""}?`} text="Students on this level will not be able to play the level game until it is added again." onCancel={() => setDel(null)} onConfirm={async () => {
        const d = del; setDel(null);
        try { await withLoading(api.del(`/api/admin/game-levels?type=${type}&level=${d.level}`)); load(); } catch (err) { notifyError(err); }
      }} />
    </>
  );
}

export default function Page() {
  return <RequireAuth admin><GameLevels /></RequireAuth>;
}
