"use client";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { I18nextProvider } from "react-i18next";
import theme from "@/theme";
import i18n from "@/i18n";
import { AuthProvider } from "./AuthProvider";
import { NotifyProvider } from "./NotifyProvider";

export default function Providers({ children }) {
  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline enableColorScheme />
      <I18nextProvider i18n={i18n}>
        <NotifyProvider>
          <AuthProvider>{children}</AuthProvider>
        </NotifyProvider>
      </I18nextProvider>
    </ThemeProvider>
  );
}
