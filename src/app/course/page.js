"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { LockRounded, PlayCircleRounded, CheckCircleRounded, ChevronRightRounded } from "@mui/icons-material";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/client/api";
import { useNotify } from "@/components/NotifyProvider";
import { COURSE_LEVELS } from "@/lib/shared/course";

function Levels() {
  const { notifyError } = useNotify();
  const [p, setP] = useState(null);
  useEffect(() => { api.get("/api/course/progress").then(setP).catch(notifyError); }, [notifyError]);

  return (
    <>
      <PageHeader
        title="Course"
        subtitle="Work through the levels in order. Each lesson unlocks the next one."
        action={p?.lesson_id && !p.isAdmin ? <Button variant="contained" startIcon={<PlayCircleRounded />} component={Link} href={`/course/lesson/${p.lesson_id}`}>Continue where I left off</Button> : null}
      />
      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, maxWidth: 760 }} aria-label="Course levels">
        {COURSE_LEVELS.map((l, i) => {
          const locked = p && i > p.levelIndex;
          const done = p && !p.isAdmin && i < p.levelIndex;
          const current = p && !p.isAdmin && i === p.levelIndex;
          const last = i === COURSE_LEVELS.length - 1;
          return (
            <Box component="li" key={l.value} sx={{ display: "flex", gap: { xs: 2, sm: 3 } }}>
              {/* the rod and its bead */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 44, flex: "none" }}>
                <Box
                  sx={(t) => ({
                    width: 44, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", mt: 2.5,
                    bgcolor: done || current ? t.vars.palette.secondary.main : t.vars.palette.surface.high,
                    color: done || current ? "#fff" : t.vars.palette.text.secondary,
                    boxShadow: current ? `0 0 0 5px ${t.vars.palette.surface.tint}` : "none",
                  })}
                >
                  {locked ? <LockRounded sx={{ fontSize: 18 }} /> : done ? <CheckCircleRounded sx={{ fontSize: 20 }} /> : <Typography sx={{ fontWeight: 700, color: "inherit" }}>{i + 1}</Typography>}
                </Box>
                {!last && <Box sx={{ flex: 1, width: 3, borderRadius: 2, bgcolor: done ? "secondary.main" : "wood.main", opacity: done ? 0.8 : 0.35, my: 0.5 }} />}
              </Box>
              <Card sx={{ flex: 1, mb: 2, opacity: locked ? 0.65 : 1, borderColor: current ? "primary.main" : undefined, borderWidth: current ? 2 : 1 }}>
                <CardActionArea component={locked ? "div" : Link} href={locked ? undefined : `/course/${l.value}`} disabled={!!locked} sx={{ p: { xs: 2.5, sm: 3 }, display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" component="h2">{l.label}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                      {locked ? "Finish the level before to unlock" : done ? "Finished. Open to revise any lesson" : current ? "You are working on this level" : "Open"}
                    </Typography>
                  </Box>
                  {current && <Chip color="primary" label="Current" />}
                  {!locked && <ChevronRightRounded color="action" />}
                </CardActionArea>
              </Card>
            </Box>
          );
        })}
      </Box>
    </>
  );
}

export default function Page() {
  return <RequireAuth><Levels /></RequireAuth>;
}
