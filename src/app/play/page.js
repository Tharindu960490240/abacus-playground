"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import FeatureIcon from "@/components/FeatureIcon";
import BeadProgress, { ANZAN_LEVELS, DICTATION_LEVELS } from "@/components/BeadProgress";
import { api } from "@/lib/client/api";
import { levelLabel } from "@/lib/shared/numbers";

const LEVEL_GAMES = [
  { href: "/play/anzan", key: "anzan", levels: ANZAN_LEVELS, title: "Anzan", text: "Numbers flash up one after another. Add them in your head — or watch them on a soroban." },
  { href: "/play/dictation", key: "dictation", levels: DICTATION_LEVELS, title: "Dictation", text: "The numbers are read out loud. Listen, calculate, answer. Turn your sound on." },
];
const DRILLS = [
  { href: "/play/tables", icon: "tables", title: "Times tables", text: "Pick your tables and race the clock." },
  { href: "/play/bonds", icon: "bonds", title: "Number bonds", text: "Pairs that make 5, 10 and 100." },
  { href: "/soroban", icon: "soroban", title: "Virtual soroban", text: "Set any number with the beads." },
];

function PlayHub() {
  const [scores, setScores] = useState(null);
  useEffect(() => {
    api.get("/api/users/me/scores").then(setScores).catch(() => setScores({}));
  }, []);
  return (
    <>
      <PageHeader title="Play" subtitle="Level games move you up the rod and count on the leaderboard. Quick drills are for warming up." />
      <Grid container spacing={2.5}>
        {LEVEL_GAMES.map((g) => {
          const s = scores?.[g.key];
          return (
            <Grid key={g.href} size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: "100%", "&:hover": { borderColor: "primary.main" } }}>
                <CardActionArea component={Link} href={g.href} sx={{ height: "100%", p: { xs: 2.5, sm: 3.5 }, display: "flex", flexDirection: "column", alignItems: "stretch", gap: 2.5 }}>
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <FeatureIcon name={g.key} size={64} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" component="h2">{g.title}</Typography>
                      <Typography color="text.secondary" variant="body2">{s ? `${levelLabel(s.level)} · ${s.marks} marks` : "Level 15 · 0 marks"}</Typography>
                    </Box>
                  </Box>
                  <Typography color="text.secondary">{g.text}</Typography>
                  <BeadProgress level={s?.level ?? 15} levels={g.levels} />
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Typography variant="h5" component="h2" sx={{ mt: { xs: 5, md: 6 }, mb: 2 }}>Quick drills</Typography>
      <Grid container spacing={2}>
        {DRILLS.map((d) => (
          <Grid key={d.href} size={{ xs: 12, sm: 4 }}>
            <Card sx={{ height: "100%", "&:hover": { borderColor: "primary.main" } }}>
              <CardActionArea component={Link} href={d.href} sx={{ height: "100%", p: 2.5, display: "flex", justifyContent: "flex-start", alignItems: "center", gap: 2 }}>
                <FeatureIcon name={d.icon} size={48} />
                <Box>
                  <Typography sx={{ fontWeight: 650 }}>{d.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{d.text}</Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}

export default function Page() {
  return <RequireAuth><PlayHub /></RequireAuth>;
}
