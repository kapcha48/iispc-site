import publicationArchiveData from "../content/publications.json";

export type ArchivedPublication = {
  slug: string;
  title: string;
  excerpt: string;
  html: string;
  sourceUrl: string;
};

export const publicationArchive = publicationArchiveData as ArchivedPublication[];

export function getArchivedPublication(slug: string): ArchivedPublication | null {
  return publicationArchive.find((item) => item.slug === slug) ?? null;
}
