"use client";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
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
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import UserAvatar from "@/components/UserAvatar";
import { GROUPS } from "@/components/ProfileFields";
import { api } from "@/lib/client/api";
import { useNotify } from "@/components/NotifyProvider";

const MEDALS = { 1: "/assets/img/gold.png", 2: "/assets/img/silver.png", 3: "/assets/img/bronze.png" };

function Board() {
  const { notifyError } = useNotify();
  const [type, setType] = useState("anzan");
  const [stat, setStat] = useState("marks");
  const [group, setGroup] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    const q = new URLSearchParams({ type, stat, limit: "20", ...(group ? { group } : {}) });
    api.get(`/api/games/leaderboard?${q}`).then(setData).catch(notifyError);
  }, [type, stat, group, notifyError]);

  const podium = data?.rows.filter((r) => r.rank <= 3).slice(0, 3) || [];

  return (
    <>
      <PageHeader title="Leaderboard" subtitle="Marks from level games. Practice rounds are just for practice and are not counted." />
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <ToggleButtonGroup exclusive value={type} onChange={(_, v) => v && setType(v)} color="primary" aria-label="Game">
          <ToggleButton value="anzan">Anzan</ToggleButton>
          <ToggleButton value="dictation">Dictation</ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup exclusive value={stat} onChange={(_, v) => v && setStat(v)} color="primary" aria-label="Rank by">
          <ToggleButton value="marks">By marks</ToggleButton>
          <ToggleButton value="level">By level</ToggleButton>
        </ToggleButtonGroup>
        <TextField select size="small" label="Group" value={group} onChange={(e) => setGroup(e.target.value)} sx={{ minWidth: 180, maxWidth: { md: 220 } }}>
          <MenuItem value="">Everyone</MenuItem>
          {GROUPS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
        </TextField>
      </Stack>

      {podium.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {podium.map((r, i) => (
            <Grid key={i} size={{ xs: 12, sm: 4 }}>
              <Card sx={{ textAlign: "center", borderColor: r.me ? "primary.main" : undefined }}>
                <CardContent>
                  <Box component="img" src={MEDALS[r.rank]} alt={`Rank ${r.rank}`} sx={{ width: 48, height: 48, objectFit: "contain" }} />
                  <UserAvatar user={r} size={64} sx={{ mx: "auto", my: 1 }} />
                  <Typography variant="h6" noWrap>{r.name}</Typography>
                  <Typography color="text.secondary">{stat === "marks" ? `${r.marks} marks` : r.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Card>
        {!data ? (
          <CardContent>{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={48} />)}</CardContent>
        ) : data.rows.length === 0 ? (
          <CardContent><Typography color="text.secondary">No scores yet. Be the first!</Typography></CardContent>
        ) : (
          <Table aria-label="Leaderboard">
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Student</TableCell>
                <TableCell align="right">Level</TableCell>
                <TableCell align="right">Marks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...data.rows, ...(data.mine && !data.rows.some((r) => r.me) ? [{ ...data.mine, gap: true }] : [])].map((r, i) => (
                <TableRow key={i} selected={r.me} sx={r.gap ? { borderTop: 3, borderColor: "divider" } : undefined}>
                  <TableCell sx={{ fontWeight: 700 }}>{r.rank}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <UserAvatar user={r} size={32} />
                      <span>{r.name}</span>
                      {r.me && <Chip size="small" color="primary" label="You" />}
                      {r.teacher && <Chip size="small" variant="outlined" label="Teacher" />}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{r.label}</TableCell>
                  <TableCell align="right">{r.marks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}

export default function Page() {
  return <RequireAuth><Board /></RequireAuth>;
}
