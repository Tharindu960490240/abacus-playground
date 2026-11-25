"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { PhotoCameraRounded, DeleteOutlineRounded } from "@mui/icons-material";
import { api } from "@/lib/client/api";
import { useNotify } from "./NotifyProvider";
import { useAuth } from "./AuthProvider";
import UserAvatar from "./UserAvatar";
import ProfileFields, { withDefaults, cleanProfile } from "./ProfileFields";
import { levelLabel } from "@/lib/shared/numbers";

export default function StudentEditor({ userId = "me", adminView = false, extra }) {
  const { notify, notifyError, withLoading } = useNotify();
  const { user: me, setUser } = useAuth();
  const [user, setUserState] = useState(null);
  const [form, setForm] = useState(null);
  const [scores, setScores] = useState({});
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [u, s] = await Promise.all([api.get(`/api/users/${userId}`), api.get(`/api/users/${userId}/scores`)]);
      setUserState(u);
      setForm(withDefaults(u));
      setScores(s);
    } catch (err) {
      notifyError(err);
    }
  }, [userId, notifyError]);

  useEffect(() => {
    let alive = true;
    Promise.all([api.get(`/api/users/${userId}`), api.get(`/api/users/${userId}/scores`)])
      .then(([u, s]) => {
        if (!alive) return;
        setUserState(u);
        setForm(withDefaults(u));
        setScores(s);
      })
      .catch((err) => alive && notifyError(err));
    return () => {
      alive = false;
    };
  }, [userId, notifyError]);

  const isSelf = user && me && user._id === me._id;

  const save = async (e) => {
    e.preventDefault();
    try {
      const u = await withLoading(api.patch(`/api/users/${userId}`, cleanProfile(form, { includeGroup: adminView })));
      setUserState(u);
      if (isSelf) setUser(u);
      notify("Profile saved", "success");
    } catch (err) {
      notifyError(err);
    }
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return notify("Please choose an image under 2 MB", "warning");
    try {
      const { avatarUrl } = await withLoading(api.upload(`/api/users/${userId}/avatar`, file));
      setUserState((u) => ({ ...u, avatarUrl }));
      if (isSelf) setUser((u) => ({ ...u, avatarUrl }));
      notify("Picture updated", "success");
    } catch (err) {
      notifyError(err);
    }
  };

  const removeAvatar = async () => {
    try {
      await withLoading(api.del(`/api/users/${userId}/avatar`));
      setUserState((u) => ({ ...u, avatarUrl: null }));
      if (isSelf) setUser((u) => ({ ...u, avatarUrl: null }));
    } catch (err) {
      notifyError(err);
    }
  };

  if (!user || !form) return null;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={3}>
          <Card>
            <CardContent sx={{ textAlign: "center", p: 3 }}>
              <UserAvatar user={user} size={112} sx={{ mx: "auto", mb: 2 }} />
              <Typography variant="h6">{user.name}</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 2, wordBreak: "break-all" }}>{user.email}</Typography>
              {user.group && <Chip label={user.group} size="small" sx={{ mb: 2 }} />}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { uploadAvatar(e.target.files?.[0]); e.target.value = ""; }} />
              <Stack direction="row" spacing={1} sx={{ justifyContent: "center" }}>
                <Button startIcon={<PhotoCameraRounded />} variant="outlined" onClick={() => fileRef.current?.click()}>Change photo</Button>
                {user.avatarUrl && <Button color="error" onClick={removeAvatar} aria-label="Remove photo"><DeleteOutlineRounded /></Button>}
              </Stack>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Progress</Typography>
              <Stack spacing={1.5}>
                {[["anzan", "Anzan"], ["dictation", "Dictation"], ["paper", "Paper"]].map(([k, label]) => (
                  <Box key={k} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography>{label}</Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Chip size="small" color="primary" label={scores[k] ? levelLabel(scores[k].level) : "—"} />
                      {k !== "paper" && <Chip size="small" variant="outlined" label={`${scores[k]?.marks ?? 0} marks`} />}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
          {extra?.({ user, scores, reload: load })}
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardContent component="form" onSubmit={save} sx={{ p: { xs: 2.5, sm: 4 } }}>
            <ProfileFields form={form} onChange={setForm} canEditGroup={adminView} />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
              <Button type="submit" variant="contained" size="large">Save changes</Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
