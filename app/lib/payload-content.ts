import type { ContentItem, ContentType } from "./content-store";

type PayloadCollection = "news" | "publications" | "events" | "galleries";

type PayloadMedia = {
  url?: string | null;
  alt?: string | null;
};

type PayloadDocument = {
  id: number | string;
  slug?: string | null;
  title?: string | null;
  excerpt?: string | null;
  description?: string | null;
  body?: unknown;
  authors?: string | null;
  cover?: PayloadMedia | number | string | null;
  images?: Array<PayloadMedia | number | string> | null;
  file?: PayloadMedia | number | string | null;
  eventDate?: string | null;
  location?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type PayloadResponse = {
  docs?: PayloadDocument[];
};

const collectionByType: Record<ContentType, PayloadCollection> = {
  news: "news",
  publication: "publications",
  event: "events",
  gallery: "galleries",
};

function cmsBaseUrl() {
  const value = process.env.IISPC_CMS_URL?.trim();
  return value ? value.replace(/\/$/, "") : null;
}

function textFromRichValue(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textFromRichValue).filter(Boolean).join("\n\n");
  if (typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  const ownText = typeof record.text === "string" ? record.text : "";
  const children = textFromRichValue(record.children ?? record.root);
  return [ownText, children].filter(Boolean).join(ownText && children ? " " : "");
}

function mediaValue(value: PayloadDocument["cover"] | PayloadDocument["file"], baseUrl: string) {
  if (!value || typeof value !== "object") return null;
  const path = value.url?.trim();
  if (!path) return null;
  return path.startsWith("http://") || path.startsWith("https://") ? path : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

function timestamp(value?: string | null) {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function mapDocument(type: ContentType, document: PayloadDocument, baseUrl: string): ContentItem {
  const galleryCover = type === "gallery" ? document.images?.find((item) => typeof item === "object") : null;
  const cover = (galleryCover && typeof galleryCover === "object" ? galleryCover : document.cover) ?? null;
  const body = textFromRichValue(document.body).trim();
  const updatedAt = timestamp(document.updatedAt);
  const publishedAt = document.publishedAt ? timestamp(document.publishedAt) : updatedAt;
  return {
    id: String(document.id),
    type,
    slug: document.slug?.trim() || `${type}-${document.id}`,
    title: document.title?.trim() || "Материал IISPC",
    excerpt: document.excerpt?.trim() || document.description?.trim() || "",
    body,
    author: document.authors?.trim() || "IISPC",
    coverUrl: mediaValue(cover, baseUrl),
    coverAlt: cover && typeof cover === "object" ? cover.alt?.trim() || document.title?.trim() || "" : "",
    attachmentUrl: mediaValue(document.file, baseUrl),
    eventDate: document.eventDate ?? null,
    location: document.location ?? null,
    status: "published",
    publishedAt,
    createdAt: timestamp(document.createdAt),
    updatedAt,
  };
}

async function fetchPayload(path: string) {
  const baseUrl = cmsBaseUrl();
  if (!baseUrl) return null;
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(3_500),
    });
    if (!response.ok) return null;
    return { baseUrl, data: (await response.json()) as PayloadResponse };
  } catch {
    return null;
  }
}

export async function listPayloadContent(type: ContentType, limit: number): Promise<ContentItem[] | null> {
  const collection = collectionByType[type];
  const query = new URLSearchParams({
    depth: "1",
    limit: String(limit),
    sort: type === "event" ? "-eventDate" : "-publishedAt",
    "where[_status][equals]": "published",
  });
  const result = await fetchPayload(`/api/${collection}?${query}`);
  if (!result?.data.docs) return null;
  return result.data.docs.map((document) => mapDocument(type, document, result.baseUrl));
}

export async function getPayloadContent(type: ContentType, slug: string): Promise<ContentItem | null | undefined> {
  const collection = collectionByType[type];
  const query = new URLSearchParams({
    depth: "1",
    limit: "1",
    "where[_status][equals]": "published",
    "where[slug][equals]": slug,
  });
  const result = await fetchPayload(`/api/${collection}?${query}`);
  if (!result?.data.docs) return undefined;
  const document = result.data.docs[0];
  return document ? mapDocument(type, document, result.baseUrl) : null;
}
