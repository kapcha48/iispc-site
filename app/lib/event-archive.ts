import eventArchiveData from "../content/events.json";

export type ArchivedEvent = {
  slug: string;
  title: string;
  date: string;
  type: string;
  place: string;
  excerpt: string;
  html: string;
  sourceUrl: string;
};

export const eventArchive = eventArchiveData as ArchivedEvent[];

export function getArchivedEvent(slug: string): ArchivedEvent | null {
  return eventArchive.find((item) => item.slug === slug) ?? null;
}
