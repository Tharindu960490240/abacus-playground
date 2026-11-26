// Upload helper for the scripts: works with public and private Blob stores,
// saving URLs in the same form as the app (see src/lib/server/uploads.js).
import { put } from "@vercel/blob";

let access = ["public", "private"].includes(process.env.BLOB_ACCESS) ? process.env.BLOB_ACCESS : null;

export async function putFile(pathname, buf, contentType) {
  const tryAs = async (a) => {
    const blob = await put(pathname, buf, { access: a, contentType, addRandomSuffix: true });
    access = a;
    return a === "public" ? blob.url : `/api/files/${blob.pathname}`;
  };
  if (access) return tryAs(access);
  try {
    return await tryAs("public");
  } catch (publicErr) {
    try {
      return await tryAs("private");
    } catch {
      throw publicErr;
    }
  }
}
