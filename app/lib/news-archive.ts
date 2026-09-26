import newsArchiveData from "../content/news.json";

export type ArchivedNewsItem = {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  coverUrl: string | null;
  html: string;
  sourceUrl: string;
};

export const newsArchive = newsArchiveData as ArchivedNewsItem[];

export function getArchivedNewsItem(slug: string): ArchivedNewsItem | null {
  return newsArchive.find((item) => item.slug === slug) ?? null;
}
