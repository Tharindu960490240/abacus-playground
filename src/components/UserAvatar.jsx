"use client";
import Avatar from "@mui/material/Avatar";

export default function UserAvatar({ user, size = 40, sx }) {
  const name = user?.name || "?";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  return (
    <Avatar src={user?.avatarUrl || undefined} alt={name} sx={{ width: size, height: size, bgcolor: "primary.main", fontSize: size * 0.4, ...sx }}>
      {initials}
    </Avatar>
  );
}
