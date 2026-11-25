"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { useAuth } from "@/components/AuthProvider";
import { useNotify } from "@/components/NotifyProvider";
import PasswordField from "@/components/PasswordField";
import PasswordStrength, { isStrongPassword } from "@/components/PasswordStrength";
import ProfileFields, { emptyProfile, cleanProfile } from "@/components/ProfileFields";

const STEPS = ["Account", "Student", "Contacts"];

export default function RegisterPage() {
  const { register } = useAuth();
  const { notify, withLoading } = useNotify();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [account, setAccount] = useState({ email: "", password: "", confirm: "" });
  const [form, setForm] = useState(emptyProfile());
  const [error, setError] = useState("");

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email);
  const pwOk = isStrongPassword(account.password);
  const matchOk = account.password === account.confirm;
  const studentOk = form.name && form.profile.birthday && form.profile.gender && form.profile.address;
  const contactsOk = form.guardian.name && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guardian.email) && form.guardian.mobile && form.emergency.name && form.emergency.mobile && form.emergency.relationship;
  const canNext = [emailOk && pwOk && matchOk, studentOk, contactsOk][step];

  const next = async (e) => {
    e.preventDefault();
    setError("");
    if (step < 2) return setStep(step + 1);
    try {
      await withLoading(register({ email: account.email, password: account.password, ...cleanProfile(form, { includeGroup: false }) }));
      notify("Your account is ready. Have fun!", "success");
      router.replace("/play");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ maxWidth: 760, mx: "auto" }}>
      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>Create an account</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Already registered? <Link href="/login">Log in</Link>
      </Typography>
      <Stepper activeStep={step} sx={{ mb: 3 }} alternativeLabel>
        {STEPS.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
      </Stepper>
      <Card>
        <CardContent component="form" onSubmit={next} noValidate sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}
            {step === 0 && (
              <>
                <TextField label="Email" type="email" autoComplete="email" required value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} error={!!account.email && !emailOk} helperText={account.email && !emailOk ? "Enter a valid email address" : " "} autoFocus />
                <PasswordField label="Password" autoComplete="new-password" required value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} />
                <PasswordStrength password={account.password} />
                <PasswordField label="Confirm password" autoComplete="new-password" required value={account.confirm} onChange={(e) => setAccount({ ...account, confirm: e.target.value })} error={!!account.confirm && !matchOk} helperText={account.confirm && !matchOk ? "Passwords do not match" : " "} />
              </>
            )}
            {step === 1 && <ProfileFields form={form} onChange={setForm} sections={["student"]} />}
            {step === 2 && <ProfileFields form={form} onChange={setForm} sections={["guardian", "emergency"]} />}
            <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", pt: 1 }}>
              <Button disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
              <Button type="submit" variant="contained" size="large" disabled={!canNext}>{step < 2 ? "Next" : "Create account"}</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
