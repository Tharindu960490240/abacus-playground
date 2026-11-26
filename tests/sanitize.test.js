import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "@/lib/shared/sanitize";

describe("tutorial HTML cleaning", () => {
  it("keeps normal formatting", () => {
    const html = '<h2>Title</h2><p><strong>Bold</strong> <em>it</em> <a href="https://x.com" target="_blank">link</a></p><ul><li>a</li></ul><img src="https://x.com/a.png" alt="a">';
    const out = sanitizeHtml(html);
    expect(out).toContain("<h2>Title</h2>");
    expect(out).toContain("<strong>Bold</strong>");
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('<img src="https://x.com/a.png" alt="a" />');
  });
  it("removes scripts, event handlers and javascript: links", () => {
    const out = sanitizeHtml('<p onclick="alert(1)">x</p><script>alert(1)</script><a href="javascript:alert(1)">y</a><img src=x onerror=alert(1)>');
    expect(out).not.toMatch(/script|onclick|onerror|javascript:/i);
  });
  it("allows YouTube/Vimeo embeds only", () => {
    expect(sanitizeHtml('<iframe src="https://www.youtube.com/embed/abc"></iframe>')).toContain("youtube.com/embed/abc");
    expect(sanitizeHtml('<iframe src="https://evil.example/page"></iframe>')).toBe("");
  });
});
