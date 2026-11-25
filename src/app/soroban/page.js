"use client";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PageHeader from "@/components/PageHeader";
import Soroban from "@/components/Soroban";

export default function SorobanPage() {
  const [value, setValue] = useState(0);
  const [rods, setRods] = useState(9);
  const [typed, setTyped] = useState("");
  return (
    <>
      <PageHeader title="Soroban" subtitle="Click the beads (or focus a rod and use the arrow keys) to make numbers." />
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
            <TextField select label="Rods" value={rods} onChange={(e) => setRods(Number(e.target.value))} sx={{ maxWidth: { sm: 160 } }}>
              {[5, 7, 9, 11, 13].map((n) => <MenuItem key={n} value={n}>{n} rods</MenuItem>)}
            </TextField>
            <Box component="form" onSubmit={(e) => { e.preventDefault(); const n = Number(typed); if (Number.isFinite(n) && n >= 0) setValue(Math.trunc(n)); }} sx={{ display: "flex", gap: 1, flex: 1 }}>
              <TextField label="Show a number" value={typed} onChange={(e) => setTyped(e.target.value.replace(/\D/g, "").slice(0, rods))} slotProps={{ htmlInput: { inputMode: "numeric" } }} />
              <Button type="submit" variant="contained">Show</Button>
            </Box>
            <Button onClick={() => { setValue(0); setTyped(""); }}>Clear</Button>
          </Stack>
          <Box sx={{ display: "flex", justifyContent: "center", overflowX: "auto" }}>
            <Soroban key={`${rods}-${value}`} value={value} digits={rods} size="large" interactive showValue onChange={() => {}} />
          </Box>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 3, textAlign: "center" }}>
            Each upper bead is worth 5 and each lower bead 1 when pushed to the bar. Dots on the bar mark the units rods.
          </Typography>
        </CardContent>
      </Card>
    </>
  );
}
