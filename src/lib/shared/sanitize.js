import DOMPurify from "isomorphic-dompurify";

// Tutorial bodies are rich text (HTML from the editor). They are cleaned when
// saved and again when shown, so a stored script can never run in a page.
const OPTIONS = {
  ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "h1", "h2", "h3", "h4", "blockquote", "pre", "code", "img", "span", "sub", "sup", "iframe"],
  ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "class", "style", "width", "height", "allowfullscreen", "frameborder"],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/)/i,
};

export function sanitizeHtml(html) {
  const clean = DOMPurify.sanitize(String(html ?? ""), OPTIONS);
  // only allow embedded video players, not arbitrary iframes
  return clean.replace(/<iframe\b[^>]*src="(?!https:\/\/(?:www\.)?(?:youtube(?:-nocookie)?\.com\/embed\/|player\.vimeo\.com\/video\/))[^"]*"[^>]*>(?:<\/iframe>)?/gi, "");
}
