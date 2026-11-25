export const COURSE_LEVELS = [
  { value: "foundation", label: "Foundation" },
  { value: "beginner", label: "Beginner" },
  { value: "pre_intermediate", label: "Pre-intermediate" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advance", label: "Advanced" },
];

export const courseLevelLabel = (v) => COURSE_LEVELS.find((l) => l.value === v)?.label || v;

/** Turns a YouTube or Vimeo page link into an embeddable player URL (or null). */
export function toEmbedUrl(link) {
  try {
    const u = new URL(link);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname.startsWith("/embed/")) return `https://www.youtube-nocookie.com${u.pathname}`;
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v)}`;
      const short = u.pathname.match(/^\/shorts\/([\w-]+)/);
      if (short) return `https://www.youtube-nocookie.com/embed/${short[1]}`;
    }
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(u.pathname.slice(1))}`;
    if (host === "youtube-nocookie.com" && u.pathname.startsWith("/embed/")) return u.toString();
    if (host === "vimeo.com") {
      const id = u.pathname.match(/^\/(\d+)/)?.[1];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (host === "player.vimeo.com") return u.toString();
  } catch {
    /* not a URL */
  }
  return null;
}
