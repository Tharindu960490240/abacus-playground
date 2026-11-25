"use client";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useAuth } from "@/components/AuthProvider";
import Soroban from "@/components/Soroban";
import FeatureIcon from "@/components/FeatureIcon";

const FEATURES = [
  { href: "/play/anzan", icon: "anzan", title: "Anzan", text: "Numbers flash on screen — add them up in your head." },
  { href: "/play/dictation", icon: "dictation", title: "Dictation", text: "Listen to the numbers and work out the answer." },
  { href: "/play/tables", icon: "tables", title: "Times tables", text: "Beat the clock on multiplication and division." },
  { href: "/play/bonds", icon: "bonds", title: "Number bonds", text: "Quick-fire pairs that make 5, 10 and 100." },
  { href: "/soroban", icon: "soroban", title: "Soroban", text: "Move the beads on a virtual abacus." },
  { href: "/papers", icon: "papers", title: "Papers", text: "Print a practice paper for your level." },
];

export default function Home() {
  const { user } = useAuth();
  return (
    <Stack spacing={8}>
      <Box
        sx={(t) => ({
          borderRadius: 6, p: { xs: 4, md: 7 }, color: "#fff", position: "relative", overflow: "hidden",
          background: `linear-gradient(135deg, #282c7d 0%, #1b1e5c 60%, ${alpha("#ed1f24", 0.85)} 140%)`,
          ...t.applyStyles("dark", { background: "linear-gradient(135deg, #1b1e5c 0%, #10133d 70%, #4a1030 140%)" }),
        })}
      >
        <Grid container spacing={4} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h2" component="h1" sx={{ fontSize: { xs: 36, md: 52 }, lineHeight: 1.1 }}>
              Mental maths, the abacus way
            </Typography>
            <Typography sx={{ mt: 2, opacity: 0.85, fontSize: 18, maxWidth: 520 }}>
              Flash anzan, dictation, times tables and number bonds — with levels to climb, a leaderboard, printable papers and a step-by-step course.
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
              {user ? (
                <Button component={Link} href="/play" size="large" variant="contained" color="secondary">Start playing</Button>
              ) : (
                <>
                  <Button component={Link} href="/register" size="large" variant="contained" color="secondary">Create an account</Button>
                  <Button component={Link} href="/login" size="large" variant="outlined" sx={{ color: "#fff", borderColor: alpha("#fff", 0.5) }}>Log in</Button>
                </>
              )}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: "flex", justifyContent: "center" }}>
            <Box sx={{ bgcolor: alpha("#fff", 0.95), borderRadius: 4, p: 2, color: "#1a202c" }}>
              <Soroban value={1234} digits={6} size="large" interactive showValue />
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Box>
        <Typography variant="h4" component="h2" sx={{ mb: 3 }}>What you can do</Typography>
        <Grid container spacing={3}>
          {FEATURES.map((f) => (
            <Grid key={f.href} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: "100%" }}>
                <CardActionArea component={Link} href={f.href} sx={{ height: "100%", p: 1 }}>
                  <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <FeatureIcon name={f.icon} size={56} />
                    <Box>
                      <Typography variant="h6" component="h3">{f.title}</Typography>
                      <Typography color="text.secondary" variant="body2">{f.text}</Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Stack>
  );
}
