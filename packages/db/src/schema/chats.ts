import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { rooms } from "./rooms";
import { users } from "./users";

export const chats = pgTable("chats", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  message: text("message").notNull(),

  // Which room this message belongs to
  roomId: integer("room_id").references(() => rooms.id),

  // Which user sent this message
  userId: uuid("user_id").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow(),
});

// Fixed: was "ChatTableRealtion" (typo) — renamed to chatRelations
export const chatRelations = relations(chats, ({ one }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
  room: one(rooms, {
    fields: [chats.roomId],
    references: [rooms.id],
  }),
}));
