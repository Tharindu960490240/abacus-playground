import { route, ok } from "@/lib/server/http";
import { clearSession } from "@/lib/server/auth";

export const POST = route(async () => {
  await clearSession();
  return ok(null);
});
