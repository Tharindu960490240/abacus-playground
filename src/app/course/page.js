"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { LockRounded, PlayCircleRounded, CheckCircleRounded } from "@mui/icons-material";
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
      <Grid container spacing={3}>
        {COURSE_LEVELS.map((l, i) => {
          const locked = p && i > p.levelIndex;
          const done = p && !p.isAdmin && i < p.levelIndex;
          return (
            <Grid key={l.value} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: "100%", opacity: locked ? 0.6 : 1 }}>
                <CardActionArea component={locked ? "div" : Link} href={locked ? undefined : `/course/${l.value}`} disabled={!!locked} sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Typography variant="overline" color="text.secondary">Level {i + 1}</Typography>
                      {locked ? <LockRounded color="disabled" /> : done ? <CheckCircleRounded color="success" /> : <PlayCircleRounded color="primary" />}
                    </Box>
                    <Typography variant="h5" component="h2">{l.label}</Typography>
                    {p && !p.isAdmin && i === p.levelIndex && <Chip size="small" color="primary" label="You are here" sx={{ mt: 1 }} />}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}

export default function Page() {
  return <RequireAuth><Levels /></RequireAuth>;
}
