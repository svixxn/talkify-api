import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL || "";

export const sql = postgres(connectionString, { max: 1 });

export const db = drizzle(sql);
