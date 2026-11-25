"use client";
import { useCallback, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { DownloadRounded, DescriptionRounded } from "@mui/icons-material";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import { api, downloadFile } from "@/lib/client/api";
import { useNotify } from "@/components/NotifyProvider";

function Papers() {
  const { notify, notifyError, withLoading } = useNotify();
  const [history, setHistory] = useState([]);
  const [scores, setScores] = useState(null);

  const load = useCallback(() => {
    api.get("/api/papers/history").then(setHistory).catch(notifyError);
    api.get("/api/users/me/scores").then(setScores).catch(() => {});
  }, [notifyError]);
  useEffect(load, [load]);

  const getPaper = async () => {
    try {
      const p = await withLoading(api.post("/api/papers/my-paper"));
      await withLoading(downloadFile(`/api/papers/history/${p._id}/docx`, `paper-level-${p.level}.docx`));
      notify("Your paper has been downloaded. Print it and ask your teacher to mark it.", "success");
      load();
    } catch (err) {
      notifyError(err);
    }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  return (
    <>
      <PageHeader title="Papers" subtitle="Print a practice paper for your level. Your teacher marks it and moves you on." />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ p: 3, textAlign: "center" }}>
              <DescriptionRounded color="primary" sx={{ fontSize: 56 }} />
              <Typography variant="h6" sx={{ mt: 1 }}>Your paper level</Typography>
              <Typography variant="h3" color="primary" sx={{ my: 1 }}>{scores?.paper?.level ?? "—"}</Typography>
              <Button fullWidth size="large" variant="contained" startIcon={<DownloadRounded />} onClick={getPaper}>Download my paper</Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                You get the same paper for a level until your teacher moves you up, so you can print it again if you lose it.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>My papers</Typography>
              {history.length === 0 ? (
                <Typography color="text.secondary">No papers yet.</Typography>
              ) : (
                <Table size="small" aria-label="My papers">
                  <TableHead>
                    <TableRow><TableCell>Date</TableCell><TableCell>Level</TableCell><TableCell align="right">Marks</TableCell><TableCell /></TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((h) => (
                      <TableRow key={h._id}>
                        <TableCell>{fmtDate(h.date)}</TableCell>
                        <TableCell><Chip size="small" label={`Level ${h.level}`} /></TableCell>
                        <TableCell align="right">{h.marks || "Not marked"}</TableCell>
                        <TableCell align="right">
                          <Button size="small" startIcon={<DownloadRounded />} onClick={() => withLoading(downloadFile(`/api/papers/history/${h._id}/docx`, `paper-level-${h.level}.docx`)).catch(notifyError)}>Download</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

export default function Page() {
  return <RequireAuth><Papers /></RequireAuth>;
}
