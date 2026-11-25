"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ArrowBackRounded, DeleteOutlineRounded, EditRounded } from "@mui/icons-material";
import RequireAuth from "@/components/RequireAuth";
import UserAvatar from "@/components/UserAvatar";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/client/api";
import { useNotify } from "@/components/NotifyProvider";
import { PostDialog, timeAgo } from "@/components/ForumBits";

function Post() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { notify, notifyError, withLoading } = useNotify();
  const [post, setPost] = useState(null);
  const [answer, setAnswer] = useState("");
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(() => api.get(`/api/forum/${id}`).then(setPost).catch(notifyError), [id, notifyError]);
  useEffect(() => { load(); }, [load]);

  const canChange = (author) => user && (user.isAdmin || author?._id === user._id);

  const reply = async (e) => {
    e.preventDefault();
    try {
      await withLoading(api.post(`/api/forum/${id}/answers`, { answer }));
      setAnswer("");
      load();
    } catch (err) {
      notifyError(err);
    }
  };

  const doConfirm = async () => {
    const c = confirm;
    setConfirm(null);
    try {
      if (c.type === "post") {
        await withLoading(api.del(`/api/forum/${id}`));
        notify("Question deleted", "success");
        router.push("/forum");
      } else {
        await withLoading(api.del(`/api/forum/${id}/answers/${c.answerId}`));
        load();
      }
    } catch (err) {
      notifyError(err);
    }
  };

  if (!post) return null;
  return (
    <Box sx={{ maxWidth: 820, mx: "auto" }}>
      <Button component={Link} href="/forum" startIcon={<ArrowBackRounded />} sx={{ mb: 2 }}>All questions</Button>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
            <UserAvatar user={post.author} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700 }}>{post.author?.name || "Former student"}</Typography>
              <Typography variant="caption" color="text.secondary">{timeAgo(post.date)}</Typography>
            </Box>
            {canChange(post.author) && (
              <>
                <IconButton onClick={() => setEditing(true)} aria-label="Edit question"><EditRounded /></IconButton>
                <IconButton color="error" onClick={() => setConfirm({ type: "post" })} aria-label="Delete question"><DeleteOutlineRounded /></IconButton>
              </>
            )}
          </Box>
          <Typography variant="h5" component="h1" sx={{ mb: 1 }}>{post.topic}</Typography>
          <Typography sx={{ whiteSpace: "pre-wrap" }}>{post.description}</Typography>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ mb: 2 }}>{post.answers.length} {post.answers.length === 1 ? "answer" : "answers"}</Typography>
      <Stack spacing={2} divider={<Divider flexItem />} sx={{ mb: 3 }}>
        {post.answers.map((a) => (
          <Box key={a._id} sx={{ display: "flex", gap: 2 }}>
            <UserAvatar user={a.author} size={36} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{a.author?.name || "Former student"} <Typography component="span" variant="caption" color="text.secondary">· {timeAgo(a.date)}</Typography></Typography>
              <Typography sx={{ whiteSpace: "pre-wrap" }}>{a.answer}</Typography>
            </Box>
            {canChange(a.author) && <IconButton size="small" onClick={() => setConfirm({ type: "answer", answerId: a._id })} aria-label="Delete answer"><DeleteOutlineRounded fontSize="small" /></IconButton>}
          </Box>
        ))}
      </Stack>

      <Card>
        <CardContent component="form" onSubmit={reply}>
          <TextField label="Write an answer" value={answer} onChange={(e) => setAnswer(e.target.value)} multiline minRows={3} slotProps={{ htmlInput: { maxLength: 5000 } }} />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button type="submit" variant="contained" disabled={!answer.trim()}>Post answer</Button>
          </Box>
        </CardContent>
      </Card>

      <PostDialog open={editing} initial={post} onClose={() => setEditing(false)} onSave={async (body) => {
        try { await withLoading(api.patch(`/api/forum/${id}`, body)); setEditing(false); load(); } catch (err) { notifyError(err); }
      }} />
      <ConfirmDialog open={!!confirm} title={confirm?.type === "post" ? "Delete this question?" : "Delete this answer?"} onCancel={() => setConfirm(null)} onConfirm={doConfirm} />
    </Box>
  );
}

export default function Page() {
  return <RequireAuth><Post /></RequireAuth>;
}
