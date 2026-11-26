"use client";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
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
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 4, alignItems: { md: "center" } }}>
        <ToggleButtonGroup exclusive value={type} onChange={(_, v) => v && setType(v)} color="primary" aria-label="Game">
          <ToggleButton value="anzan">Anzan</ToggleButton>
          <ToggleButton value="dictation">Dictation</ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup exclusive value={stat} onChange={(_, v) => v && setStat(v)} color="primary" aria-label="Rank by">
          <ToggleButton value="marks">By marks</ToggleButton>
          <ToggleButton value="level">By level</ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ flex: 1, display: { xs: "none", md: "block" } }} />
        <TextField select size="small" label="Group" value={group} onChange={(e) => setGroup(e.target.value)} slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }} sx={{ minWidth: 180, maxWidth: { md: 220 } }}>
          <MenuItem value="">Everyone</MenuItem>
          {GROUPS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
        </TextField>
      </Stack>

      {podium.length > 0 && (
        <Box
          aria-label="Top three"
          sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", alignItems: "end", gap: { xs: 1, sm: 2 }, mb: 4, maxWidth: 720, mx: "auto" }}
        >
          {[podium[1], podium[0], podium[2]].map((r, i) => {
            if (!r) return <Box key={i} />;
            const place = r.rank;
            const tone = { 1: "#E5262B", 2: "#5157b8", 3: "#B9773E" }[place] || "#5157b8";
            const height = { 1: 150, 2: 112, 3: 92 }[place] || 92;
            return (
              <Box key={i} sx={{ textAlign: "center", minWidth: 0 }}>
                <UserAvatar user={r} size={place === 1 ? 76 : 60} sx={{ mx: "auto", mb: 1, border: 3, borderColor: tone }} />
                <Typography sx={{ fontWeight: 650, fontSize: { xs: 14, sm: 16 } }} noWrap>{r.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }} noWrap>{stat === "marks" ? `${r.marks} marks` : r.label}</Typography>
                <Box sx={{ height: { xs: height * 0.75, sm: height }, borderRadius: "20px 20px 8px 8px", bgcolor: tone, color: "#fff", display: "grid", placeItems: "center", boxShadow: r.me ? "0 0 0 3px var(--mui-palette-primary-main)" : "none" }}>
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: 28, sm: 36 } }}>{place}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
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
                <TableCell sx={{ px: { xs: 1.5, sm: 2 } }}>Rank</TableCell>
                <TableCell>Student</TableCell>
                <TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>Level</TableCell>
                <TableCell align="right" sx={{ px: { xs: 1.5, sm: 2 } }}>Marks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...data.rows, ...(data.mine && !data.rows.some((r) => r.me) ? [{ ...data.mine, gap: true }] : [])].map((r, i) => (
                <TableRow key={i} selected={r.me} sx={r.gap ? { borderTop: 3, borderColor: "divider" } : undefined}>
                  <TableCell sx={{ fontWeight: 700, width: { xs: 40, sm: 64 }, px: { xs: 1.5, sm: 2 } }}>{r.rank}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <UserAvatar user={r} size={32} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: r.me ? 650 : 500 }}>{r.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: { sm: "none" } }}>{r.label}</Typography>
                      </Box>
                      {r.me && <Chip size="small" color="primary" label="You" />}
                      {r.teacher && <Chip size="small" variant="outlined" label="Teacher" />}
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>{r.label}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, px: { xs: 1.5, sm: 2 } }}>{r.marks}</TableCell>
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
