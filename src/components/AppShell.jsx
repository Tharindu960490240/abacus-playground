"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useColorScheme } from "@mui/material/styles";
import {
  HomeRounded, SportsEsportsRounded, CalculateRounded, SchoolRounded, MenuBookRounded, ForumRounded,
  EmojiEventsRounded, DescriptionRounded, DarkModeRounded, LightModeRounded, ContrastRounded,
  PeopleRounded, TuneRounded, EditNoteRounded, AutoStoriesRounded, LogoutRounded, PersonRounded,
  ExpandMoreRounded, MoreHorizRounded, LoginRounded,
} from "@mui/icons-material";
import { useAuth } from "./AuthProvider";
import UserAvatar from "./UserAvatar";
import BrandMark from "./BrandMark";

const ALL = {
  home: { href: "/", label: "Home", icon: HomeRounded },
  play: { href: "/play", label: "Play", icon: SportsEsportsRounded },
  course: { href: "/course", label: "Course", icon: SchoolRounded },
  soroban: { href: "/soroban", label: "Soroban", icon: CalculateRounded },
  tutorials: { href: "/tutorials", label: "Tutorials", icon: MenuBookRounded },
  forum: { href: "/forum", label: "Forum", icon: ForumRounded },
  leaderboard: { href: "/leaderboard", label: "Leaderboard", short: "Ranks", icon: EmojiEventsRounded },
  papers: { href: "/papers", label: "Papers", icon: DescriptionRounded },
};
const TEACHER = [
  { href: "/admin/students", label: "Students", icon: PeopleRounded },
  { href: "/admin/papers", label: "Paper builder", icon: EditNoteRounded },
  { href: "/admin/game-levels", label: "Game levels", icon: TuneRounded },
  { href: "/admin/course", label: "Course editor", icon: AutoStoriesRounded },
  { href: "/admin/tutorials", label: "Tutorial editor", icon: MenuBookRounded },
];

const TOP_IN = ["home", "play", "course", "tutorials", "forum", "leaderboard", "papers"];
const TOP_OUT = ["home", "soroban", "tutorials"];
const BOTTOM_IN = ["home", "play", "course", "leaderboard"];
const BOTTOM_OUT = ["home", "soroban", "tutorials"];

function useActive() {
  const pathname = usePathname();
  return (href) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
}

function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  if (!mode) return <Box sx={{ width: 40 }} />;
  const next = { light: "dark", dark: "system", system: "light" }[mode];
  const Icon = { light: LightModeRounded, dark: DarkModeRounded, system: ContrastRounded }[mode];
  const names = { light: "Light", dark: "Dark", system: "Match device" };
  return (
    <Tooltip title={`Theme: ${names[mode]}. Click for ${names[next].toLowerCase()}.`}>
      <IconButton onClick={() => setMode(next)} aria-label={`Theme: ${names[mode]}. Switch to ${names[next]}`}>
        <Icon />
      </IconButton>
    </Tooltip>
  );
}

/** Desktop navigation item: Material 3 style pill, filled when active. */
function NavPill({ item, active }) {
  return (
    <Button
      component={Link}
      href={item.href}
      aria-current={active ? "page" : undefined}
      sx={(t) => ({
        px: 1.75, minHeight: 38, color: active ? t.vars.palette.surface.onTint : t.vars.palette.text.secondary,
        bgcolor: active ? t.vars.palette.surface.tint : "transparent",
        fontWeight: active ? 650 : 500,
        "&:hover": { bgcolor: active ? t.vars.palette.surface.tint : t.vars.palette.action.hover, color: t.vars.palette.text.primary },
      })}
    >
      {item.label}
    </Button>
  );
}

export default function AppShell({ children }) {
  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isActive = useActive();
  const [scrolled, setScrolled] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [userMenu, setUserMenu] = useState(null);
  const [teacherMenu, setTeacherMenu] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const top = (user ? TOP_IN : TOP_OUT).map((k) => ALL[k]);
  const bottom = (user ? BOTTOM_IN : BOTTOM_OUT).map((k) => ALL[k]);
  const sheetItems = Object.values(ALL).filter((i) => !bottom.includes(i) && (user || ["soroban", "tutorials"].some((k) => ALL[k] === i)));
  const bottomValue = bottom.find((i) => isActive(i.href))?.href ?? (sheet ? "more" : false);
  const teacherActive = pathname.startsWith("/admin");

  const doLogout = async () => {
    setUserMenu(null);
    setSheet(false);
    await logout();
    router.push("/");
  };

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <a href="#main" className="skip-link">Skip to content</a>

      {/* ---------- top app bar ---------- */}
      <AppBar
        position="sticky"
        sx={(t) => ({
          bgcolor: scrolled ? t.vars.palette.background.paper : t.vars.palette.background.default,
          borderBottom: `1px solid ${scrolled ? t.vars.palette.divider : "transparent"}`,
          transition: "background-color .2s, border-color .2s",
        })}
      >
        <Toolbar sx={{ gap: 1, minHeight: { xs: 60, md: 68 }, px: { xs: 1.5, sm: 3 } }}>
          <Box component={Link} href="/" aria-label="Abacus Playground home" sx={{ display: "flex", alignItems: "center", gap: 1.25, textDecoration: "none", color: "text.primary", mr: { lg: 2 } }}>
            <BrandMark size={36} />
            <Typography component="span" sx={{ fontWeight: 700, fontSize: 19, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
              Abacus Playground
            </Typography>
          </Box>

          <Box component="nav" aria-label="Main" sx={{ display: { xs: "none", lg: "flex" }, gap: 0.5, flex: 1, justifyContent: "center" }}>
            {top.map((i) => <NavPill key={i.href} item={i} active={isActive(i.href)} />)}
            {isAdmin && (
              <>
                <Button
                  onClick={(e) => setTeacherMenu(e.currentTarget)}
                  endIcon={<ExpandMoreRounded />}
                  aria-haspopup="menu"
                  sx={(t) => ({ px: 1.75, minHeight: 38, color: teacherActive ? t.vars.palette.surface.onTint : t.vars.palette.text.secondary, bgcolor: teacherActive ? t.vars.palette.surface.tint : "transparent", fontWeight: teacherActive ? 650 : 500 })}
                >
                  Teacher
                </Button>
                <Menu anchorEl={teacherMenu} open={!!teacherMenu} onClose={() => setTeacherMenu(null)}>
                  {TEACHER.map((l) => (
                    <MenuItem key={l.href} component={Link} href={l.href} onClick={() => setTeacherMenu(null)} selected={isActive(l.href)}>
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
              <IconButton onClick={(e) => setUserMenu(e.currentTarget)} aria-label="Account" aria-haspopup="menu" sx={{ p: 0.5 }}>
                <UserAvatar user={user} size={36} />
              </IconButton>
              <Menu anchorEl={userMenu} open={!!userMenu} onClose={() => setUserMenu(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
                <Box sx={{ px: 1.5, py: 1, display: "flex", gap: 1.5, alignItems: "center", minWidth: 240 }}>
                  <UserAvatar user={user} size={44} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 650 }} noWrap>{user.name}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>{user.isAdmin ? "Teacher" : user.group || "Student"}</Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem component={Link} href="/profile" onClick={() => setUserMenu(null)}>
                  <ListItemIcon><PersonRounded fontSize="small" /></ListItemIcon>My profile
                </MenuItem>
                <MenuItem onClick={doLogout}>
                  <ListItemIcon><LogoutRounded fontSize="small" /></ListItemIcon>Log out
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button component={Link} href="/login" sx={{ display: { xs: "none", sm: "inline-flex" } }}>Log in</Button>
              <Button component={Link} href="/register" variant="contained">Join</Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box component="main" id="main" tabIndex={-1} sx={{ flex: 1, outline: "none" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 } }}>{children}</Container>
      </Box>

      <Box component="footer" sx={{ display: { xs: "none", lg: "block" }, borderTop: 1, borderColor: "divider" }}>
        <Container maxWidth="lg" sx={{ py: 3, display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
          <BrandMark size={22} />
          <Typography variant="body2" sx={{ flex: 1 }}>Abacus Playground · © {new Date().getFullYear()}</Typography>
          <Typography variant="body2" component={Link} href="/tutorials" sx={{ color: "inherit" }}>Tutorials</Typography>
          <Typography variant="body2" component={Link} href="/soroban" sx={{ color: "inherit" }}>Virtual soroban</Typography>
        </Container>
      </Box>

      {/* ---------- bottom navigation (phones and tablets) ---------- */}
      <Box sx={{ display: { xs: "block", lg: "none" }, height: "calc(80px + env(safe-area-inset-bottom))" }} />
      <Paper
        component="nav"
        aria-label="Main"
        square
        sx={(t) => ({
          display: { xs: "block", lg: "none" }, position: "fixed", left: 0, right: 0, bottom: 0, zIndex: t.zIndex.appBar,
          borderTop: `1px solid ${t.vars.palette.divider}`, bgcolor: t.vars.palette.surface.low, borderRadius: 0,
          pb: "env(safe-area-inset-bottom)",
        })}
      >
        <BottomNavigation
          showLabels
          value={bottomValue}
          sx={{
            height: 80, bgcolor: "transparent",
            "& .MuiBottomNavigationAction-root": { minWidth: 0, px: 0.5, gap: 0.5, color: "text.secondary" },
            "& .MuiBottomNavigationAction-label": { fontSize: 12, fontWeight: 600, "&.Mui-selected": { fontSize: 12 } },
            "& .Mui-selected": { color: "text.primary" },
            // Material 3 active indicator pill behind the icon
            "& .MuiSvgIcon-root": { width: 64, height: 32, px: "20px", py: "4px", borderRadius: 999, transition: "background-color .2s" },
            "& .Mui-selected .MuiSvgIcon-root": { bgcolor: "surface.tint", color: "surface.onTint" },
          }}
        >
          {bottom.map((i) => (
            <BottomNavigationAction key={i.href} component={Link} href={i.href} value={i.href} label={i.short || i.label} icon={<i.icon />} />
          ))}
          {user ? (
            <BottomNavigationAction value="more" label="More" icon={<MoreHorizRounded />} onClick={() => setSheet(true)} />
          ) : (
            <BottomNavigationAction component={Link} href="/login" value="/login" label="Log in" icon={<LoginRounded />} />
          )}
        </BottomNavigation>
      </Paper>

      <SwipeableDrawer
        anchor="bottom"
        open={sheet}
        onOpen={() => setSheet(true)}
        onClose={() => setSheet(false)}
        disableSwipeToOpen
        slotProps={{ paper: { sx: { borderRadius: "28px 28px 0 0", pb: "calc(16px + env(safe-area-inset-bottom))", maxHeight: "85dvh" } } }}
      >
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: "divider", mx: "auto", mt: 1.5, mb: 1 }} />
        <Box onClick={() => setSheet(false)} sx={{ px: 1.5 }}>
          <List>
            {sheetItems.map((i) => (
              <ListItemButton key={i.href} component={Link} href={i.href} selected={isActive(i.href)}>
                <ListItemIcon><i.icon /></ListItemIcon>
                <ListItemText primary={i.label} />
              </ListItemButton>
            ))}
            <ListItemButton component={Link} href="/profile" selected={isActive("/profile")}>
              <ListItemIcon><PersonRounded /></ListItemIcon>
              <ListItemText primary="My profile" />
            </ListItemButton>
          </List>
          {isAdmin && (
            <List subheader={<ListSubheader sx={{ bgcolor: "transparent", fontWeight: 600 }}>Teacher</ListSubheader>}>
              {TEACHER.map((l) => (
                <ListItemButton key={l.href} component={Link} href={l.href} selected={isActive(l.href)}>
                  <ListItemIcon><l.icon /></ListItemIcon>
                  <ListItemText primary={l.label} />
                </ListItemButton>
              ))}
            </List>
          )}
          <Divider sx={{ my: 1 }} />
          <ListItemButton onClick={doLogout}>
            <ListItemIcon><LogoutRounded /></ListItemIcon>
            <ListItemText primary="Log out" />
          </ListItemButton>
        </Box>
      </SwipeableDrawer>
    </Box>
  );
}
