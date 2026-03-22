import {
  pgTable,
  uuid,
  text,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const Provider = pgEnum("Provider", ["github", "google"]);

export const oauthAccounts = pgTable("oauth_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),

  provider: Provider("provider").notNull(),

  providerAccountId: text("provider_account_id").notNull().unique(),

  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
});

export const oauthAccountRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
}));
