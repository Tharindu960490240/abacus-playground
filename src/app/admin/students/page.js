"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { SearchRounded } from "@mui/icons-material";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import UserAvatar from "@/components/UserAvatar";
import { GROUPS } from "@/components/ProfileFields";
import { api } from "@/lib/client/api";
import { useNotify } from "@/components/NotifyProvider";
import { levelLabel } from "@/lib/shared/numbers";

const COLS = [
  { id: "name", label: "Name", get: (u) => u.name.toLowerCase() },
  { id: "group", label: "Group", get: (u) => u.group || "" },
  { id: "anzanLevel", label: "Anzan level", get: (u) => u.scores.anzan?.level ?? 99, align: "right", show: (u) => (u.scores.anzan ? levelLabel(u.scores.anzan.level) : "—") },
  { id: "anzanMarks", label: "Anzan marks", get: (u) => -(u.scores.anzan?.marks ?? 0), align: "right", show: (u) => u.scores.anzan?.marks ?? 0 },
  { id: "dictationLevel", label: "Dictation level", get: (u) => u.scores.dictation?.level ?? 99, align: "right", show: (u) => (u.scores.dictation ? levelLabel(u.scores.dictation.level) : "—") },
  { id: "dictationMarks", label: "Dictation marks", get: (u) => -(u.scores.dictation?.marks ?? 0), align: "right", show: (u) => u.scores.dictation?.marks ?? 0 },
  { id: "paperLevel", label: "Paper level", get: (u) => u.scores.paper?.level ?? 99, align: "right", show: (u) => u.scores.paper?.level ?? "—" },
];

function Students() {
  const router = useRouter();
  const { notifyError } = useNotify();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const [sort, setSort] = useState({ by: "name", dir: "asc" });
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(20);

  useEffect(() => { api.get("/api/users").then(setRows).catch(notifyError); }, [notifyError]);

  const shown = useMemo(() => {
    const col = COLS.find((c) => c.id === sort.by);
    const list = rows.filter((u) => (!group || u.group === group) && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())));
    list.sort((a, b) => {
      const x = col.get(a), y = col.get(b);
      return (x < y ? -1 : x > y ? 1 : 0) * (sort.dir === "asc" ? 1 : -1);
    });
    return list;
  }, [rows, q, group, sort]);

  return (
    <>
      <PageHeader title="Students" subtitle={`${rows.length} students`} />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField placeholder="Search by name or email" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> } }} />
        <TextField select label="Group" value={group} onChange={(e) => { setGroup(e.target.value); setPage(0); }} slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }} sx={{ maxWidth: { sm: 200 } }}>
          <MenuItem value="">All groups</MenuItem>
          {GROUPS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
        </TextField>
      </Stack>
      <Card>
        <TableContainer>
          <Table size="small" stickyHeader aria-label="Students">
            <TableHead>
              <TableRow>
                {COLS.map((c) => (
                  <TableCell key={c.id} align={c.align} sortDirection={sort.by === c.id ? sort.dir : false}>
                    <TableSortLabel active={sort.by === c.id} direction={sort.by === c.id ? sort.dir : "asc"} onClick={() => setSort((s) => ({ by: c.id, dir: s.by === c.id && s.dir === "asc" ? "desc" : "asc" }))}>
                      {c.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {shown.slice(page * perPage, page * perPage + perPage).map((u) => (
                <TableRow key={u._id} hover onClick={() => router.push(`/admin/students/${u._id}`)} sx={{ cursor: "pointer" }} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && router.push(`/admin/students/${u._id}`)}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <UserAvatar user={u} size={32} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{u.group || "—"}</TableCell>
                  {COLS.slice(2).map((c) => <TableCell key={c.id} align="right">{c.show(u)}</TableCell>)}
                </TableRow>
              ))}
              {shown.length === 0 && <TableRow><TableCell colSpan={COLS.length}><Typography color="text.secondary" sx={{ py: 2 }}>No students found.</Typography></TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={shown.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={perPage} onRowsPerPageChange={(e) => { setPerPage(Number(e.target.value)); setPage(0); }} rowsPerPageOptions={[10, 20, 50, 100]} />
      </Card>
    </>
  );
}

export default function Page() {
  return <RequireAuth admin><Students /></RequireAuth>;
}
