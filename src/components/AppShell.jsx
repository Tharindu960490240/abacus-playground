"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Container from "@mui/material/Container";
import { useColorScheme } from "@mui/material/styles";
import {
  MenuRounded, HomeRounded, SportsEsportsRounded, CalculateRounded, SchoolRounded, MenuBookRounded,
  ForumRounded, EmojiEventsRounded, DescriptionRounded, DarkModeRounded, LightModeRounded,
  SettingsBrightnessRounded, PeopleRounded, TuneRounded, EditNoteRounded, AutoStoriesRounded,
  LogoutRounded, PersonRounded, AdminPanelSettingsRounded,
} from "@mui/icons-material";
import { useAuth } from "./AuthProvider";
import UserAvatar from "./UserAvatar";

const MAIN = [
  { href: "/", label: "Home", icon: HomeRounded },
  { href: "/play", label: "Play", icon: SportsEsportsRounded, auth: true },
  { href: "/soroban", label: "Soroban", icon: CalculateRounded },
  { href: "/course", label: "Course", icon: SchoolRounded, auth: true },
  { href: "/tutorials", label: "Tutorials", icon: MenuBookRounded },
  { href: "/forum", label: "Forum", icon: ForumRounded, auth: true },
  { href: "/leaderboard", label: "Leaderboard", icon: EmojiEventsRounded, auth: true },
  { href: "/papers", label: "Papers", icon: DescriptionRounded, auth: true },
];

const ADMIN = [
  { href: "/admin/students", label: "Students", icon: PeopleRounded },
  { href: "/admin/papers", label: "Paper builder", icon: EditNoteRounded },
  { href: "/admin/game-levels", label: "Game levels", icon: TuneRounded },
  { href: "/admin/course", label: "Course editor", icon: AutoStoriesRounded },
  { href: "/admin/tutorials", label: "Tutorial editor", icon: MenuBookRounded },
];

function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  if (!mode) return <Box sx={{ width: 40 }} />;
  const next = { light: "dark", dark: "system", system: "light" }[mode];
  const Icon = { light: LightModeRounded, dark: DarkModeRounded, system: SettingsBrightnessRounded }[mode];
  return (
    <Tooltip title={`Theme: ${mode} (switch to ${next})`}>
      <IconButton onClick={() => setMode(next)} aria-label={`Theme ${mode}, switch to ${next}`}>
        <Icon />
      </IconButton>
    </Tooltip>
  );
}

export default function AppShell({ children }) {
  const { user, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [userMenu, setUserMenu] = useState(null);
  const [adminMenu, setAdminMenu] = useState(null);

  const links = MAIN.filter((l) => !l.auth || user);
  const active = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const doLogout = async () => {
    setUserMenu(null);
    await logout();
    router.push("/");
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <AppBar position="sticky" sx={{ borderBottom: 1, borderColor: "divider", backdropFilter: "blur(10px)", bgcolor: "background.paper" }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton edge="start" sx={{ display: { lg: "none" } }} onClick={() => setDrawer(true)} aria-label="Open menu">
            <MenuRounded />
          </IconButton>
          <Box component={Link} href="/" sx={{ display: "flex", alignItems: "center", gap: 1, textDecoration: "none", mr: 2 }}>
            <Box component="img" src="/assets/afc-icon.svg" alt="" sx={{ width: 32, height: 32, display: "block", '[data-theme="dark"] &': { display: "none" } }} />
            <Box component="img" src="/assets/afc-icon-white.svg" alt="" sx={{ width: 32, height: 32, display: "none", '[data-theme="dark"] &': { display: "block" } }} />
            <Typography variant="h6" component="span" sx={{ fontWeight: 800, color: "primary.main", whiteSpace: "nowrap", display: { xs: "none", sm: "inline" } }}>
              Abacus Playground
            </Typography>
          </Box>
          <Box component="nav" aria-label="Main" sx={{ display: { xs: "none", lg: "flex" }, gap: 0.5, flex: 1 }}>
            {links.map((l) => (
              <Button key={l.href} component={Link} href={l.href} color={active(l.href) ? "primary" : "inherit"} variant={active(l.href) ? "contained" : "text"} size="small" aria-current={active(l.href) ? "page" : undefined}>
                {l.label}
              </Button>
            ))}
            {isAdmin && (
              <>
                <Button size="small" color="inherit" startIcon={<AdminPanelSettingsRounded />} onClick={(e) => setAdminMenu(e.currentTarget)} aria-haspopup="menu">
                  Teacher
                </Button>
                <Menu anchorEl={adminMenu} open={!!adminMenu} onClose={() => setAdminMenu(null)}>
                  {ADMIN.map((l) => (
                    <MenuItem key={l.href} component={Link} href={l.href} onClick={() => setAdminMenu(null)} selected={active(l.href)}>
                      <ListItemIcon><l.icon fontSize="small" /></ListItemIcon>
                      {l.label}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
          </Box>
          <Box sx={{ flex: { xs: 1, lg: 0 } }} />
          <ThemeToggle />
          {user ? (
            <>
              <IconButton onClick={(e) => setUserMenu(e.currentTarget)} aria-label="Account menu" aria-haspopup="menu">
                <UserAvatar user={user} size={34} />
              </IconButton>
              <Menu anchorEl={userMenu} open={!!userMenu} onClose={() => setUserMenu(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>{user.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                </Box>
                <Divider />
                <MenuItem component={Link} href="/profile" onClick={() => setUserMenu(null)}>
                  <ListItemIcon><PersonRounded fontSize="small" /></ListItemIcon>Profile
                </MenuItem>
                <MenuItem onClick={doLogout}>
                  <ListItemIcon><LogoutRounded fontSize="small" /></ListItemIcon>Log out
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button component={Link} href="/login" color="inherit">Log in</Button>
              <Button component={Link} href="/register" variant="contained" sx={{ display: { xs: "none", sm: "inline-flex" } }}>Register</Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer open={drawer} onClose={() => setDrawer(false)}>
        <Box sx={{ width: 280 }} role="navigation" aria-label="Main" onClick={() => setDrawer(false)}>
          <List>
            {links.map((l) => (
              <ListItemButton key={l.href} component={Link} href={l.href} selected={active(l.href)}>
                <ListItemIcon><l.icon /></ListItemIcon>
                <ListItemText primary={l.label} />
              </ListItemButton>
            ))}
          </List>
          {isAdmin && (
            <List subheader={<ListSubheader>Teacher</ListSubheader>}>
              {ADMIN.map((l) => (
                <ListItemButton key={l.href} component={Link} href={l.href} selected={active(l.href)}>
                  <ListItemIcon><l.icon /></ListItemIcon>
                  <ListItemText primary={l.label} />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </Drawer>

      <Box component="main" sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>{children}</Container>
      </Box>
      <Box component="footer" sx={{ py: 3, textAlign: "center", color: "text.secondary", borderTop: 1, borderColor: "divider" }}>
        <Typography variant="body2">© {new Date().getFullYear()} Abacus Playground</Typography>
      </Box>
    </Box>
  );
}
