"use client";
import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
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
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { AddRounded, DeleteOutlineRounded, DownloadRounded, SaveRounded, VisibilityRounded, ArrowUpwardRounded, ArrowDownwardRounded } from "@mui/icons-material";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import ConfirmDialog from "@/components/ConfirmDialog";
import { api, downloadFile } from "@/lib/client/api";
import { useNotify } from "@/components/NotifyProvider";

const TYPES = { sum: "Addition", sub: "Subtraction", mul: "Multiplication", div: "Division" };
const nums = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

function describe(eq) {
  if (eq.type === "sum" || eq.type === "sub") return `${eq.rows} rows, ${eq.digits.min === eq.digits.max ? eq.digits.min : `${eq.digits.min}–${eq.digits.max}`} digits${eq.subtype && eq.subtype !== "normal" ? ` (${eq.subtype})` : ""}`;
  if (eq.type === "mul") return `${eq.digits.digits1}-digit × ${eq.digits.digits2}-digit`;
  return `${eq.digits.numerator}-digit ÷ ${eq.digits.denominator}-digit`;
}

const blankRow = { type: "sum", num: 10, rows: 3, min: 1, max: 1, d1: 2, d2: 1 };

function Builder() {
  const { notify, notifyError, withLoading } = useNotify();
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const [level, setLevel] = useState(10);
  const [columns, setColumns] = useState(4);
  const [equations, setEquations] = useState([]);
  const [row, setRow] = useState(blankRow);
  const [preview, setPreview] = useState(null);
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(() => api.get("/api/papers/templates").then(setTemplates).catch(notifyError), [notifyError]);
  useEffect(() => { load(); }, [load]);

  const pick = (id) => {
    setSelected(id);
    setPreview(null);
    const t = templates.find((x) => x._id === id);
    if (!t) { setName(""); setLevel(10); setColumns(4); setEquations([]); return; }
    setName(t.name); setLevel(t.level ?? 10); setColumns(t.num_columns_format || 4); setEquations(t.equations || []);
  };

  const addRow = (e) => {
    e.preventDefault();
    const r = row;
    let eq;
    if (r.type === "sum" || r.type === "sub") {
      if (r.max < r.min) return notify("Max digits must be at least min digits", "warning");
      eq = { type: r.type, num: r.num, rows: r.rows, digits: { min: r.min, max: r.max } };
    } else if (r.type === "mul") eq = { type: "mul", num: r.num, digits: { digits1: r.d1, digits2: r.d2 } };
    else eq = { type: "div", num: r.num, digits: { numerator: r.d1, denominator: r.d2 } };
    setEquations([...equations, eq]);
    setPreview(null);
  };

  const move = (i, d) => {
    const list = [...equations];
    [list[i], list[i + d]] = [list[i + d], list[i]];
    setEquations(list);
  };

  const body = () => ({ name: name.trim(), level: Number(level), equations, num_columns_format: Number(columns) });

  const save = async () => {
    try {
      if (selected) await withLoading(api.put(`/api/papers/templates/${selected}`, body()));
      else {
        const doc = await withLoading(api.post("/api/papers/templates", body()));
        setSelected(doc._id);
      }
      notify("Paper level saved", "success");
      load();
    } catch (err) {
      notifyError(err);
    }
  };

  const remove = async () => {
    setConfirm(false);
    try {
      await withLoading(api.del(`/api/papers/templates/${selected}`));
      notify("Paper level deleted", "success");
      pick("");
      load();
    } catch (err) {
      notifyError(err);
    }
  };

  const doPreview = async () => {
    try {
      setPreview(await withLoading(api.post("/api/papers/preview", { equations })));
    } catch (err) {
      notifyError(err);
    }
  };

  const set = (k) => (e) => setRow({ ...row, [k]: e.target.type === "number" || typeof row[k] === "number" ? Number(e.target.value) : e.target.value });
  const isAdd = row.type === "sum" || row.type === "sub";

  return (
    <>
      <PageHeader title="Paper builder" subtitle="Design a printable paper for each paper level. Students download the one for their level." />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <TextField select label="Saved paper levels" value={selected} onChange={(e) => pick(e.target.value)}>
                    <MenuItem value="">＋ New paper level</MenuItem>
                    {templates.map((t) => <MenuItem key={t._id} value={t._id}>{t.name} {t.level != null ? `(level ${t.level})` : "(no level!)"}</MenuItem>)}
                  </TextField>
                  <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
                  <Stack direction="row" spacing={2}>
                    <TextField select label="Paper level" value={level} onChange={(e) => setLevel(Number(e.target.value))}>
                      {nums(-4, 20).reverse().map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                    </TextField>
                    <TextField select label="Columns" value={columns} onChange={(e) => setColumns(Number(e.target.value))}>
                      {nums(1, 8).map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                    </TextField>
                  </Stack>
                  {selected && templates.find((t) => t._id === selected)?.level == null && (
                    <Alert severity="warning">This paper had no level saved (a bug in the old app), so students could never get it. Pick a level and save.</Alert>
                  )}
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" startIcon={<SaveRounded />} onClick={save} disabled={!name.trim() || equations.length === 0} sx={{ flex: 1 }}>{selected ? "Update" : "Save"}</Button>
                    {selected && <Button color="error" onClick={() => setConfirm(true)} aria-label="Delete paper level"><DeleteOutlineRounded /></Button>}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            <Card>
              <CardContent component="form" onSubmit={addRow}>
                <Typography variant="h6" sx={{ mb: 2 }}>Add a section</Typography>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <TextField select label="Type" value={row.type} onChange={set("type")}>
                      {Object.entries(TYPES).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={6}><TextField type="number" label="Questions" value={row.num} onChange={set("num")} slotProps={{ htmlInput: { min: 1, max: 200 } }} /></Grid>
                  {isAdd ? (
                    <>
                      <Grid size={6}><TextField type="number" label="Rows" value={row.rows} onChange={set("rows")} slotProps={{ htmlInput: { min: 2, max: 30 } }} /></Grid>
                      <Grid size={6}><TextField select label="Min digits" value={row.min} onChange={set("min")}>{nums(1, 9).map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField></Grid>
                      <Grid size={6}><TextField select label="Max digits" value={row.max} onChange={set("max")}>{nums(1, 9).map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField></Grid>
                    </>
                  ) : (
                    <>
                      <Grid size={6} />
                      <Grid size={6}><TextField select label={row.type === "div" ? "Dividend digits" : "First number digits"} value={row.d1} onChange={set("d1")}>{nums(1, row.type === "div" ? 9 : 7).map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField></Grid>
                      <Grid size={6}><TextField select label={row.type === "div" ? "Divisor digits" : "Second number digits"} value={row.d2} onChange={set("d2")}>{nums(1, 7).map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField></Grid>
                    </>
                  )}
                </Grid>
                <Button type="submit" startIcon={<AddRounded />} variant="outlined" fullWidth sx={{ mt: 2 }}>Add section</Button>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, flexWrap: "wrap" }}>
                <Typography variant="h6" sx={{ flex: 1 }}>Sections ({equations.reduce((n, e) => n + e.num, 0)} questions)</Typography>
                <Button startIcon={<VisibilityRounded />} onClick={doPreview} disabled={!equations.length}>Preview</Button>
                <Button startIcon={<DownloadRounded />} variant="contained" disabled={!equations.length} onClick={() => withLoading(downloadFile("/api/papers/download", `${name || "paper"}.docx`, { equations, num_columns_format: columns })).catch(notifyError)}>Download .docx</Button>
              </Box>
              {equations.length === 0 ? (
                <Typography color="text.secondary">Add sections on the left, e.g. 20 addition questions with 3 rows of 1-digit numbers.</Typography>
              ) : (
                <Table size="small">
                  <TableHead><TableRow><TableCell>Type</TableCell><TableCell align="right">Questions</TableCell><TableCell>Details</TableCell><TableCell /></TableRow></TableHead>
                  <TableBody>
                    {equations.map((eq, i) => (
                      <TableRow key={i}>
                        <TableCell>{TYPES[eq.type]}</TableCell>
                        <TableCell align="right">{eq.num}</TableCell>
                        <TableCell>{describe(eq)}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUpwardRounded fontSize="small" /></IconButton>
                          <IconButton size="small" disabled={i === equations.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDownwardRounded fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => setEquations(equations.filter((_, j) => j !== i))} aria-label="Remove"><DeleteOutlineRounded fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {preview && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>Sample questions</Typography>
                  {preview.questions.map((sec, si) => (
                    <Box key={si} sx={{ mb: 2 }}>
                      <Typography sx={{ fontWeight: 700, mb: 1 }}>{TYPES[sec.type]}</Typography>
                      <Box sx={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${sec.type === "mul" || sec.type === "div" ? 160 : 90}px, 1fr))`, gap: 1 }}>
                        {sec.equations.slice(0, 12).map((q, qi) => (
                          <Box key={qi} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, fontFamily: "monospace", textAlign: "right" }}>
                            {sec.type === "mul" || sec.type === "div" ? `${q[0]} ${sec.type === "mul" ? "×" : "÷"} ${q[1]}` : q.map((n, k) => <div key={k}>{n < 0 ? `−${-n}` : n}</div>)}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <ConfirmDialog open={confirm} title="Delete this paper level?" text="Papers students already downloaded are kept." onCancel={() => setConfirm(false)} onConfirm={remove} />
    </>
  );
}

export default function Page() {
  return <RequireAuth admin><Builder /></RequireAuth>;
}
