"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { useAuth } from "@/components/AuthProvider";
import { useNotify } from "@/components/NotifyProvider";
import PasswordField from "@/components/PasswordField";

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
    <Box sx={{ display: "grid", placeItems: "center", py: { xs: 2, md: 6 } }}>
      <Card sx={{ width: "100%", maxWidth: 440 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>Log in</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Good to see you again.</Typography>
          <Stack component="form" spacing={2} onSubmit={submit} noValidate>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            <PasswordField label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" variant="contained" size="large" disabled={!email || !password}>Log in</Button>
            <Typography variant="body2" sx={{ textAlign: "center" }}>
              New here? <Link href="/register">Create an account</Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
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
