import { route, notFound } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { readPrivateFile } from "@/lib/server/uploads";

export const dynamic = "force-dynamic";

// Serves files from a *private* Blob store.
//   tutorials/  tutorial cover images: anyone
//   avatars/    profile photos: logged-in users only
//   course/     lesson PDFs: logged-in users only
const FOLDERS = { tutorials: "public", avatars: "user", course: "user" };

export const GET = route(async (req, { path }) => {
  const parts = Array.isArray(path) ? path : [path];
  const [folder, file, ...rest] = parts;
  if (!FOLDERS[folder] || !file || rest.length || !/^[\w-]+\.(jpg|png|webp|pdf)$/.test(file)) throw notFound("File not found");
  if (FOLDERS[folder] === "user") await requireUser();

  const result = await readPrivateFile(`${folder}/${file}`);
  if (!result || result.statusCode !== 200) throw notFound("File not found");

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType || "application/octet-stream",
      "Content-Length": String(result.blob.size),
      // file names are random and never reused, so they can be cached for a long time
      "Cache-Control": FOLDERS[folder] === "public" ? "public, max-age=31536000, immutable" : "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(file.endsWith(".pdf") ? { "Content-Disposition": `inline; filename="${file}"` } : {}),
    },
  });
});
