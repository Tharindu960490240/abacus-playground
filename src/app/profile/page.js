"use client";
import { useState } from "react";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import StudentEditor from "@/components/StudentEditor";
import PasswordField from "@/components/PasswordField";
import PasswordStrength, { isStrongPassword } from "@/components/PasswordStrength";
import { api } from "@/lib/client/api";
import { useNotify } from "@/components/NotifyProvider";

function ChangePassword() {
  const { notify, notifyError, withLoading } = useNotify();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    try {
      await withLoading(api.post("/api/auth/password", { current, password }));
      setCurrent("");
      setPassword("");
      notify("Password changed. Other devices have been signed out.", "success");
    } catch (err) {
      notifyError(err);
    }
  };
  return (
    <Card>
      <CardContent component="form" onSubmit={submit}>
        <Typography variant="h6" sx={{ mb: 2 }}>Change password</Typography>
        <Stack spacing={2}>
          <PasswordField label="Current password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          <PasswordField label="New password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {password && <PasswordStrength password={password} />}
          <Button type="submit" variant="outlined" disabled={!current || !isStrongPassword(password)}>Update password</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <PageHeader title="My profile" subtitle="Your details, photo and progress" />
      <StudentEditor userId="me" extra={() => <ChangePassword />} />
    </RequireAuth>
  );
}
