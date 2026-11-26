import { getEditorialEntry, getEditorialRecord } from "./editorial-content";
import { getLegacyPage, legacyPages, type LegacyPage } from "./legacy-pages";
import { getSourceArchiveItem, sourceArchiveItems } from "./source-archive";
import { getArchivedTravelProgram, travelArchive } from "./travel-archive";

type PageSource = {
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
};

export type EditorialPage<T extends PageSource> = T & {
  coverAlt: string;
  originalCoverUrl: string | null;
  editorialPath?: string;
  editorialBody?: string;
};

function applyEditorialPage<T extends PageSource>(page: T, collection: "pages" | "programs" = "pages"): EditorialPage<T> | null {
  const entry = getEditorialEntry(collection, page.slug);
  if (!entry) {
    return getEditorialRecord(collection, page.slug)
      ? null
      : { ...page, coverAlt: "", originalCoverUrl: page.coverUrl };
  }

  return {
    ...page,
    title: entry.title,
    excerpt: entry.excerpt,
    coverUrl: entry.coverUrl,
    coverAlt: entry.coverAlt,
    originalCoverUrl: page.coverUrl,
    editorialPath: entry.filepath,
    // The original HTML contains media and documents missing from the first
    // import. Keep it until an editor changes the main text.
    editorialBody: entry.bodyChanged ? entry.body : undefined,
  };
}

export function getEditorialLegacyPage(section: LegacyPage["section"], slug: string) {
  const page = getLegacyPage(section, slug);
  return page ? applyEditorialPage(page) : null;
}

export function listEditorialLegacyPaths() {
  return legacyPages
    .filter((page) => getEditorialLegacyPage(page.section, page.slug))
    .map((page) => `/${page.section}/${page.slug}`);
}

export function getEditorialTravelProgram(slug: string) {
  const program = getArchivedTravelProgram(slug);
  return program ? applyEditorialPage(program) : null;
}

export function listEditorialTravelPrograms() {
  return travelArchive.map((program) => applyEditorialPage(program)).filter((program) => program !== null);
}

export function getEditorialArchiveItem(slug: string): EditorialPage<(typeof sourceArchiveItems)[number]> | null {
  const item = getSourceArchiveItem(slug);
  if (!item) return null;
  if (item.kind === "page") return applyEditorialPage(item);
  if (item.kind === "course") return applyEditorialPage(item, "programs");
  return { ...item, coverAlt: "", originalCoverUrl: item.coverUrl };
}

export function listEditorialArchiveItems() {
  return sourceArchiveItems.map(({ slug }) => getEditorialArchiveItem(slug)).filter((item) => item !== null);
}

export function getEditorialPagePath(slug: string): string | null {
  const legacyPage = legacyPages.find((page) => page.slug === slug);
  if (legacyPage) return `/${legacyPage.section}/${slug}`;
  if (getArchivedTravelProgram(slug)) return `/international/${slug}`;
  if (getSourceArchiveItem(slug)?.kind === "page") return `/archive/${slug}`;
  return null;
}
