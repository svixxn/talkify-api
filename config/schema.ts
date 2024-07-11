import {
  integer,
  pgEnum,
  pgTable,
  serial,
  uniqueIndex,
  varchar,
  timestamp,
  boolean,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

const messageTypeEnum = pgEnum("message_type", [
  "text",
  "image",
  "video",
  "audio",
  "file",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  age: integer("age").notNull(),
  avatar: text("avatar"),
  slug: varchar("slug", { length: 256 }).notNull(),
  email: varchar("email", { length: 25 }).unique().notNull(),
  password: varchar("password").notNull(),
  phone: varchar("phone", { length: 25 }),
  bio: text("bio"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// export const userRoles = pgEnum("user_roles", ["admin", "moderator", "user"]);

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
  isGroup: boolean("isGroup").default(false),
  isDeleted: boolean("isDeleted").default(false),
  name: varchar("name", { length: 256 }),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
  senderId: integer("senderId").notNull(),
  chatId: integer("chatId").notNull(),
  content: text("content"),
  messageType: messageTypeEnum("messageType").notNull(),
});

//Zod schemas
export const insertUserSchema = createInsertSchema(users);
export const getUsersSchema = createSelectSchema(users);

export const signUpUserRequest = insertUserSchema.pick({
  name: true,
  age: true,
  email: true,
  password: true,
});
export const loginUserRequest = insertUserSchema.pick({
  email: true,
  password: true,
});

// Types
export type User = z.infer<typeof getUsersSchema>;
export type NewUser = z.infer<typeof signUpUserRequest>;
