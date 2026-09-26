import type { ChatGPTUser } from "../chatgpt-auth";
import { getPayloadContent, listPayloadContent } from "./payload-content";

export type ContentType = "news" | "publication" | "event" | "gallery";
export type ContentStatus = "draft" | "published" | "archived";
export type InquiryStatus = "new" | "reviewed" | "closed";
export type InquiryTopic = "education" | "events" | "science" | "international" | "other";

type AppBindings = {
  DB?: D1Database;
  MEDIA?: R2Bucket;
  IISPC_ADMIN_USER_IDS?: string;
};

export type ContentItem = {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  author: string;
  coverUrl: string | null;
  coverAlt: string;
  attachmentUrl: string | null;
  eventDate: string | null;
  location: string | null;
  status: ContentStatus;
  publishedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type Inquiry = {
  id: string;
  topic: InquiryTopic;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: InquiryStatus;
  createdAt: number;
  updatedAt: number;
};

export type MediaFile = {
  id: string;
  url: string;
  filename: string;
  contentType: string;
  altText: string;
  size: number;
  createdAt: number;
};

export type InquiryInput = Pick<Inquiry, "topic" | "name" | "email" | "phone" | "message">;

export type ContentInput = Omit<ContentItem, "id" | "slug" | "createdAt" | "updatedAt" | "publishedAt"> & {
  id?: string;
  slug?: string;
};

async function getBindings(): Promise<AppBindings> {
  try {
    const runtime = await import("cloudflare:workers");
    return runtime.env as unknown as AppBindings;
  } catch {
    return {};
  }
}

function rowToContent(row: Record<string, unknown>): ContentItem {
  return {
    id: String(row.id),
    type: row.type as ContentType,
    slug: String(row.slug),
    title: String(row.title),
    excerpt: String(row.excerpt ?? ""),
    body: String(row.body ?? ""),
    author: String(row.author ?? ""),
    coverUrl: row.cover_url ? String(row.cover_url) : null,
    coverAlt: String(row.cover_alt ?? ""),
    attachmentUrl: row.attachment_url ? String(row.attachment_url) : null,
    eventDate: row.event_date ? String(row.event_date) : null,
    location: row.location ? String(row.location) : null,
    status: row.status as ContentStatus,
    publishedAt: row.published_at == null ? null : Number(row.published_at),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

function rowToInquiry(row: Record<string, unknown>): Inquiry {
  return {
    id: String(row.id),
    topic: row.topic as InquiryTopic,
    name: String(row.name),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    message: String(row.message),
    status: row.status as InquiryStatus,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export async function isAdminUser(user: ChatGPTUser | null) {
  if (!user) return false;
  const bindings = await getBindings();
  const allowed = (bindings.IISPC_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return allowed.includes(user.userId);
}

export async function listPublishedContent(type?: ContentType, limit = 24): Promise<ContentItem[]> {
  if (type) {
    const payloadItems = await listPayloadContent(type, limit);
    if (payloadItems) return payloadItems;
  }
  const bindings = await getBindings();
  const db = bindings.DB;
  if (!db) return [] as ContentItem[];
  try {
    const statement = type
      ? db.prepare("SELECT * FROM content_items WHERE status = 'published' AND type = ? ORDER BY COALESCE(published_at, created_at) DESC LIMIT ?").bind(type, limit)
      : db.prepare("SELECT * FROM content_items WHERE status = 'published' ORDER BY COALESCE(published_at, created_at) DESC LIMIT ?").bind(limit);
    const result = await statement.all<Record<string, unknown>>();
    return result.results.map(rowToContent);
  } catch {
    return [] as ContentItem[];
  }
}

export async function getPublishedContent(type: ContentType, slug: string): Promise<ContentItem | null> {
  const payloadItem = await getPayloadContent(type, slug);
  if (payloadItem !== undefined) return payloadItem;
  const bindings = await getBindings();
  const db = bindings.DB;
  if (!db) return null;
  try {
    const row = await db.prepare("SELECT * FROM content_items WHERE status = 'published' AND type = ? AND slug = ? LIMIT 1").bind(type, slug).first<Record<string, unknown>>();
    return row ? rowToContent(row) : null;
  } catch {
    return null;
  }
}

export async function listAllContent(): Promise<ContentItem[]> {
  const bindings = await getBindings();
  const db = bindings.DB;
  if (!db) return [] as ContentItem[];
  const result = await db.prepare("SELECT * FROM content_items ORDER BY updated_at DESC").all<Record<string, unknown>>();
  return result.results.map(rowToContent);
}

export async function saveContent(input: ContentInput, user: ChatGPTUser) {
  const bindings = await getBindings();
  const db = bindings.DB;
  if (!db) throw new Error("Хранилище материалов пока недоступно");
  const now = Date.now();
  const id = input.id || crypto.randomUUID();
  const slug = input.slug || `${input.type}-${now.toString(36)}-${id.slice(0, 6)}`;
  const publishedAt = input.status === "published" ? now : null;
  const previous = input.id
    ? await db.prepare("SELECT cover_url, attachment_url FROM content_items WHERE id = ? LIMIT 1").bind(input.id).first<{ cover_url: string | null; attachment_url: string | null }>()
    : null;
  await validateMediaReference(db, input.coverUrl, "image");
  await validateMediaReference(db, input.attachmentUrl, "pdf");
  await db.prepare(`INSERT INTO content_items (
      id, type, slug, title, excerpt, body, author, cover_url, cover_alt, attachment_url,
      event_date, location, status, published_at, created_at, updated_at, owner_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      type = excluded.type, title = excluded.title, excerpt = excluded.excerpt,
      body = excluded.body, author = excluded.author, cover_url = excluded.cover_url,
      cover_alt = excluded.cover_alt, attachment_url = excluded.attachment_url, event_date = excluded.event_date,
      location = excluded.location, status = excluded.status,
      published_at = CASE WHEN excluded.status = 'published' THEN COALESCE(content_items.published_at, excluded.published_at) ELSE content_items.published_at END,
      updated_at = excluded.updated_at
  `).bind(
    id, input.type, slug, input.title.trim(), input.excerpt.trim(), input.body.trim(),
    input.author.trim(), input.coverUrl, input.coverAlt.trim(), input.attachmentUrl, input.eventDate,
    input.location, input.status, publishedAt, now, now, user.userId,
  ).run();
  if (previous) {
    await removeUnreferencedMedia([previous.cover_url, previous.attachment_url].filter((url) => url && url !== input.coverUrl && url !== input.attachmentUrl) as string[], db, bindings.MEDIA);
  }
  return { id, slug };
}

export async function deleteContent(id: string) {
  const bindings = await getBindings();
  const db = bindings.DB;
  if (!db) throw new Error("Хранилище материалов пока недоступно");
  const previous = await db.prepare("SELECT cover_url, attachment_url FROM content_items WHERE id = ? LIMIT 1").bind(id).first<{ cover_url: string | null; attachment_url: string | null }>();
  await db.prepare("DELETE FROM content_items WHERE id = ?").bind(id).run();
  if (previous) {
    await removeUnreferencedMedia([previous.cover_url, previous.attachment_url].filter(Boolean) as string[], db, bindings.MEDIA);
  }
}

export async function saveMedia(file: File, altText: string, user: ChatGPTUser) {
  const bindings = await getBindings();
  const bucket = bindings.MEDIA;
  const db = bindings.DB;
  if (!bucket || !db) throw new Error("Хранилище файлов пока недоступно");
  const id = crypto.randomUUID();
  const extension = extensionForType(file.type);
  const key = `${id}${extension}`;
  await bucket.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
    customMetadata: { filename: file.name, altText: altText.slice(0, 240) },
  });
  try {
    await db.prepare("INSERT INTO media_files (id, storage_key, filename, content_type, alt_text, size, owner_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id, key, file.name, file.type || "application/octet-stream", altText.slice(0, 240), file.size, user.userId, Date.now())
      .run();
  } catch (error) {
    await bucket.delete(key);
    throw error;
  }
  return { url: `/media/${encodeURIComponent(key)}`, key };
}

export async function listMedia(limit = 120): Promise<MediaFile[]> {
  const bindings = await getBindings();
  const db = bindings.DB;
  if (!db) return [];
  const result = await db.prepare("SELECT id, storage_key, filename, content_type, alt_text, size, created_at FROM media_files ORDER BY created_at DESC LIMIT ?")
    .bind(limit)
    .all<Record<string, unknown>>();
  return result.results.map((row) => ({
    id: String(row.id),
    url: `/media/${encodeURIComponent(String(row.storage_key))}`,
    filename: String(row.filename),
    contentType: String(row.content_type),
    altText: String(row.alt_text ?? ""),
    size: Number(row.size),
    createdAt: Number(row.created_at),
  }));
}

export async function getMediaForDelivery(key: string) {
  const bindings = await getBindings();
  if (!bindings.DB || !bindings.MEDIA) return null;
  const media = await bindings.DB.prepare(`SELECT filename, content_type,
      EXISTS(
        SELECT 1 FROM content_items
        WHERE status = 'published' AND (cover_url = ? OR attachment_url = ?)
      ) AS is_published
    FROM media_files WHERE storage_key = ? LIMIT 1`)
    .bind(`/media/${encodeURIComponent(key)}`, `/media/${encodeURIComponent(key)}`, key)
    .first<{ filename: string; content_type: string; is_published: number }>();
  if (!media) return null;
  const object = await bindings.MEDIA.get(key);
  if (!object) return null;
  return {
    object,
    filename: media.filename,
    contentType: media.content_type,
    isPublished: Boolean(media.is_published),
  };
}

export async function createInquiry(input: InquiryInput, fingerprint: string) {
  const bindings = await getBindings();
  const db = bindings.DB;
  if (!db) throw new Error("Сервис обращений временно недоступен");

  const now = Date.now();
  const windowLength = 30 * 60 * 1000;
  const existing = await db.prepare("SELECT window_start, attempts FROM inquiry_rate_limits WHERE fingerprint = ? LIMIT 1")
    .bind(fingerprint)
    .first<{ window_start: number; attempts: number }>();
  const withinWindow = existing && now - Number(existing.window_start) < windowLength;
  if (withinWindow && Number(existing.attempts) >= 5) {
    const retryAfter = Math.max(1, Math.ceil((windowLength - (now - Number(existing.window_start))) / 1000));
    return { accepted: false as const, retryAfter };
  }

  const windowStart = withinWindow ? Number(existing.window_start) : now;
  const attempts = withinWindow ? Number(existing.attempts) + 1 : 1;
  const id = crypto.randomUUID();

  await db.batch([
    db.prepare("INSERT INTO inquiries (id, topic, name, email, phone, message, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?)")
      .bind(id, input.topic, input.name, input.email, input.phone, input.message, now, now),
    db.prepare("INSERT INTO inquiry_rate_limits (fingerprint, window_start, attempts) VALUES (?, ?, ?) ON CONFLICT(fingerprint) DO UPDATE SET window_start = excluded.window_start, attempts = excluded.attempts")
      .bind(fingerprint, windowStart, attempts),
    db.prepare("DELETE FROM inquiry_rate_limits WHERE window_start < ?").bind(now - 48 * 60 * 60 * 1000),
  ]);

  return { accepted: true as const, id };
}

export async function listInquiries(): Promise<Inquiry[]> {
  const bindings = await getBindings();
  const db = bindings.DB;
  if (!db) return [];
  const result = await db.prepare("SELECT * FROM inquiries ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'reviewed' THEN 1 ELSE 2 END, created_at DESC")
    .all<Record<string, unknown>>();
  return result.results.map(rowToInquiry);
}

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  const bindings = await getBindings();
  const db = bindings.DB;
  if (!db) throw new Error("Хранилище обращений временно недоступно");
  await db.prepare("UPDATE inquiries SET status = ?, updated_at = ? WHERE id = ?").bind(status, Date.now(), id).run();
}

export async function deleteInquiry(id: string) {
  const bindings = await getBindings();
  const db = bindings.DB;
  if (!db) throw new Error("Хранилище обращений временно недоступно");
  await db.prepare("DELETE FROM inquiries WHERE id = ?").bind(id).run();
}

export async function deleteUnusedMedia(url: string) {
  const bindings = await getBindings();
  if (!bindings.DB || !bindings.MEDIA) throw new Error("Хранилище файлов пока недоступно");
  await removeUnreferencedMedia([url], bindings.DB, bindings.MEDIA);
}

function extensionForType(type: string) {
  const extensions: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "application/pdf": ".pdf",
  };
  return extensions[type] ?? "";
}

async function validateMediaReference(db: D1Database, url: string | null, expected: "image" | "pdf") {
  if (!url) return;
  const key = mediaKeyFromUrl(url);
  if (!key) throw new Error("Некорректная ссылка на файл");
  const media = await db.prepare("SELECT content_type FROM media_files WHERE storage_key = ? LIMIT 1")
    .bind(key)
    .first<{ content_type: string }>();
  if (!media) throw new Error("Файл не найден");
  if (expected === "image" && !media.content_type.startsWith("image/")) throw new Error("Обложка должна быть изображением");
  if (expected === "pdf" && media.content_type !== "application/pdf") throw new Error("Вложение должно быть PDF-файлом");
}

async function removeUnreferencedMedia(urls: string[], db: D1Database, bucket?: R2Bucket) {
  if (!bucket) return;
  for (const url of new Set(urls)) {
    const key = mediaKeyFromUrl(url);
    if (!key) continue;
    const reference = await db.prepare("SELECT 1 AS found FROM content_items WHERE cover_url = ? OR attachment_url = ? LIMIT 1").bind(url, url).first<{ found: number }>();
    if (reference) continue;
    await db.batch([
      db.prepare("DELETE FROM media_files WHERE storage_key = ?").bind(key),
    ]);
    await bucket.delete(key);
  }
}

function mediaKeyFromUrl(url: string) {
  if (!url.startsWith("/media/")) return null;
  try {
    return decodeURIComponent(url.slice("/media/".length));
  } catch {
    return null;
  }
}
