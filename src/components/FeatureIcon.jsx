import Box from "@mui/material/Box";
import {
  BoltRounded, RecordVoiceOverRounded, CloseRounded, LinkRounded, CalculateRounded, DescriptionRounded,
} from "@mui/icons-material";

const MAP = {
  anzan: { Icon: BoltRounded, color: "#282c7d" },
  dictation: { Icon: RecordVoiceOverRounded, color: "#7c3aed" },
  tables: { Icon: CloseRounded, color: "#16a34a" },
  bonds: { Icon: LinkRounded, color: "#ea580c" },
  soroban: { Icon: CalculateRounded, color: "#0e7490" },
  papers: { Icon: DescriptionRounded, color: "#ed1f24" },
};

/** Round coloured icon used on the home page, the play hub and the game boards. */
export default function FeatureIcon({ name, size = 64 }) {
  const { Icon, color } = MAP[name] || MAP.anzan;
  return (
    <Box
      aria-hidden="true"
      sx={(t) => ({
        width: size, height: size, flex: "none", borderRadius: "30%", display: "grid", placeItems: "center",
        color, bgcolor: `${color}1a`,
        ...t.applyStyles("dark", { color: "#fff", bgcolor: `${color}cc` }),
      })}
    >
      <Icon sx={{ fontSize: size * 0.55 }} />
    </Box>
  );
}
