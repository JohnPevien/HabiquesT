// All Managed Better Auth APIs proxy through this catch-all route.
// Auth reads per-request cookies — never statically renderable, and env vars
// are only guaranteed at request time.
export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";

export const { GET, POST } = auth.handler();
