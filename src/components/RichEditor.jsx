"use client";
import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import "quill/dist/quill.snow.css";

/**
 * Quill 2 rich-text editor (replaces ngx-quill). Produces HTML that is
 * sanitised on the server. Images are added by link (pasted data: images are
 * stripped by the sanitiser, so use the cover image upload or an image URL).
 */
export default function RichEditor({ value, onChange, placeholder = "Write the tutorial…" }) {
  const host = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const initial = useRef(value);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { default: Quill } = await import("quill");
      if (cancelled || !host.current || quillRef.current) return;
      const el = document.createElement("div");
      host.current.appendChild(el);
      const q = new Quill(el, {
        theme: "snow",
        placeholder,
        modules: {
          toolbar: {
            container: [[{ header: [2, 3, false] }], ["bold", "italic", "underline", "strike"], [{ list: "ordered" }, { list: "bullet" }], ["blockquote", "code-block"], ["link", "image", "video"], ["clean"]],
            handlers: {
              image() {
                const url = window.prompt("Image address (https://…)");
                if (url && /^https:\/\//i.test(url)) {
                  const range = this.quill.getSelection(true);
                  this.quill.insertEmbed(range.index, "image", url, "user");
                }
              },
            },
          },
        },
      });
      if (initial.current) q.clipboard.dangerouslyPasteHTML(initial.current);
      q.on("text-change", () => onChangeRef.current?.(q.getSemanticHTML()));
      quillRef.current = q;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load new content when a different tutorial is opened
  useEffect(() => {
    const q = quillRef.current;
    if (q && value !== q.getSemanticHTML() && value !== undefined) {
      initial.current = value;
      if (!q.hasFocus()) q.clipboard.dangerouslyPasteHTML(value || "");
    } else initial.current = value;
  }, [value]);

  return (
    <Box
      ref={host}
      sx={(t) => ({
        "& .ql-toolbar": { borderRadius: "12px 12px 0 0", borderColor: "divider" },
        "& .ql-container": { borderRadius: "0 0 12px 12px", borderColor: "divider", minHeight: 320, fontSize: 16, fontFamily: "inherit" },
        "& .ql-editor": { minHeight: 320 },
        ...t.applyStyles("dark", {
          "& .ql-toolbar .ql-stroke": { stroke: "#ddd" },
          "& .ql-toolbar .ql-fill": { fill: "#ddd" },
          "& .ql-toolbar .ql-picker": { color: "#ddd" },
          "& .ql-editor.ql-blank::before": { color: "rgba(255,255,255,.5)" },
        }),
      })}
    />
  );
}
