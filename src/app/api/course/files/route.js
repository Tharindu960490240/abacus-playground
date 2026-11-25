import { route, ok } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { readUpload, storeFile } from "@/lib/server/uploads";

// Fixed: the old upload kept the sender's file name, so files overwrote each
// other, and any file type was accepted.
export const POST = route(async (req) => {
  await requireAdmin();
  const upload = await readUpload(req, "file", "pdf");
  const url = await storeFile("course", upload);
  return ok({ url, name: upload.originalName });
});
