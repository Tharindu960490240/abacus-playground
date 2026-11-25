"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { ExpandMoreRounded, LockRounded, OndemandVideoRounded, PictureAsPdfRounded, QuizRounded, ArrowBackRounded } from "@mui/icons-material";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/client/api";
import { useNotify } from "@/components/NotifyProvider";
import { courseLevelLabel } from "@/lib/shared/course";

const LESSON_ICONS = { video: OndemandVideoRounded, paper: PictureAsPdfRounded, question: QuizRounded };

function Chapters() {
  const { level } = useParams();
  const { notifyError } = useNotify();
  const [chapters, setChapters] = useState(null);
  useEffect(() => { api.get(`/api/course/chapters?level=${encodeURIComponent(level)}`).then(setChapters).catch(notifyError); }, [level, notifyError]);

  const openIndex = chapters?.findIndex((c) => c.lessons.some((l) => l.current));

  return (
    <>
      <Button component={Link} href="/course" startIcon={<ArrowBackRounded />} sx={{ mb: 1 }}>All levels</Button>
      <PageHeader title={courseLevelLabel(level)} subtitle="Chapters and lessons" />
      {!chapters && <Skeleton variant="rounded" height={240} />}
      {chapters?.length === 0 && <Typography color="text.secondary">No chapters in this level yet.</Typography>}
      {chapters?.map((c, i) => (
        <Accordion key={c._id} defaultExpanded={i === (openIndex >= 0 ? openIndex : 0)} disableGutters sx={{ mb: 1.5, borderRadius: 3, "&:before": { display: "none" } }} variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreRounded />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Chip label={i + 1} color={c.locked ? "default" : "primary"} />
              <Box>
                <Typography variant="h6" sx={{ fontSize: 18 }}>{c.title}</Typography>
                <Typography variant="body2" color="text.secondary">{c.description}</Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <List dense>
              {c.lessons.length === 0 && <Typography color="text.secondary" variant="body2" sx={{ px: 2 }}>No lessons yet.</Typography>}
              {c.lessons.map((l) => {
                const Icon = LESSON_ICONS[l.type] || OndemandVideoRounded;
                return (
                  <ListItemButton key={l._id} component={l.locked ? "div" : Link} href={l.locked ? undefined : `/course/lesson/${l._id}`} disabled={l.locked} selected={l.current} sx={{ borderRadius: 2 }}>
                    <ListItemIcon>{l.locked ? <LockRounded /> : <Icon color="primary" />}</ListItemIcon>
                    <ListItemText primary={l.title} secondary={{ video: "Video", paper: "Worksheet", question: "Quiz" }[l.type]} />
                    {l.current && <Chip size="small" color="primary" label="Next up" />}
                  </ListItemButton>
                );
              })}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </>
  );
}

export default function Page() {
  return <RequireAuth><Chapters /></RequireAuth>;
}
