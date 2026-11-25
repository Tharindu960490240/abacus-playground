"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { AddRounded, ChatBubbleOutlineRounded, SearchRounded } from "@mui/icons-material";
import InputAdornment from "@mui/material/InputAdornment";
import RequireAuth from "@/components/RequireAuth";
import { PostDialog, timeAgo } from "@/components/ForumBits";
import PageHeader from "@/components/PageHeader";
import UserAvatar from "@/components/UserAvatar";
import { api } from "@/lib/client/api";
import { useNotify } from "@/components/NotifyProvider";

function Forum() {
  const { notify, notifyError, withLoading } = useNotify();
  const [posts, setPosts] = useState(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(() => api.get("/api/forum").then(setPosts).catch(notifyError), [notifyError]);
  useEffect(() => { load(); }, [load]);

  const create = async (body) => {
    try {
      await withLoading(api.post("/api/forum", body));
      setOpen(false);
      notify("Your question has been posted", "success");
      load();
    } catch (err) {
      notifyError(err);
    }
  };

  const shown = (posts || []).filter((p) => !q || `${p.topic} ${p.description}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Forum" subtitle="Ask questions and help each other." action={<Button variant="contained" startIcon={<AddRounded />} onClick={() => setOpen(true)}>Ask a question</Button>} />
      <TextField placeholder="Search questions" value={q} onChange={(e) => setQ(e.target.value)} sx={{ mb: 3 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> } }} />
      <Stack spacing={2}>
        {posts && shown.length === 0 && <Typography color="text.secondary">No questions yet.</Typography>}
        {shown.map((p) => (
          <Card key={p._id}>
            <CardActionArea component={Link} href={`/forum/${p._id}`}>
              <CardContent sx={{ display: "flex", gap: 2 }}>
                <UserAvatar user={p.author} size={44} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontSize: 18 }}>{p.topic}</Typography>
                  <Typography color="text.secondary" variant="body2" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", my: 0.5 }}>{p.description}</Typography>
                  <Typography variant="caption" color="text.secondary">{p.author?.name || "Former student"} · {timeAgo(p.date)}</Typography>
                </Box>
                <Chip icon={<ChatBubbleOutlineRounded />} label={p.answerCount} variant="outlined" sx={{ alignSelf: "center" }} />
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
      <PostDialog open={open} onClose={() => setOpen(false)} onSave={create} />
    </>
  );
}

export default function Page() {
  return <RequireAuth><Forum /></RequireAuth>;
}
