import sourceArchiveJson from "../content/source-archive.json";

export type SourceArchiveItem = {
  slug: string;
  sourceSlug: string;
  kind: "page" | "post" | "course";
  kindLabel: string;
  title: string;
  date: string;
  modifiedAt: string;
  excerpt: string;
  coverUrl: string | null;
  html: string;
  sourceUrl: string;
};

type SourceArchive = {
  generatedAt: string;
  sourceUrl: string;
  stats: {
    pages: number;
    posts: number;
    courses: number;
    media: number;
    downloaded: number;
    existing: number;
    failed: number;
  };
  items: SourceArchiveItem[];
};

export const sourceArchive = sourceArchiveJson as SourceArchive;
export const sourceArchiveItems = sourceArchive.items;

export function getSourceArchiveItem(slug: string) {
  return sourceArchiveItems.find((item) => item.slug === slug);
}

