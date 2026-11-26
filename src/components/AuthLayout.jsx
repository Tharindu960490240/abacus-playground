"use client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Soroban from "./Soroban";

/** Two-panel layout for log in and registration. The soroban panel hides on small screens. */
export default function AuthLayout({ title, subtitle, children, wide = false }) {
  return (
    <Box
      sx={(t) => ({
        display: "grid", gridTemplateColumns: { xs: "1fr", md: wide ? "5fr 7fr" : "1fr 1fr" }, borderRadius: { xs: "24px", md: "32px" },
        overflow: "hidden", border: `1px solid ${t.vars.palette.divider}`, bgcolor: "background.paper", minHeight: { md: 560 },
      })}
    >
      <Box sx={(t) => ({ display: { xs: "none", md: "flex" }, flexDirection: "column", justifyContent: "space-between", p: 5, bgcolor: "#282c7d", color: "#fff", ...t.applyStyles("dark", { bgcolor: "#1B1E5C" }) })}>
        <Box>
          <Typography variant="h4" component="p" sx={{ color: "#fff", maxWidth: 340 }}>A few minutes a day, one bead at a time.</Typography>
          <Typography sx={{ mt: 1.5, color: "rgba(255,255,255,.75)", maxWidth: 340 }}>Games, papers and lessons that follow each student from Level 15 to Dan.</Typography>
        </Box>
        <Box sx={{ alignSelf: "center", bgcolor: "#FBF6EE", color: "#2b1a0c", borderRadius: "20px", p: 1.5, mt: 4 }}>
          <Soroban value={2468} digits={5} size="medium" />
        </Box>
      </Box>
      <Box sx={{ p: { xs: 3, sm: 5 }, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Typography variant="h3" component="h1" sx={{ fontSize: { xs: "1.9rem", md: "2.2rem" } }}>{title}</Typography>
        {subtitle && <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>{subtitle}</Typography>}
        {children}
      </Box>
    </Box>
  );
}
