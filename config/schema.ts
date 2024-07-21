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

const getLocalDate = () => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - timezoneOffset * 60 * 1000);
  return localDate;
};

export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "image",
  "video",
  "audio",
  "file",
]);

export const userRolesEnum = pgEnum("user_role", [
  "admin",
  "moderator",
  "user",
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
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(getLocalDate),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(getLocalDate),
  isGroup: boolean("isGroup").default(false),
  isDeleted: boolean("isDeleted").default(false),
  name: varchar("name", { length: 256 }).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(getLocalDate),
  senderId: integer("senderId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  chatId: integer("chatId")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  content: text("content"),
  messageType: messageTypeEnum("messageType").notNull(),
});

export const chat_participants = pgTable("chat_participants", {
  id: serial("id").primaryKey(),
  chatId: integer("chatId")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  userId: integer("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joinedAt").defaultNow(),
  role: userRolesEnum("user_role").default("user"),
});

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(getLocalDate),
  messageId: integer("messageid").references(() => messages.id, {
    onDelete: "cascade",
  }),
  url: text("url").notNull(),
  type: varchar("type", { length: 256 }).notNull(),
});

//Zod schemas
export const insertUserSchema = createInsertSchema(users);
export const insertChatSchema = createInsertSchema(chats);
export const updateChatSchema = insertChatSchema.partial();
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
export const inviteUsersToChatSchema = z.object({
  userIds: z.array(z.number()),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = z.infer<typeof signUpUserRequest>;
export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type ChatParticipant = typeof chat_participants.$inferSelect;
export type Media = typeof media.$inferSelect;
