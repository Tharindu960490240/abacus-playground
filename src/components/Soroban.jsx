"use client";
import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// Japanese soroban: one "heaven" bead worth 5 above the beam and four "earth"
// beads worth 1 below it on every rod. A bead counts when it touches the beam.
// Replaces the old soraban + soraban-bead Angular components (and the Angular
// CDK drag-and-drop): click a bead to move it, or focus a rod and use ↑ / ↓.

const SIZES = {
  small: { rod: 30, bead: 24, beadH: 14, gap: 3 },
  medium: { rod: 40, bead: 32, beadH: 18, gap: 4 },
  large: { rod: 52, bead: 44, beadH: 24, gap: 5 },
};

function toDigits(value, rods) {
  const s = String(Math.abs(Math.trunc(Number(value) || 0)));
  const n = Math.max(rods, s.length);
  return s.padStart(n, "0").split("").map(Number);
}

export default function Soroban({ value = 0, digits = 7, size = "medium", interactive = false, showValue = false, onChange, label }) {
  const [rods, setRods] = useState(() => toDigits(value, digits));
  const [shown, setShown] = useState({ value, digits });
  if (shown.value !== value || shown.digits !== digits) {
    // new value from the parent: reset the beads (React's "adjust state while rendering" pattern)
    setShown({ value, digits });
    setRods(toDigits(value, digits));
  }
  const total = useMemo(() => Number(rods.join("")), [rods]);
  const g = SIZES[size] || SIZES.medium;

  const frame = 10;
  const heavenH = g.beadH * 2 + g.gap * 2;
  const beam = 8;
  const earthH = g.beadH * 5 + g.gap * 5;
  const width = rods.length * g.rod + frame * 2;
  const height = frame * 2 + heavenH + beam + earthH;
  const beamY = frame + heavenH;

  const setDigit = (i, d) => {
    if (!interactive) return;
    const next = [...rods];
    next[i] = Math.max(0, Math.min(9, d));
    setRods(next);
    onChange?.(Number(next.join("")));
  };

  const onRodKey = (i, e) => {
    if (e.key === "ArrowUp") { e.preventDefault(); setDigit(i, rods[i] + 1); }
    if (e.key === "ArrowDown") { e.preventDefault(); setDigit(i, rods[i] - 1); }
    if (/^[0-9]$/.test(e.key)) setDigit(i, Number(e.key));
  };

  const bead = (cx, y, active, key, onClick, accent) => (
    <rect
      key={key}
      x={cx - g.bead / 2}
      y={y}
      width={g.bead}
      height={g.beadH}
      rx={g.beadH / 2}
      onClick={onClick}
      style={{ cursor: interactive ? "pointer" : "default", transition: "y .15s ease" }}
      fill={active ? (accent ? "var(--brand-red)" : "var(--soroban-bead, #282c7d)") : "var(--soroban-bead-off, #c9cde3)"}
      stroke="rgba(0,0,0,.15)"
    />
  );

  return (
    <Box sx={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 1, maxWidth: "100%", overflowX: "auto" }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role={interactive ? "group" : "img"}
        aria-label={label || `Soroban showing ${total}`}
        style={{ display: "block", maxWidth: "100%", height: "auto" }}
      >
        <rect x="1" y="1" width={width - 2} height={height - 2} rx="10" fill="var(--soroban-frame, #6b3f1d)" />
        <rect x={frame} y={frame} width={width - frame * 2} height={height - frame * 2} rx="4" fill="var(--soroban-bg, #fbf6ee)" />
        {rods.map((d, i) => {
          const cx = frame + g.rod * i + g.rod / 2;
          const upper = d >= 5;
          const lower = d % 5;
          const unit = (rods.length - 1 - i) % 3 === 0;
          const els = [];
          els.push(<line key="rod" x1={cx} x2={cx} y1={frame} y2={height - frame} stroke="#8a6a4a" strokeWidth="3" />);
          // heaven bead: rests at the top, moves down to the beam when active
          const hy = upper ? beamY - g.beadH - 1 : frame + g.gap;
          els.push(bead(cx, hy, upper, "h", () => setDigit(i, upper ? d - 5 : d + 5), true));
          // earth beads: active ones are pushed up against the beam
          for (let k = 0; k < 4; k++) {
            const active = k < lower;
            const y = active
              ? beamY + beam + 1 + k * (g.beadH + 1)
              : height - frame - (4 - k) * (g.beadH + 1) - 1;
            els.push(bead(cx, y, active, `e${k}`, () => setDigit(i, (upper ? 5 : 0) + (active ? k : k + 1))));
          }
          return (
            <g
              key={i}
              tabIndex={interactive ? 0 : undefined}
              role={interactive ? "spinbutton" : undefined}
              aria-label={interactive ? `Rod ${i + 1}` : undefined}
              aria-valuenow={interactive ? d : undefined}
              aria-valuemin={interactive ? 0 : undefined}
              aria-valuemax={interactive ? 9 : undefined}
              onKeyDown={interactive ? (e) => onRodKey(i, e) : undefined}
              style={{ outline: "none" }}
            >
              {els}
              {unit && <circle cx={cx} cy={beamY + beam / 2} r="2.2" fill="#fff" />}
            </g>
          );
        })}
        <rect x={frame} y={beamY} width={width - frame * 2} height={beam} fill="var(--soroban-frame, #6b3f1d)" />
        {rods.map((_, i) => ((rods.length - 1 - i) % 3 === 0 ? <circle key={`u${i}`} cx={frame + g.rod * i + g.rod / 2} cy={beamY + beam / 2} r="2.2" fill="#fff" /> : null))}
      </svg>
      {showValue && (
        <Typography sx={{ fontFamily: "Digital7, monospace", fontSize: size === "large" ? 34 : 26, letterSpacing: 2 }} aria-live="polite">
          {total.toLocaleString()}
        </Typography>
      )}
    </Box>
  );
}
