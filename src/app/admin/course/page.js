"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  AddRounded, DeleteOutlineRounded, EditRounded, OndemandVideoRounded, PictureAsPdfRounded, QuizRounded,
  UploadFileRounded, VisibilityRounded,
} from "@mui/icons-material";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import ConfirmDialog from "@/components/ConfirmDialog";
import { api } from "@/lib/client/api";
import { useNotify } from "@/components/NotifyProvider";
import { COURSE_LEVELS, toEmbedUrl } from "@/lib/shared/course";

const ICONS = { video: OndemandVideoRounded, paper: PictureAsPdfRounded, question: QuizRounded };

function ChapterDialog({ open, onClose, ...rest }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {open && <ChapterForm onClose={onClose} {...rest} />}
    </Dialog>
  );
}

function ChapterForm({ initial, level, nextOrder, onClose, onSaved }) {
  const { notifyError, withLoading } = useNotify();
  const [f, setF] = useState(() => ({ title: initial?.title || "", description: initial?.description || "", order: initial?.order ?? nextOrder, level: initial?.level || level }));
  const save = async () => {
    try {
      const body = { ...f, order: Number(f.order) };
      if (initial?._id) await withLoading(api.patch(`/api/course/chapters/${initial._id}`, body));
      else await withLoading(api.post("/api/course/chapters", body));
      onSaved();
    } catch (err) {
      notifyError(err);
    }
  };
  return (
    <>
      <DialogTitle>{initial?._id ? "Edit chapter" : "New chapter"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Title" value={f.title || ""} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <TextField label="Description" value={f.description || ""} onChange={(e) => setF({ ...f, description: e.target.value })} multiline minRows={2} />
          <Stack direction="row" spacing={2}>
            <TextField select label="Level" value={f.level || level} onChange={(e) => setF({ ...f, level: e.target.value })}>
              {COURSE_LEVELS.map((l) => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
            </TextField>
            <TextField type="number" label="Order" value={f.order ?? 1} onChange={(e) => setF({ ...f, order: e.target.value })} />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={!f.title?.trim() || !f.description?.trim()}>Save</Button>
      </DialogActions>
    </>
  );
}

function LessonDialog({ open, onClose, ...rest }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper">
      {open && <LessonForm onClose={onClose} {...rest} />}
    </Dialog>
  );
}

function LessonForm({ chapter, lessonId, nextOrder, onClose, onSaved }) {
  const { notifyError, withLoading } = useNotify();
  const [f, setF] = useState(() => (lessonId ? null : { type: "video", title: "", order: nextOrder, video_link: [{ link: "", description: "" }], download: [], questions: [{ question: "", answer: "" }] }));
  const fileRef = useRef(null);

  useEffect(() => {
    if (!lessonId) return;
    api.get(`/api/course/lessons/${lessonId}`).then((l) => setF({
      type: l.type, title: l.title, order: l.order,
      video_link: l.video_link.length ? l.video_link.map(({ link, description }) => ({ link, description: description || "" })) : [{ link: "", description: "" }],
      download: l.download.map((d) => ({ name: d.name, description: d.description || "", url: d.url || "" })),
      questions: l.questions.length ? l.questions.map(({ question, answer }) => ({ question, answer })) : [{ question: "", answer: "" }],
    })).catch(notifyError);
  }, [lessonId, notifyError]);

  if (!f) return <DialogContent sx={{ minHeight: 200 }} />;
  const list = (k) => f[k];
  const setItem = (k, i, field, v) => setF({ ...f, [k]: f[k].map((x, j) => (j === i ? { ...x, [field]: v } : x)) });
  const removeItem = (k, i) => setF({ ...f, [k]: f[k].filter((_, j) => j !== i) });

  const uploadPdf = async (file) => {
    if (!file) return;
    try {
      const { url, name } = await withLoading(api.upload("/api/course/files", file));
      setF((s) => ({ ...s, download: [...s.download, { name: name.replace(/\.pdf$/i, ""), description: "", url }] }));
    } catch (err) {
      notifyError(err);
    }
  };

  const save = async () => {
    const base = { type: f.type, title: f.title, order: Number(f.order), chapter_id: chapter._id };
    const body = f.type === "video" ? { ...base, video_link: f.video_link.filter((v) => v.link.trim()) }
      : f.type === "paper" ? { ...base, download: f.download.filter((d) => d.url) }
      : { ...base, questions: f.questions.filter((q) => q.question.trim() && q.answer.trim()) };
    try {
      if (lessonId) await withLoading(api.patch(`/api/course/lessons/${lessonId}`, body));
      else await withLoading(api.post("/api/course/lessons", body));
      onSaved();
    } catch (err) {
      notifyError(err);
    }
  };

  return (
    <>
      <DialogTitle>{lessonId ? "Edit lesson" : `New lesson in "${chapter?.title}"`}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><TextField type="number" label="Order" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField select label="Type" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} disabled={!!lessonId}>
              <MenuItem value="video">Video</MenuItem>
              <MenuItem value="paper">Worksheet (PDF)</MenuItem>
              <MenuItem value="question">Quiz</MenuItem>
            </TextField>
          </Grid>
          {f.type === "video" && list("video_link").map((v, i) => (
            <Grid key={i} size={12}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
                <TextField size="small" label="YouTube or Vimeo link" value={v.link} onChange={(e) => setItem("video_link", i, "link", e.target.value)} error={!!v.link && !toEmbedUrl(v.link)} helperText={v.link && !toEmbedUrl(v.link) ? "Shown as a link (not a YouTube/Vimeo video)" : " "} />
                <TextField size="small" label="Description" value={v.description} onChange={(e) => setItem("video_link", i, "description", e.target.value)} helperText=" " />
                <IconButton onClick={() => removeItem("video_link", i)} aria-label="Remove video" disabled={f.video_link.length === 1}><DeleteOutlineRounded /></IconButton>
              </Stack>
            </Grid>
          ))}
          {f.type === "video" && <Grid size={12}><Button startIcon={<AddRounded />} onClick={() => setF({ ...f, video_link: [...f.video_link, { link: "", description: "" }] })}>Add video</Button></Grid>}

          {f.type === "paper" && (
            <>
              {f.download.map((d, i) => (
                <Grid key={i} size={12}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
                    <PictureAsPdfRounded color="error" />
                    <TextField size="small" label="Name" value={d.name} onChange={(e) => setItem("download", i, "name", e.target.value)} />
                    <TextField size="small" label="Description" value={d.description} onChange={(e) => setItem("download", i, "description", e.target.value)} />
                    <IconButton href={d.url} target="_blank" rel="noopener noreferrer" aria-label="Open file"><VisibilityRounded /></IconButton>
                    <IconButton onClick={() => removeItem("download", i)} aria-label="Remove file"><DeleteOutlineRounded /></IconButton>
                  </Stack>
                </Grid>
              ))}
              <Grid size={12}>
                <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={(e) => { uploadPdf(e.target.files?.[0]); e.target.value = ""; }} />
                <Button startIcon={<UploadFileRounded />} variant="outlined" onClick={() => fileRef.current?.click()}>Upload PDF (max 15 MB)</Button>
              </Grid>
            </>
          )}

          {f.type === "question" && f.questions.map((q, i) => (
            <Grid key={i} size={12}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
                <Typography sx={{ minWidth: 24 }}>{i + 1}.</Typography>
                <TextField size="small" label="Question" value={q.question} onChange={(e) => setItem("questions", i, "question", e.target.value)} />
                <TextField size="small" label="Answer" value={q.answer} onChange={(e) => setItem("questions", i, "answer", e.target.value)} sx={{ maxWidth: { sm: 180 } }} />
                <IconButton onClick={() => removeItem("questions", i)} aria-label="Remove question" disabled={f.questions.length === 1}><DeleteOutlineRounded /></IconButton>
              </Stack>
            </Grid>
          ))}
          {f.type === "question" && (
            <Grid size={12}>
              <Button startIcon={<AddRounded />} onClick={() => setF({ ...f, questions: [...f.questions, { question: "", answer: "" }] })}>Add question</Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Students need 75% to pass. Answers are compared ignoring case, extra spaces and commas.</Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={!f.title.trim()}>Save lesson</Button>
      </DialogActions>
    </>
  );
}

function CourseEditor() {
  const { notify, notifyError, withLoading } = useNotify();
  const [level, setLevel] = useState("foundation");
  const [chapters, setChapters] = useState([]);
  const [chapterDlg, setChapterDlg] = useState(null);
  const [lessonDlg, setLessonDlg] = useState(null);
  const [del, setDel] = useState(null);

  const load = useCallback(() => api.get(`/api/course/chapters?level=${level}`).then(setChapters).catch(notifyError), [level, notifyError]);
  useEffect(() => { load(); }, [load]);

  const nextChapterOrder = (chapters.at(-1)?.order ?? 0) + 1;

  return (
    <>
      <PageHeader title="Course editor" subtitle="Chapters and lessons for each course level." action={<Button variant="contained" startIcon={<AddRounded />} onClick={() => setChapterDlg({})}>New chapter</Button>} />
      <Tabs value={level} onChange={(_, v) => setLevel(v)} variant="scrollable" sx={{ mb: 3 }}>
        {COURSE_LEVELS.map((l) => <Tab key={l.value} value={l.value} label={l.label} />)}
      </Tabs>
      {chapters.length === 0 && <Typography color="text.secondary">No chapters in this level yet.</Typography>}
      <Stack spacing={2}>
        {chapters.map((c) => (
          <Card key={c._id}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Chip label={c.order} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontSize: 18 }}>{c.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{c.description}</Typography>
                </Box>
                <Button size="small" startIcon={<AddRounded />} onClick={() => setLessonDlg({ chapter: c, nextOrder: (c.lessons.at(-1)?.order ?? 0) + 1 })}>Lesson</Button>
                <IconButton onClick={() => setChapterDlg(c)} aria-label="Edit chapter"><EditRounded /></IconButton>
                <IconButton color="error" onClick={() => setDel({ kind: "chapter", item: c })} aria-label="Delete chapter"><DeleteOutlineRounded /></IconButton>
              </Box>
              <List dense>
                {c.lessons.map((l) => {
                  const Icon = ICONS[l.type];
                  return (
                    <ListItem key={l._id} secondaryAction={
                      <Box>
                        <IconButton component={Link} href={`/course/lesson/${l._id}`} aria-label="Preview lesson"><VisibilityRounded fontSize="small" /></IconButton>
                        <IconButton onClick={() => setLessonDlg({ chapter: c, lessonId: l._id })} aria-label="Edit lesson"><EditRounded fontSize="small" /></IconButton>
                        <IconButton color="error" onClick={() => setDel({ kind: "lesson", item: l })} aria-label="Delete lesson"><DeleteOutlineRounded fontSize="small" /></IconButton>
                      </Box>
                    }>
                      <ListItemIcon><Icon color="primary" /></ListItemIcon>
                      <ListItemText primary={`${l.order}. ${l.title}`} />
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <ChapterDialog open={!!chapterDlg} initial={chapterDlg?._id ? chapterDlg : null} level={level} nextOrder={nextChapterOrder} onClose={() => setChapterDlg(null)} onSaved={() => { setChapterDlg(null); notify("Chapter saved", "success"); load(); }} />
      <LessonDialog open={!!lessonDlg} chapter={lessonDlg?.chapter} lessonId={lessonDlg?.lessonId} nextOrder={lessonDlg?.nextOrder ?? 1} onClose={() => setLessonDlg(null)} onSaved={() => { setLessonDlg(null); notify("Lesson saved", "success"); load(); }} />
      <ConfirmDialog
        open={!!del}
        title={del?.kind === "chapter" ? `Delete chapter "${del?.item.title}"?` : `Delete lesson "${del?.item.title}"?`}
        text={del?.kind === "chapter" ? "All lessons and uploaded files in this chapter will be deleted too." : "This cannot be undone."}
        onCancel={() => setDel(null)}
        onConfirm={async () => {
          const d = del; setDel(null);
          try { await withLoading(api.del(`/api/course/${d.kind === "chapter" ? "chapters" : "lessons"}/${d.item._id}`)); load(); } catch (err) { notifyError(err); }
        }}
      />
    </>
  );
}

export default function Page() {
  return <RequireAuth admin><CourseEditor /></RequireAuth>;
}
