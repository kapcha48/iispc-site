import type { Program } from "../data";
import { getEditorialEntry, listEditorialEntries, type EditorialEntry } from "./editorial-content";

const existingProgramSlugs = new Map([
  ["course-12775", "integrative-polymodal-psychotherapy"],
  ["course-12772", "crisis-psychotherapy"],
  ["course-12754", "polymodal-addiction-psychotherapy"],
  ["course-14937", "psychiatry-addictology"],
  ["course-12773", "continuing-education"],
]);

export type EditorialProgram = Program & {
  body: string;
  admission: string;
  coverUrl: string | null;
  coverAlt: string;
  attachmentUrl: string | null;
  registrationUrl: string | null;
  archiveHref: string | null;
};

function toProgram(entry: EditorialEntry): EditorialProgram {
  return {
    slug: existingProgramSlugs.get(entry.slug) ?? entry.slug,
    title: entry.title,
    type: entry.programType || "Образовательная программа",
    duration: entry.duration,
    audience: entry.audience,
    status: entry.intake,
    summary: entry.excerpt,
    format: entry.programFormat,
    document: entry.credential,
    outcomes: entry.outcomes,
    modules: entry.modules,
    body: entry.body,
    admission: entry.admission,
    coverUrl: entry.coverUrl,
    coverAlt: entry.coverAlt,
    attachmentUrl: entry.attachmentUrl,
    registrationUrl: entry.registrationUrl,
    archiveHref: existingProgramSlugs.has(entry.slug) ? `/archive/${entry.slug}` : null,
  };
}

export function listPrograms(): EditorialProgram[] {
  const published = listEditorialEntries("programs");
  const bySlug = new Map(published.map((entry) => [entry.slug, entry]));
  const ordered: EditorialEntry[] = [];
  for (const slug of existingProgramSlugs.keys()) {
    const entry = bySlug.get(slug);
    if (entry) ordered.push(entry);
    bySlug.delete(slug);
  }
  return [...ordered, ...bySlug.values()].map(toProgram);
}

export function getProgram(slug: string): EditorialProgram | undefined {
  const archiveSlug = [...existingProgramSlugs].find(([, canonical]) => canonical === slug)?.[0];
  const entry = getEditorialEntry("programs", archiveSlug ?? slug);
  if (!entry) return undefined;
  const program = toProgram(entry);
  return program.slug === slug ? program : undefined;
}
