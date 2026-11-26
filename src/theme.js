"use client";
import { createTheme, alpha } from "@mui/material/styles";

// "Beads & ink" — Material 3 styled theme for Abacus Playground.
// Ink navy (AFC #282c7d) is the primary colour, bead red the accent, soroban
// wood a warm extra used sparingly. colorSchemeSelector "data-theme" puts
// data-theme="light|dark" on <html>, which your CSS files also use.

export const BRAND = {
  ink: "#282c7d",
  bead: "#E5262B",
  wood: "#B9773E",
  paper: "#F5F6FC",
  night: "#0D0F2E",
};

// radius hierarchy: large panels > cards > small items; buttons are pills
export const RADIUS = { panel: 28, card: 20, item: 12, pill: 999 };

const theme = createTheme({
  cssVariables: { colorSchemeSelector: "data-theme" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: BRAND.ink, light: "#5157b8", dark: "#1b1e5c", contrastText: "#fff" },
        secondary: { main: BRAND.bead, contrastText: "#fff" },
        error: { main: "#D21F25" },
        success: { main: "#1B8A50" },
        warning: { main: "#B45309" },
        info: { main: "#2563EB" },
        background: { default: BRAND.paper, paper: "#FFFFFF" },
        text: { primary: "#171A3B", secondary: "#565B7E" },
        divider: alpha(BRAND.ink, 0.1),
        action: { hover: alpha(BRAND.ink, 0.05), selected: alpha(BRAND.ink, 0.09) },
        // Material 3 tonal surfaces
        surface: { low: "#EEF0FA", mid: "#E7E9F7", high: "#DDE0F3", tint: "#E3E5FF", onTint: "#1B1E5C" },
        wood: { main: BRAND.wood },
      },
    },
    dark: {
      palette: {
        primary: { main: "#AEB3FF", light: "#D0D3FF", dark: "#7E85F0", contrastText: "#14173F" },
        secondary: { main: "#FF7A7E", contrastText: "#3A0608" },
        error: { main: "#FF8A8E" },
        success: { main: "#5DD69A" },
        warning: { main: "#F5B44A" },
        info: { main: "#8AB4FF" },
        background: { default: BRAND.night, paper: "#151845" },
        text: { primary: "#E9EAFF", secondary: "#A9ADD6" },
        divider: alpha("#AEB3FF", 0.14),
        action: { hover: alpha("#AEB3FF", 0.08), selected: alpha("#AEB3FF", 0.14) },
        surface: { low: "#13163F", mid: "#1A1D4E", high: "#22265C", tint: "#2B3070", onTint: "#E3E5FF" },
        wood: { main: "#D9A06A" },
      },
    },
  },
  shape: { borderRadius: RADIUS.item },
  typography: {
    fontFamily: '"Lexend Variable", "Lexend", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontWeightRegular: 400,
    // Major-third scale, tight leading on display sizes
    h1: { fontWeight: 700, fontSize: "3.4rem", lineHeight: 1.06, letterSpacing: "-0.025em" },
    h2: { fontWeight: 700, fontSize: "2.6rem", lineHeight: 1.1, letterSpacing: "-0.02em" },
    h3: { fontWeight: 650, fontSize: "2.05rem", lineHeight: 1.15, letterSpacing: "-0.015em" },
    h4: { fontWeight: 650, fontSize: "1.65rem", lineHeight: 1.2, letterSpacing: "-0.01em" },
    h5: { fontWeight: 600, fontSize: "1.3rem", lineHeight: 1.3 },
    h6: { fontWeight: 600, fontSize: "1.08rem", lineHeight: 1.35 },
    subtitle1: { fontWeight: 500, lineHeight: 1.5 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.55 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.005em" },
    overline: { textTransform: "none", letterSpacing: 0, fontWeight: 600, fontSize: "0.8rem" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { fontFeatureSettings: '"tnum" 1', WebkitFontSmoothing: "antialiased" },
        "::selection": { background: alpha(BRAND.bead, 0.25) },
        ":focus-visible": { outlineOffset: 2 },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: RADIUS.pill, paddingInline: 20, minHeight: 40 },
        sizeLarge: { minHeight: 52, paddingInline: 28, fontSize: "1rem" },
        sizeSmall: { minHeight: 32, paddingInline: 14 },
        outlined: ({ theme }) => ({ borderColor: theme.vars.palette.divider, "&:hover": { borderColor: theme.vars.palette.primary.main } }),
      },
      variants: [
        {
          // Material 3 "filled tonal" button: <Button variant="tonal">
          props: { variant: "tonal" },
          style: ({ theme }) => ({
            backgroundColor: theme.vars.palette.surface.tint,
            color: theme.vars.palette.surface.onTint,
            "&:hover": { backgroundColor: theme.vars.palette.surface.high },
          }),
        },
      ],
    },
    MuiIconButton: { styleOverrides: { root: { borderRadius: RADIUS.pill } } },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: RADIUS.card,
          border: `1px solid ${theme.vars.palette.divider}`,
          backgroundColor: theme.vars.palette.background.paper,
          backgroundImage: "none",
        }),
      },
    },
    MuiCardContent: { styleOverrides: { root: { padding: 24, "&:last-child": { paddingBottom: 24 } } } },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: RADIUS.card }, root: { backgroundImage: "none" } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: RADIUS.panel, padding: 4 } } },
    MuiDialogTitle: { styleOverrides: { root: { fontSize: "1.35rem", fontWeight: 650, paddingTop: 24 } } },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({ borderRadius: 16, marginTop: 6, border: `1px solid ${theme.vars.palette.divider}`, boxShadow: "0 12px 32px rgba(15,18,56,.14)" }),
        list: { padding: 6 },
      },
    },
    MuiMenuItem: { styleOverrides: { root: { borderRadius: 10, minHeight: 42 } } },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: RADIUS.item,
          backgroundColor: theme.vars.palette.background.paper,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: alpha(BRAND.ink, 0.22) },
          ...theme.applyStyles("dark", { "& .MuiOutlinedInput-notchedOutline": { borderColor: alpha("#AEB3FF", 0.25) } }),
        }),
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 10, fontWeight: 500 } } },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: ({ theme }) => ({ borderRadius: RADIUS.pill, backgroundColor: theme.vars.palette.surface.low, padding: 4, gap: 4 }),
        grouped: { border: 0, borderRadius: `${RADIUS.pill}px !important`, margin: 0 },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: 0,
          textTransform: "none",
          fontWeight: 600,
          paddingInline: 16,
          color: theme.vars.palette.text.secondary,
          "&.Mui-selected, &.Mui-selected:hover": {
            backgroundColor: theme.vars.palette.background.paper,
            color: theme.vars.palette.primary.main,
            boxShadow: "0 1px 3px rgba(15,18,56,.12)",
          },
        }),
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 44 },
        indicator: { height: 3, borderRadius: 3 },
      },
    },
    MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, minHeight: 44 } } },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({ borderColor: theme.vars.palette.divider }),
        head: ({ theme }) => ({ fontWeight: 600, color: theme.vars.palette.text.secondary, backgroundColor: theme.vars.palette.surface.low }),
      },
    },
    MuiTableRow: { styleOverrides: { root: { "&:last-child td": { borderBottom: 0 } } } },
    MuiLinearProgress: { styleOverrides: { root: { borderRadius: 6, height: 8 }, bar: { borderRadius: 6 } } },
    MuiAccordion: { styleOverrides: { root: { borderRadius: `${RADIUS.card}px !important`, "&:before": { display: "none" } } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 14 } } },
    MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 8, fontSize: 13, padding: "6px 10px" } } },
    MuiAppBar: { defaultProps: { elevation: 0, color: "inherit" } },
    MuiAvatar: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiListItemButton: { styleOverrides: { root: { borderRadius: RADIUS.pill } } },
    MuiSkeleton: { styleOverrides: { rounded: { borderRadius: RADIUS.card } } },
    MuiStepIcon: { styleOverrides: { root: { "&.Mui-completed": { color: "var(--mui-palette-success-main)" } } } },
  },
});

export default theme;
