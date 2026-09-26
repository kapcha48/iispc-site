import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const contentItems = sqliteTable(
  "content_items",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    body: text("body").notNull().default(""),
    author: text("author").notNull().default(""),
    coverUrl: text("cover_url"),
    coverAlt: text("cover_alt").notNull().default(""),
    attachmentUrl: text("attachment_url"),
    eventDate: text("event_date"),
    location: text("location"),
    status: text("status").notNull().default("draft"),
    publishedAt: integer("published_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    ownerId: text("owner_id").notNull(),
  },
  (table) => [
    uniqueIndex("content_items_slug_unique").on(table.slug),
    index("content_items_type_status_idx").on(table.type, table.status),
    index("content_items_published_at_idx").on(table.publishedAt),
  ],
);

export const mediaFiles = sqliteTable(
  "media_files",
  {
    id: text("id").primaryKey(),
    storageKey: text("storage_key").notNull(),
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull(),
    altText: text("alt_text").notNull().default(""),
    size: integer("size").notNull(),
    ownerId: text("owner_id").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [uniqueIndex("media_files_storage_key_unique").on(table.storageKey)],
);

export const inquiries = sqliteTable(
  "inquiries",
  {
    id: text("id").primaryKey(),
    topic: text("topic").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    message: text("message").notNull(),
    status: text("status").notNull().default("new"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("inquiries_status_created_idx").on(table.status, table.createdAt)],
);

export const inquiryRateLimits = sqliteTable(
  "inquiry_rate_limits",
  {
    fingerprint: text("fingerprint").primaryKey(),
    windowStart: integer("window_start").notNull(),
    attempts: integer("attempts").notNull().default(0),
  },
  (table) => [index("inquiry_rate_limits_window_idx").on(table.windowStart)],
);
