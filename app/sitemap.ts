import type { MetadataRoute } from "next";
import { listPublishedContent } from "./lib/content-store";
import { listEditorialArchiveItems, listEditorialLegacyPaths, listEditorialTravelPrograms } from "./lib/editorial-pages";
import { listPrograms } from "./lib/editorial-programs";
import { eventArchive } from "./lib/event-archive";
import { newsArchive } from "./lib/news-archive";
import { publicationArchive } from "./lib/publication-archive";

const siteUrl = "https://iispc.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [news, events, publications] = await Promise.all([
    listPublishedContent("news", 500),
    listPublishedContent("event", 500),
    listPublishedContent("publication", 500),
  ]);
  const staticPaths = [
    "", "/education", "/events", "/news", "/science", "/international", "/about",
    "/gallery", "/archive", "/contacts", "/privacy", ...listEditorialLegacyPaths(),
  ];

  return [
    ...staticPaths.map((path) => ({ url: `${siteUrl}${path}` })),
    ...listPrograms().map((program) => ({ url: `${siteUrl}/education/${program.slug}` })),
    ...listEditorialTravelPrograms().map((program) => ({ url: `${siteUrl}/international/${program.slug}` })),
    ...news.map((item) => ({ url: `${siteUrl}/news/${item.slug}`, lastModified: new Date(item.updatedAt) })),
    ...newsArchive.filter((item) => !news.some((published) => published.slug === item.slug)).map((item) => ({ url: `${siteUrl}/news/${item.slug}`, lastModified: new Date(item.date) })),
    ...events.map((item) => ({ url: `${siteUrl}/events/${item.slug}`, lastModified: new Date(item.updatedAt) })),
    ...eventArchive.filter((item) => !events.some((published) => published.slug === item.slug)).map((item) => ({ url: `${siteUrl}/events/${item.slug}` })),
    ...publications.map((item) => ({ url: `${siteUrl}/science/publications/${item.slug}`, lastModified: new Date(item.updatedAt) })),
    ...publicationArchive.filter((item) => !publications.some((published) => published.slug === item.slug)).map((item) => ({ url: `${siteUrl}/science/publications/${item.slug}` })),
    ...listEditorialArchiveItems().map((item) => ({ url: `${siteUrl}/archive/${item.slug}`, lastModified: new Date(item.modifiedAt) })),
  ];
}
