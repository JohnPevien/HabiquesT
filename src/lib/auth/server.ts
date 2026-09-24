// Managed Better Auth (Neon Auth) server instance.
// Identity lives in the Neon database's neon_auth schema; RLS policies
// in src/db/rls-baseline.sql key on auth.uid()::uuid.

import { createNeonAuth } from "@neondatabase/auth/next/server";

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});
