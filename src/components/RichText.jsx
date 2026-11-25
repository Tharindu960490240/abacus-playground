"use client";
import { useMemo } from "react";
import Box from "@mui/material/Box";
import { sanitizeHtml } from "@/lib/shared/sanitize";

/** Shows stored tutorial HTML. Cleaned on the server already; cleaned again here as a second guard. */
export default function RichText({ html }) {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  return <Box className="rich-text" sx={{ typography: "body1", lineHeight: 1.75, "& h2,& h3": { mt: 3 } }} dangerouslySetInnerHTML={{ __html: clean }} />;
}
