import {
  integer,
  pgEnum,
  pgTable,
  serial,
  uniqueIndex,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// ---- USERS ----

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  age: integer("age").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  avatar: varchar("avatar"),
  slug: varchar("slug", { length: 256 }).notNull(),
  email: varchar("email", { length: 25 }).unique().notNull(),
  password: varchar("password"),
});

export const insertUserSchema = createInsertSchema(users);
export const loginUserRequest = insertUserSchema.pick({
  email: true,
  password: true,
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
