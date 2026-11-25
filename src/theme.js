"use client";
import { createTheme } from "@mui/material/styles";

// AFC brand: navy #282c7d, red #ed1f24 (same values as the toast and loader CSS).
// colorSchemeSelector "data-theme" puts data-theme="light|dark" on <html>, which
// is what the [data-theme="dark"] rules in your CSS files look for.
const theme = createTheme({
  cssVariables: { colorSchemeSelector: "data-theme" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#282c7d" },
        secondary: { main: "#ed1f24" },
        error: { main: "#ed1f24" },
        success: { main: "#16a34a" },
        warning: { main: "#d97706" },
        background: { default: "#f4f6fb", paper: "#ffffff" },
        text: { primary: "#1a202c" },
      },
    },
    dark: {
      palette: {
        primary: { main: "#9aa0ff" },
        secondary: { main: "#ff6b6f" },
        error: { main: "#ff6b6f" },
        success: { main: "#4ade80" },
        warning: { main: "#fbbf24" },
        background: { default: "#0f1238", paper: "#171b4a" },
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "var(--font-sans), system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    h1: { fontWeight: 800 }, h2: { fontWeight: 800 }, h3: { fontWeight: 700 },
    h4: { fontWeight: 700 }, h5: { fontWeight: 700 }, h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 10 } } },
    MuiCard: { defaultProps: { variant: "outlined" }, styleOverrides: { root: { borderRadius: 16 } } },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 16 } } },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiAppBar: { defaultProps: { elevation: 0, color: "inherit" } },
  },
});

export default theme;
