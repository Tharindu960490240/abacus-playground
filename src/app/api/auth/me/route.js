import { route, ok } from "@/lib/server/http";
import { getCurrentUser } from "@/lib/server/auth";
import { publicUser } from "@/lib/server/validation";

export const dynamic = "force-dynamic";

export const GET = route(async () => ok(publicUser(await getCurrentUser())));
