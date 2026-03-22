import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { chats } from "./chats";

export const rooms = pgTable("rooms", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  slug: text("slug").unique().notNull(),

  createdAt: timestamp("created_at").defaultNow(),

  // The user who created/owns this room
  adminId: uuid("admin_id").references(() => users.id),

  //   Bug 1 — type mismatch: chats.id is integer, not uuid
  //   Bug 2 — design flaw: a room shouldn't store a FK to a single chat.
  //            chats belong to a room via chats.roomId (FK on the chats side).
});

export const roomRelations = relations(rooms, ({ one, many }) => ({
  admin: one(users, {
    fields: [rooms.adminId],
    references: [users.id],
  }),
  // "chats" here is the relation name — safe now that the column is removed
  chats: many(chats),
}));
