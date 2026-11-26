"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PlayArrowRounded, SchoolRounded } from "@mui/icons-material";
import { useAuth } from "@/components/AuthProvider";
import Soroban from "@/components/Soroban";
import FeatureIcon from "@/components/FeatureIcon";
import BeadProgress, { ANZAN_LEVELS, DICTATION_LEVELS } from "@/components/BeadProgress";
import { api } from "@/lib/client/api";
import { levelLabel } from "@/lib/shared/numbers";

const GAMES = [
  { href: "/play/anzan", icon: "anzan", title: "Anzan", text: "Numbers flash up one by one. Add them in your head." },
  { href: "/play/dictation", icon: "dictation", title: "Dictation", text: "Listen to the numbers being read out, then answer." },
  { href: "/play/tables", icon: "tables", title: "Times tables", text: "Multiply and divide before the clock runs out." },
  { href: "/play/bonds", icon: "bonds", title: "Number bonds", text: "Find the partner that makes 5, 10 or 100." },
  { href: "/soroban", icon: "soroban", title: "Soroban", text: "Move the beads yourself on a virtual abacus." },
  { href: "/papers", icon: "papers", title: "Papers", text: "Print a practice paper for your level." },
];

/** Hero soroban: starts at zero and slides its beads to a number once, after the page loads. */
function HeroSoroban() {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setValue(73915), 450);
    return () => clearTimeout(t);
  }, []);
  return <Soroban value={value} digits={7} size="large" interactive showValue label="Virtual soroban. Click the beads to change the number." />;
}

function Hero() {
  return (
    <Box
      sx={(t) => ({
        borderRadius: { xs: "24px", md: "32px" }, overflow: "hidden", position: "relative",
        bgcolor: "#282c7d", color: "#fff",
        ...t.applyStyles("dark", { bgcolor: "#1B1E5C" }),
      })}
    >
      <Grid container sx={{ alignItems: "center" }}>
        <Grid size={{ xs: 12, md: 6 }} sx={{ p: { xs: 3.5, sm: 5, md: 7 } }}>
          <Typography variant="h1" sx={{ fontSize: { xs: "2.4rem", sm: "3rem", md: "3.5rem" }, maxWidth: 520 }}>
            Count with beads. Then count without them.
          </Typography>
          <Typography sx={{ mt: 2.5, fontSize: { xs: 16, md: 18 }, color: "rgba(255,255,255,.78)", maxWidth: 470 }}>
            Children learn the soroban step by step, then train fast, accurate mental maths with games, printable papers and a guided course.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
            <Button component={Link} href="/register" size="large" variant="contained" color="secondary">Create a free account</Button>
            <Button component={Link} href="/login" size="large" sx={{ color: "#fff", bgcolor: "rgba(255,255,255,.1)", "&:hover": { bgcolor: "rgba(255,255,255,.18)" } }}>I already have one</Button>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ p: { xs: 2, sm: 4 }, pt: { xs: 0, md: 4 }, display: "flex", justifyContent: "center" }}>
          <Box sx={{ bgcolor: "#FBF6EE", color: "#2b1a0c", borderRadius: "24px", p: { xs: 1.5, sm: 2.5 }, maxWidth: "100%", boxShadow: "0 24px 60px rgba(5,6,30,.35)" }}>
            <HeroSoroban />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

function Welcome({ user }) {
  const [scores, setScores] = useState(null);
  useEffect(() => {
    api.get("/api/users/me/scores").then(setScores).catch(() => setScores({}));
  }, []);
  const first = user.name.split(" ")[0];
  return (
    <Box sx={(t) => ({ borderRadius: "32px", p: { xs: 3, md: 5 }, bgcolor: t.vars.palette.surface.low })}>
      <Grid container spacing={{ xs: 3, md: 5 }} sx={{ alignItems: "center" }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Typography variant="h2" component="h1" sx={{ fontSize: { xs: "2rem", md: "2.6rem" } }}>Welcome back, {first}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 420 }}>
            A level game a day keeps the beads moving. Pick up where you left off.
          </Typography>
          <Stack direction="row" useFlexGap spacing={1.5} sx={{ mt: 3, flexWrap: "wrap" }}>
            <Button component={Link} href="/play" variant="contained" size="large" startIcon={<PlayArrowRounded />}>Play a game</Button>
            <Button component={Link} href="/course" variant="tonal" size="large" startIcon={<SchoolRounded />}>Continue course</Button>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={2}>
            {[["anzan", "Anzan", ANZAN_LEVELS], ["dictation", "Dictation", DICTATION_LEVELS]].map(([k, label, levels]) => (
              <Card key={k} component={Link} href={`/play/${k}`} sx={{ textDecoration: "none", p: 2.5, display: "flex", gap: 2, alignItems: "center", "&:hover": { borderColor: "primary.main" } }}>
                <FeatureIcon name={k} size={48} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 1, columnGap: 1, flexWrap: "wrap" }}>
                    <Typography sx={{ fontWeight: 650 }}>{label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {scores?.[k] ? `${levelLabel(scores[k].level)} · ${scores[k].marks} marks` : " "}
                    </Typography>
                  </Box>
                  <BeadProgress level={scores?.[k]?.level ?? 15} levels={levels} size="small" showLabel={false} />
                </Box>
              </Card>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function Home() {
  const { user, ready } = useAuth();
  return (
    <Stack spacing={{ xs: 6, md: 9 }}>
      {!ready ? <Box sx={{ height: { xs: 520, md: 460 } }} /> : user ? <Welcome user={user} /> : <Hero />}

      <Box component="section" aria-labelledby="games-title">
        <Typography id="games-title" variant="h4" component="h2" sx={{ mb: 1 }}>Games and tools</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>Short, focused practice. Most rounds take two to five minutes.</Typography>
        <Grid container spacing={2}>
          {GAMES.map((g) => (
            <Grid key={g.href} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: "100%", "&:hover": { borderColor: "primary.main" } }}>
                <CardActionArea component={Link} href={g.href} sx={{ height: "100%", p: 2.5, display: "flex", alignItems: "flex-start", justifyContent: "flex-start", gap: 2 }}>
                  <FeatureIcon name={g.icon} size={52} />
                  <Box>
                    <Typography variant="h6" component="h3">{g.title}</Typography>
                    <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>{g.text}</Typography>
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {!user && (
        <Box component="section" aria-labelledby="levels-title" sx={(t) => ({ borderRadius: "32px", p: { xs: 3, md: 6 }, bgcolor: t.vars.palette.surface.low })}>
          <Grid container spacing={{ xs: 3, md: 6 }} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography id="levels-title" variant="h4" component="h2">Every level is a bead</Typography>
              <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                Everyone starts at Level 15. Pass a level game and a bead slides along the rod. After Level 1 come Dan 1 to 5. Teachers see each student&apos;s rod and can mark printed papers.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <Card sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <Typography sx={{ fontWeight: 650, mb: 2 }}>Example: a student on Level 9</Typography>
                <BeadProgress level={9} levels={DICTATION_LEVELS} />
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Stack>
  );
}
