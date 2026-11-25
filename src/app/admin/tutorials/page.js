"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { AddRounded, DeleteOutlineRounded, EditRounded, VisibilityRounded } from "@mui/icons-material";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import ConfirmDialog from "@/components/ConfirmDialog";
import { api } from "@/lib/client/api";
import { useNotify } from "@/components/NotifyProvider";

function List() {
  const { notifyError, withLoading } = useNotify();
  const [rows, setRows] = useState([]);
  const [del, setDel] = useState(null);
  const load = useCallback(() => api.get("/api/tutorials").then(setRows).catch(notifyError), [notifyError]);
  useEffect(() => { load(); }, [load]);
  return (
    <>
      <PageHeader title="Tutorial editor" action={<Button variant="contained" startIcon={<AddRounded />} component={Link} href="/admin/tutorials/new">New tutorial</Button>} />
      <Card>
        <Table>
          <TableHead><TableRow><TableCell>#</TableCell><TableCell>Title</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={3}><Typography color="text.secondary">No tutorials yet.</Typography></TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r._id}>
                <TableCell>{r.blognumber}</TableCell>
                <TableCell>{r.title}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  <IconButton component={Link} href={`/tutorials/${r._id}`} aria-label="View"><VisibilityRounded /></IconButton>
                  <IconButton component={Link} href={`/admin/tutorials/${r._id}`} aria-label="Edit"><EditRounded /></IconButton>
                  <IconButton color="error" onClick={() => setDel(r)} aria-label="Delete"><DeleteOutlineRounded /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <ConfirmDialog open={!!del} title={`Delete "${del?.title}"?`} onCancel={() => setDel(null)} onConfirm={async () => {
        const d = del; setDel(null);
        try { await withLoading(api.del(`/api/tutorials/${d._id}`)); load(); } catch (err) { notifyError(err); }
      }} />
    </>
  );
}

export default function Page() {
  return <RequireAuth admin><List /></RequireAuth>;
}
