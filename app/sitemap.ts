import type { MetadataRoute } from "next";
import { programs } from "./data";
import { listPublishedContent } from "./lib/content-store";
import { eventArchive } from "./lib/event-archive";
import { newsArchive } from "./lib/news-archive";
import { publicationArchive } from "./lib/publication-archive";
import { travelArchive } from "./lib/travel-archive";
import { sourceArchiveItems } from "./lib/source-archive";

const siteUrl = "https://iispc.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [news, events, publications] = await Promise.all([
    listPublishedContent("news", 500),
    listPublishedContent("event", 500),
    listPublishedContent("publication", 500),
  ]);
  const staticPaths = ["", "/education", "/education/tools", "/events", "/news", "/science", "/science/projects", "/science/council", "/science/academy", "/international", "/about", "/about/partners", "/gallery", "/archive", "/contacts", "/privacy"];

  return [
    ...staticPaths.map((path) => ({ url: `${siteUrl}${path}` })),
    ...programs.map((program) => ({ url: `${siteUrl}/education/${program.slug}` })),
    ...travelArchive.map((program) => ({ url: `${siteUrl}/international/${program.slug}` })),
    ...news.map((item) => ({ url: `${siteUrl}/news/${item.slug}`, lastModified: new Date(item.updatedAt) })),
    ...newsArchive.filter((item) => !news.some((published) => published.slug === item.slug)).map((item) => ({ url: `${siteUrl}/news/${item.slug}`, lastModified: new Date(item.date) })),
    ...events.map((item) => ({ url: `${siteUrl}/events/${item.slug}`, lastModified: new Date(item.updatedAt) })),
    ...eventArchive.filter((item) => !events.some((published) => published.slug === item.slug)).map((item) => ({ url: `${siteUrl}/events/${item.slug}` })),
    ...publications.map((item) => ({ url: `${siteUrl}/science/publications/${item.slug}`, lastModified: new Date(item.updatedAt) })),
    ...publicationArchive.filter((item) => !publications.some((published) => published.slug === item.slug)).map((item) => ({ url: `${siteUrl}/science/publications/${item.slug}` })),
    ...sourceArchiveItems.map((item) => ({ url: `${siteUrl}/archive/${item.slug}`, lastModified: new Date(item.modifiedAt) })),
  ];
}
