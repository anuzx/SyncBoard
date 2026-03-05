import {
  pgTable,
  uuid,
  integer,
  text
} from "drizzle-orm/pg-core";
import { rooms } from "./rooms";
import { users } from "./users";

export const chats = pgTable("chats", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  roomId: integer("room_id")
    .references(() => rooms.id)
    .notNull(),

  message: text("message").notNull(),

  userId: uuid("user_id")
    .references(() => users.id)
});
