import content from "../content/git-content.json";
import type { ContentItem, ContentType } from "./content-store";

const items = content as ContentItem[];

export function listGitContent(type?: ContentType, limit = 24): ContentItem[] {
  return items.filter((item) => item.status === "published" && (!type || item.type === type)).slice(0, limit);
}

export function getGitContent(type: ContentType, slug: string): ContentItem | null {
  return items.find((item) => item.status === "published" && item.type === type && item.slug === slug) ?? null;
}
