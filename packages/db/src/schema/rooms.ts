import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp
} from "drizzle-orm/pg-core";

import { users } from "./users";


export const rooms = pgTable("rooms", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  slug: text("slug").unique().notNull(),

  createdAt: timestamp("created_at").defaultNow(),

  adminId: uuid("admin_id")
    .references(() => users.id)
});
