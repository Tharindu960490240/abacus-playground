import { describe, it, expect, vi, beforeEach } from "vitest";

const blob = { mode: "private", calls: [], user: null, files: {} };

vi.mock("@vercel/blob", () => {
  class BlobError extends Error {}
  return {
    BlobError,
    put: async (name, buf, { access }) => {
      blob.calls.push(access);
      if (blob.mode === "broken") throw new BlobError("Vercel Blob: Access denied, please provide a valid token for this resource.");
      if (access !== blob.mode) throw new BlobError(`Vercel Blob: Cannot use ${access} access on a ${blob.mode} store.`);
      return { url: `https://store.${access}.blob.vercel-storage.com/${name}`, pathname: name };
    },
    get: async (pathname) => (blob.files[pathname] ? { statusCode: 200, stream: new Blob([blob.files[pathname]]).stream(), blob: { contentType: "image/png", size: blob.files[pathname].length } } : null),
    del: async () => {},
  };
});
vi.mock("@/lib/server/db", () => ({ connectDb: async () => {} }));
vi.mock("@/lib/server/auth", async () => {
  const { unauthorized } = await import("@/lib/server/http");
  return { requireUser: async () => { if (!blob.user) throw unauthorized(); return blob.user; } };
});

const png = { buf: Buffer.from([0x89, 0x50, 0x4e, 0x47]), type: "image/png", ext: "png" };

beforeEach(() => {
  vi.resetModules();
  blob.calls = [];
  process.env.BLOB_READ_WRITE_TOKEN = "test";
  delete process.env.BLOB_ACCESS;
});

describe("uploads to Vercel Blob", () => {
  it("works with a private store and remembers it", async () => {
    blob.mode = "private";
    const { storeFile } = await import("@/lib/server/uploads");
    const url = await storeFile("avatars", png);
    expect(url).toMatch(/^\/api\/files\/avatars\/[\w-]+\.png$/);
    await storeFile("avatars", png);
    expect(blob.calls).toEqual(["public", "private", "private"]);
  });

  it("works with a public store", async () => {
    blob.mode = "public";
    const { storeFile } = await import("@/lib/server/uploads");
    expect(await storeFile("avatars", png)).toMatch(/^https:\/\/store\.public\.blob\.vercel-storage\.com\/avatars\//);
  });

  it("shows the real reason when the store refuses", async () => {
    blob.mode = "broken";
    const { storeFile } = await import("@/lib/server/uploads");
    await expect(storeFile("avatars", png)).rejects.toMatchObject({ status: 502, message: expect.stringContaining("Access denied") });
  });
});

describe("private file route", () => {
  const call = async (path) => {
    const { GET } = await import("@/app/api/files/[...path]/route.js");
    return GET(new Request(`http://localhost/api/files/${path.join("/")}`), { params: Promise.resolve({ path }) });
  };
  it("needs a login for profile photos, not for tutorial images", async () => {
    blob.files = { "avatars/a1.png": "x", "tutorials/t1.png": "y" };
    blob.user = null;
    expect((await call(["avatars", "a1.png"])).status).toBe(401);
    const res = await call(["tutorials", "t1.png"]);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    blob.user = { _id: "u1" };
    expect((await call(["avatars", "a1.png"])).status).toBe(200);
  });
  it("refuses other folders and odd names", async () => {
    blob.user = { _id: "u1" };
    expect((await call(["secrets", "a.png"])).status).toBe(404);
    expect((await call(["avatars", "..", "x.png"])).status).toBe(404);
    expect((await call(["avatars", "missing.png"])).status).toBe(404);
  });
});
