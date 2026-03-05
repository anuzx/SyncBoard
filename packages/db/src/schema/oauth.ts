import {
  pgTable,
  uuid,
  text
} from "drizzle-orm/pg-core";

import { users } from "./users";


export const oauthAccounts = pgTable("oauth_accounts", {
  provider: text("provider").notNull(),

  providerAccountId: text("provider_account_id").notNull(),

  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
});
