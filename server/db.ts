import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";

// Path to local SQLite DB file
const DB_FILE = path.join(process.cwd(), "dev.db");

// Create SQLite instance
const sqlite = new Database(DB_FILE);

// Create Drizzle client with SQLite
export const db = drizzle(sqlite, { schema });

console.log("✅ Using SQLite dev database:", DB_FILE);
