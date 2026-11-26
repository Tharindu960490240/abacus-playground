import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import Providers from "@/components/Providers";
import AppShell from "@/components/AppShell";
import "@fontsource-variable/lexend";
import "./globals.css";

export const metadata = {
  title: { default: "Abacus Playground", template: "%s · Abacus Playground" },
  description: "Abacus (soroban) mental maths games, papers and lessons.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F6FC" },
    { media: "(prefers-color-scheme: dark)", color: "#0D0F2E" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="data-theme" defaultMode="system" />
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
