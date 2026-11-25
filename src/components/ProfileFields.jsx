"use client";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";

export const GROUPS = ["Group A", "Group B", "Group C", "Group D"];

export const emptyProfile = () => ({
  name: "",
  group: "",
  profile: { birthday: "", gender: "", address: "", city: "", postal_code: "", school: "", grade: "" },
  guardian: { name: "", guardian_type: "", email: "", mobile: "", home: "", profession: "" },
  emergency: { name: "", relationship: "", mobile: "", home: "" },
  special_note: "",
});

/** Fills missing nested fields so every input stays controlled. */
export function withDefaults(user) {
  const base = emptyProfile();
  const u = user || {};
  return {
    name: u.name || "",
    group: u.group || "",
    profile: { ...base.profile, ...(u.profile || {}) },
    guardian: { ...base.guardian, ...(u.guardian || {}) },
    emergency: { ...base.emergency, ...(u.emergency || {}) },
    special_note: u.special_note || "",
  };
}

/** Removes empty strings so optional fields are simply left out of the request. */
export function cleanProfile(form, { includeGroup = true } = {}) {
  const strip = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== "" && v != null));
  const out = {
    name: form.name,
    profile: strip(form.profile),
    guardian: strip(form.guardian),
    emergency: strip(form.emergency),
  };
  if (form.special_note) out.special_note = form.special_note;
  if (includeGroup && form.group) out.group = form.group;
  return out;
}

export function setIn(obj, path, value) {
  const [head, ...rest] = path.split(".");
  if (!rest.length) return { ...obj, [head]: value };
  return { ...obj, [head]: setIn(obj[head] || {}, rest.join("."), value) };
}

const get = (obj, path) => path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);

/** sections: any of "student", "guardian", "emergency" */
export default function ProfileFields({ form, onChange, sections = ["student", "guardian", "emergency"], canEditGroup = false, disabled = false }) {
  const field = (path, label, props = {}) => (
    <TextField
      label={label}
      value={get(form, path) ?? ""}
      onChange={(e) => onChange(setIn(form, path, e.target.value))}
      disabled={disabled}
      {...props}
    />
  );
  return (
    <Grid container spacing={2}>
      {sections.includes("student") && (
        <>
          <Grid size={12}><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Student</Typography></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field("name", "Full name", { required: true, autoComplete: "name" })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            {field("group", "Class group", {
              select: true,
              disabled: disabled || !canEditGroup,
              helperText: canEditGroup ? undefined : "Set by your teacher",
              children: [<MenuItem key="" value="">Not set</MenuItem>, ...GROUPS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)],
            })}
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field("profile.birthday", "Date of birth", { required: true, type: "date", slotProps: { inputLabel: { shrink: true } } })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            {field("profile.gender", "Gender", {
              required: true,
              select: true,
              children: ["Female", "Male", "Other", "Prefer not to say"].map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>),
            })}
          </Grid>
          <Grid size={12}>{field("profile.address", "Address", { required: true, autoComplete: "street-address" })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field("profile.city", "City", { autoComplete: "address-level2" })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field("profile.postal_code", "Postcode", { autoComplete: "postal-code" })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field("profile.school", "School")}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field("profile.grade", "School year / grade")}</Grid>
        </>
      )}
      {sections.includes("guardian") && (
        <>
          <Grid size={12}><Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1 }}>Parent or guardian</Typography></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field("guardian.name", "Name", { required: true })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            {field("guardian.guardian_type", "Relationship", {
              select: true,
              children: [<MenuItem key="" value="">Not set</MenuItem>, ...["Father", "Mother", "Guardian"].map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)],
            })}
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field("guardian.email", "Email", { required: true, type: "email" })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field("guardian.mobile", "Mobile", { required: true, type: "tel" })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field("guardian.home", "Home phone", { type: "tel" })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field("guardian.profession", "Profession")}</Grid>
        </>
      )}
      {sections.includes("emergency") && (
        <>
          <Grid size={12}><Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1 }}>Emergency contact</Typography></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field("emergency.name", "Name", { required: true })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field("emergency.relationship", "Relationship to student", { required: true })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field("emergency.mobile", "Mobile", { required: true, type: "tel" })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field("emergency.home", "Home phone", { type: "tel" })}</Grid>
          <Grid size={12}>{field("special_note", "Anything the teacher should know (allergies, needs…)", { multiline: true, minRows: 2 })}</Grid>
        </>
      )}
    </Grid>
  );
}
