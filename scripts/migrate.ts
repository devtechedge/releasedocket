import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to run migrations.");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : undefined });
try { await migrate(drizzle(pool), { migrationsFolder: "./drizzle" }); }
finally { await pool.end(); }
