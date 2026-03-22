import "dotenv/config"
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "../client"


async function main() {
  await migrate(db, {
    migrationsFolder: "./src/drizzle/migrations"
  });

  console.log("Migration complete");
  process.exit(0);
}

main();
