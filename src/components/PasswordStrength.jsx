"use client";
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { RadioButtonUncheckedRounded, CheckCircleRounded } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

// The same five rules the server enforces. They now live in one shared file
// (src/lib/shared/password.js) that the API also imports, so the checklist and
// the server can never disagree.
import { PASSWORD_RULES, isStrongPassword } from "../lib/shared/password";

export { PASSWORD_RULES, isStrongPassword };

// Checklist that ticks off each rule as the person types, with a five-part strength bar.
export default function PasswordStrength({ password = "", sx }) {
  const { t } = useTranslation();
  const results = PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(password) }));
  const passed = results.filter((r) => r.ok).length;
  const barColor = ["error.main", "error.main", "warning.main", "warning.main", "success.main"][Math.max(0, passed - 1)];
  const label = passed === 5 ? t("password.strong") : t("password.needs");

  return (
    <Box
      role="group"
      aria-label={t("password.needs")}
      // With CSS-variable themes palette.mode is always the default scheme,
      // so dark-mode colours use theme.applyStyles instead.
      sx={[
        (th) => ({
          p: 2.25, borderRadius: 4, border: 1, borderColor: "divider",
          bgcolor: "#f4f7fb",
          ...th.applyStyles("dark", { bgcolor: alpha("#ffffff", 0.03) }),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Typography sx={{ fontWeight: 700, color: passed === 5 ? "success.main" : "text.secondary", mb: 1.25 }}>{label}</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0.75, mb: 1.75 }} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <Box key={i} sx={(th) => ({
            height: 6, borderRadius: 3, transition: "background-color .2s",
            bgcolor: i < passed ? barColor : "#e3e9f1",
            ...(i < passed ? {} : th.applyStyles("dark", { bgcolor: alpha("#ffffff", 0.08) })),
          })} />
        ))}
      </Box>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(205px, 1fr))", columnGap: 2, rowGap: 0.75 }}>
        {results.map((r) => (
          <Box component="li" key={r.key} sx={{ display: "flex", alignItems: "center", gap: 1, color: r.ok ? "success.main" : "text.secondary", gridColumn: r.key === "symbol" ? "1 / -1" : undefined }}>
            {r.ok ? <CheckCircleRounded fontSize="small" /> : <RadioButtonUncheckedRounded fontSize="small" />}
            <Typography variant="body2" component="span" sx={{ color: "inherit", fontWeight: r.ok ? 600 : 400 }}>
              {t(`password.rule.${r.key}`)}
              <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{r.ok ? ` (${t("password.done")})` : ""}</Box>
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
