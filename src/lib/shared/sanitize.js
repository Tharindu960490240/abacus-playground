import sanitize from "sanitize-html";

// Tutorial bodies are rich text (HTML from the editor). They are cleaned when
// saved and again when shown, so a stored script can never run in a page.
// sanitize-html is plain JavaScript (no jsdom), so it loads reliably in
// Vercel Functions as well as in the browser.

const VIDEO_HOSTS = /^https:\/\/(?:www\.)?(?:youtube(?:-nocookie)?\.com\/embed\/|player\.vimeo\.com\/video\/)/i;

const OPTIONS = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "h1", "h2", "h3", "h4", "blockquote", "pre", "code", "img", "span", "sub", "sup", "iframe"],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    iframe: ["src", "width", "height", "allowfullscreen", "frameborder"],
    "*": ["class"],
  },
  allowedClasses: { "*": [/^ql-/] }, // editor formatting (alignment, indent, code blocks)
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["https", "http"] },
  allowProtocolRelative: false,
  // only embedded video players, not arbitrary iframes
  exclusiveFilter: (frame) => frame.tag === "iframe" && !VIDEO_HOSTS.test(frame.attribs.src || ""),
  transformTags: {
    a: (tag, attribs) => ({ tagName: "a", attribs: { ...attribs, rel: "noopener noreferrer", ...(attribs.target ? { target: "_blank" } : {}) } }),
  },
};

export function sanitizeHtml(html) {
  return sanitize(String(html ?? ""), OPTIONS);
}
