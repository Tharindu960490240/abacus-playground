import Box from "@mui/material/Box";

/** The abacus logo drawn inline, so it follows the theme colours without two image files. */
export default function BrandMark({ size = 36 }) {
  return (
    <Box component="svg" viewBox="0 0 40 40" aria-hidden="true" sx={{ width: size, height: size, flex: "none", display: "block" }}>
      <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="var(--mui-palette-primary-main)" />
      <rect x="6" y="15.5" width="28" height="2.6" rx="1.3" fill="var(--mui-palette-background-paper)" opacity=".9" />
      {[12, 20, 28].map((x, i) => (
        <g key={x}>
          <rect x={x - 0.6} y="6" width="1.2" height="28" fill="var(--mui-palette-background-paper)" opacity=".35" />
          <ellipse cx={x} cy={i === 1 ? 12.2 : 9.2} rx="3.6" ry="2.5" fill="#E5262B" />
          {[0, 1, 2].map((k) => (
            <ellipse key={k} cx={x} cy={(i === 0 ? 22.5 : 26) + k * 4.4 - (i === 2 ? 3.5 : 0)} rx="3.6" ry="2.1" fill="var(--mui-palette-background-paper)" />
          ))}
        </g>
      ))}
    </Box>
  );
}
