// Neon serverless Postgres client. HTTP driver: one-shot queries from
// serverless/edge runtimes, no TCP, no pool to manage.
// The neon() template function parameterizes every value (SQL-injection safe).

import "server-only";

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — add it to .env.local");
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });