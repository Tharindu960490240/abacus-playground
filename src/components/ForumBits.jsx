"use client";
import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

export function timeAgo(d) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function PostDialog({ open, onClose, onSave, initial }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {open && <PostForm initial={initial} onClose={onClose} onSave={onSave} />}
    </Dialog>
  );
}

// Mounted fresh each time the dialog opens, so it starts from `initial`.
function PostForm({ initial, onClose, onSave }) {
  const [topic, setTopic] = useState(initial?.topic || "");
  const [description, setDescription] = useState(initial?.description || "");
  return (
    <>
      <DialogTitle>{initial ? "Edit question" : "Ask a question"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} slotProps={{ htmlInput: { maxLength: 200 } }} autoFocus />
          <TextField label="Details" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={4} slotProps={{ htmlInput: { maxLength: 10000 } }} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!topic.trim() || !description.trim()} onClick={() => onSave({ topic, description })}>{initial ? "Save" : "Post"}</Button>
      </DialogActions>
    </>
  );
}

