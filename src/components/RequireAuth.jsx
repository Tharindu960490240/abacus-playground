"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { useAuth } from "./AuthProvider";

/**
 * Hides a page until we know who is logged in. This is only for a smooth UI:
 * every API route checks the session and role again on the server.
 */
export default function RequireAuth({ admin = false, children }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, user, router, pathname]);

  if (!ready || !user) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 12 }}>
        <CircularProgress aria-label="Loading" />
      </Box>
    );
  }
  if (admin && !user.isAdmin) {
    return <Alert severity="warning" sx={{ m: 3 }}>This page is for teachers only.</Alert>;
  }
  return children;
}
