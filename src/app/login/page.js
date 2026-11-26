"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import { useAuth } from "@/components/AuthProvider";
import { useNotify } from "@/components/NotifyProvider";
import PasswordField from "@/components/PasswordField";
import AuthLayout from "@/components/AuthLayout";

function safeNext(next) {
  // only allow local paths, so the login page cannot be used to redirect elsewhere
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/play";
}

function LoginForm() {
  const { login } = useAuth();
  const { notify, withLoading } = useNotify();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const u = await withLoading(login(email, password));
      notify(`Welcome back, ${u.name.split(" ")[0]}!`, "success");
      router.replace(safeNext(params.get("next")));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ maxWidth: 980, mx: "auto" }}>
      <AuthLayout title="Log in" subtitle={<>New here? <Link href="/register">Create an account</Link></>}>
        <Stack component="form" spacing={2} onSubmit={submit} noValidate>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <PasswordField label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" variant="contained" size="large" disabled={!email || !password}>Log in</Button>
        </Stack>
      </AuthLayout>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
