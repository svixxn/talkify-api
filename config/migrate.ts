import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, sql } from "./db";

async function main() {
  await migrate(db, { migrationsFolder: "./drizzle" });

  await sql.end();
}

main()
  .then(() => console.log("Migrations successfully run."))
  .catch(console.error);
