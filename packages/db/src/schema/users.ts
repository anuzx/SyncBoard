import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: text("name").notNull(),

  email: text("email").unique(),

  createdAt: timestamp("created_at").defaultNow()
});
