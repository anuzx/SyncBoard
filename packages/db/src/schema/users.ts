import {
  pgTable,
  uuid,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { oauthAccounts } from "./oauth";
import { chats } from "./chats";
import { rooms } from "./rooms";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: text("name").notNull(),

  email: text("email").unique(),

  createdAt: timestamp("created_at").defaultNow(),
});

// Lets you do: db.query.users.findMany({ with: { oauthAccounts, chats, rooms } })
export const userRelations = relations(users, ({ many }) => ({
  oauthAccounts: many(oauthAccounts),
  chats: many(chats),
  rooms: many(rooms), // rooms where this user is the admin
}));
