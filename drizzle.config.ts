import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  // DATABASE_URL is the Neon connection string (postgresql://...neon.tech/...).
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Player data is private (ADR: sharing boundary); schema is app-defined.
  strict: true,
  verbose: true,
});