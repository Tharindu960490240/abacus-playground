"use client";
import Avatar from "@mui/material/Avatar";

// Tonal colour pairs [background, text] for light and dark mode. Each person
// always gets the same colour, picked from their name.
const TONES = [
  ["#E3E5FF", "#282c7d", "#2B3070", "#D6D9FF"],
  ["#FFE1E2", "#B4161C", "#5C1D22", "#FFC2C4"],
  ["#DDF5E7", "#146C43", "#1C4A35", "#B6EBCD"],
  ["#F0E5FF", "#6B2BB5", "#3F2368", "#E2CCFF"],
  ["#FFE9D6", "#A2440B", "#5A3216", "#FFD2AE"],
  ["#DCF1FA", "#0B6285", "#173E52", "#B7E3F5"],
  ["#F6E9DA", "#8A5A2B", "#4D3520", "#F0D2B2"],
];

function tone(name) {
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

export default function UserAvatar({ user, size = 40, sx }) {
  const name = user?.name || "?";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  const [bg, fg, dbg, dfg] = tone(name);
  return (
    <Avatar
      src={user?.avatarUrl || undefined}
      alt={name}
      sx={[
        (t) => ({ width: size, height: size, fontSize: size * 0.38, bgcolor: bg, color: fg, ...t.applyStyles("dark", { bgcolor: dbg, color: dfg }) }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {initials}
    </Avatar>
  );
}
