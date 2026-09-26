import legacyPagesJson from "../content/legacy-pages.json";

export type LegacyPage = {
  slug: string;
  section: "science" | "education" | "about";
  eyebrow: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  html: string;
  sourceUrl: string;
  modifiedAt: string;
};

export const legacyPages = legacyPagesJson as LegacyPage[];

export function getLegacyPage(section: LegacyPage["section"], slug: string) {
  return legacyPages.find((page) => page.section === section && page.slug === slug);
}
