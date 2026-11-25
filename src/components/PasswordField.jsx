"use client";
import { useState } from "react";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import { VisibilityRounded, VisibilityOffRounded } from "@mui/icons-material";

export default function PasswordField(props) {
  const [show, setShow] = useState(false);
  return (
    <TextField
      type={show ? "text" : "password"}
      {...props}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShow((s) => !s)} edge="end" aria-label={show ? "Hide password" : "Show password"}>
                {show ? <VisibilityOffRounded /> : <VisibilityRounded />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
