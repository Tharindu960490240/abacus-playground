"use client";
import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/client/api";
import { levelLabel } from "@/lib/shared/numbers";
import FeatureIcon from "@/components/FeatureIcon";

const GAMES = [
  { href: "/play/anzan", key: "anzan", icon: "anzan", title: "Anzan", text: "Flash numbers — calculate in your head, with an optional soroban view." },
  { href: "/play/dictation", key: "dictation", icon: "dictation", title: "Dictation", text: "Numbers are read aloud. Listen and work it out." },
  { href: "/play/tables", icon: "tables", title: "Times tables", text: "Multiplication and division against the clock." },
  { href: "/play/bonds", icon: "bonds", title: "Number bonds", text: "Find the partner number that makes 5, 10 or 100." },
];

function PlayHub() {
  const [scores, setScores] = useState({});
  useEffect(() => {
    api.get("/api/users/me/scores").then(setScores).catch(() => {});
  }, []);
  return (
    <>
      <PageHeader title="Play" subtitle="Practise freely, or play a level game to climb from Level 15 to Dan." />
      <Grid container spacing={3}>
        {GAMES.map((g) => (
          <Grid key={g.href} size={{ xs: 12, sm: 6 }}>
            <Card sx={{ height: "100%" }}>
              <CardActionArea component={Link} href={g.href} sx={{ height: "100%" }}>
                <CardContent sx={{ display: "flex", gap: 3, alignItems: "center", p: 3 }}>
                  <FeatureIcon name={g.icon} size={80} />
                  <Box>
                    <Typography variant="h5" component="h2">{g.title}</Typography>
                    <Typography color="text.secondary" sx={{ my: 1 }}>{g.text}</Typography>
                    {g.key && scores[g.key] && (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Chip size="small" color="primary" label={levelLabel(scores[g.key].level)} />
                        <Chip size="small" variant="outlined" label={`${scores[g.key].marks} marks`} />
                      </Box>
                    )}
                  </Box>
                </CardContent>
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
