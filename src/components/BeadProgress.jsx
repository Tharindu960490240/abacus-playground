"use client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { levelLabel } from "@/lib/shared/numbers";

export const ANZAN_LEVELS = Array.from({ length: 15 }, (_, i) => 15 - i); // 15 … 1
export const DICTATION_LEVELS = [...ANZAN_LEVELS, 0, -1, -2, -3, -4]; // … Dan 1–5

/**
 * Level progress drawn as beads on a soroban rod. Each passed level is a bead
 * pushed along the rod (red), the current level glows, the rest wait on the
 * right. Levels run 15 → 1 (then Dan), so passing a level means a bead moves over.
 */
export default function BeadProgress({ level, levels = ANZAN_LEVELS, size = "medium", showLabel = true }) {
  const idx = Math.max(0, levels.indexOf(Number(level)));
  const n = levels.length;
  const bead = size === "small" ? { w: 14, h: 10, gap: 3 } : { w: 22, h: 15, gap: 4 };
  const slide = bead.w * 0.9; // the space that shows beads have been moved
  const width = n * (bead.w + bead.gap) + slide + 12;
  const height = bead.h + 10;
  const cy = height / 2;

  return (
    <Box>
      <Box
        component="svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${levelLabel(level)}: ${idx} of ${n} levels passed`}
        sx={{ width: "100%", maxWidth: width * (size === "small" ? 1.2 : 1.1), height: "auto", display: "block", overflow: "visible" }}
      >
        <rect x="2" y={cy - 1.25} width={width - 4} height="2.5" rx="1.25" fill="var(--mui-palette-wood-main)" opacity=".7" />
        {levels.map((l, i) => {
          const passed = i < idx;
          const current = i === idx;
          const x = 6 + i * (bead.w + bead.gap) + (i >= idx ? slide : 0);
          return (
            <g key={l}>
              {current && <ellipse cx={x + bead.w / 2} cy={cy} rx={bead.w / 2 + 3.5} ry={bead.h / 2 + 3.5} fill="none" stroke="var(--mui-palette-secondary-main)" strokeWidth="1.5" opacity=".55" />}
              <ellipse
                cx={x + bead.w / 2}
                cy={cy}
                rx={bead.w / 2}
                ry={bead.h / 2}
                fill={passed || current ? "var(--mui-palette-secondary-main)" : "var(--mui-palette-surface-high)"}
                stroke={passed || current ? "none" : "var(--mui-palette-divider)"}
              />
              {(passed || current) && <ellipse cx={x + bead.w / 2 - bead.w * 0.15} cy={cy - bead.h * 0.18} rx={bead.w * 0.16} ry={bead.h * 0.12} fill="#fff" opacity=".45" />}
            </g>
          );
        })}
      </Box>
      {showLabel && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {idx === 0 ? "Just starting" : `${idx} of ${n} levels passed`}
        </Typography>
      )}
    </Box>
  );
}
