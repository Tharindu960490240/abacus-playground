import Box from "@mui/material/Box";
import {
  BoltRounded, RecordVoiceOverRounded, CloseRounded, LinkRounded, CalculateRounded, DescriptionRounded,
} from "@mui/icons-material";

// One colour family per game, so each is recognisable at a glance.
export const FEATURE_COLOURS = {
  anzan: { fg: "#282c7d", bg: "#E3E5FF", dfg: "#D6D9FF", dbg: "#2B3070" },
  dictation: { fg: "#6B2BB5", bg: "#F0E5FF", dfg: "#E2CCFF", dbg: "#3F2368" },
  tables: { fg: "#146C43", bg: "#DDF5E7", dfg: "#B6EBCD", dbg: "#1C4A35" },
  bonds: { fg: "#A2440B", bg: "#FFE9D6", dfg: "#FFD2AE", dbg: "#5A3216" },
  soroban: { fg: "#8A5A2B", bg: "#F6E9DA", dfg: "#F0D2B2", dbg: "#4D3520" },
  papers: { fg: "#B4161C", bg: "#FFE1E2", dfg: "#FFC2C4", dbg: "#5C1D22" },
};
const ICONS = { anzan: BoltRounded, dictation: RecordVoiceOverRounded, tables: CloseRounded, bonds: LinkRounded, soroban: CalculateRounded, papers: DescriptionRounded };

/** Rounded tonal tile with the game's icon. */
export default function FeatureIcon({ name, size = 56 }) {
  const Icon = ICONS[name] || BoltRounded;
  const c = FEATURE_COLOURS[name] || FEATURE_COLOURS.anzan;
  return (
    <Box
      aria-hidden="true"
      sx={(t) => ({
        width: size, height: size, flex: "none", borderRadius: `${Math.round(size * 0.32)}px`, display: "grid", placeItems: "center",
        color: c.fg, bgcolor: c.bg,
        ...t.applyStyles("dark", { color: c.dfg, bgcolor: c.dbg }),
      })}
    >
      <Icon sx={{ fontSize: size * 0.52 }} />
    </Box>
  );
}
