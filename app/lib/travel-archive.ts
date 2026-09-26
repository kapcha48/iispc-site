import travelArchiveData from "../content/travel.json";

export type ArchivedTravelProgram = {
  slug: string;
  date: string;
  place: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  html: string;
  sourceUrl: string;
};

export const travelArchive = travelArchiveData as ArchivedTravelProgram[];

export function getArchivedTravelProgram(slug: string): ArchivedTravelProgram | null {
  return travelArchive.find((item) => item.slug === slug) ?? null;
}
