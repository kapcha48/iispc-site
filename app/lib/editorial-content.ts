import generatedContent from "../content/editorial-content.json";

type EditorialCollection = "programs" | "pages" | "people" | "sections";

export type EditorialEntry = {
  slug: string;
  filepath: string;
  status: "published";
  title: string;
  excerpt: string;
  body: string;
  bodyChanged: boolean;
  coverUrl: string | null;
  coverAlt: string;
  attachmentUrl: string | null;
  programType: string;
  programFormat: string;
  duration: string;
  admission: string;
  audience: string;
  intake: string;
  credential: string;
  outcomes: string[];
  modules: string[];
  registrationUrl: string | null;
  section: string;
  role: string;
  degree: string;
  group: string;
  location: string;
  order: number;
};

type EditorialRecord = EditorialEntry | { slug: string; status: "draft" | "archived" };
const collections = generatedContent as Record<EditorialCollection, EditorialRecord[]>;

export function getEditorialRecord(collection: EditorialCollection, slug: string): EditorialRecord | undefined {
  return collections[collection].find((entry) => entry.slug === slug.normalize("NFC"));
}

export function getEditorialEntry(collection: EditorialCollection, slug: string): EditorialEntry | undefined {
  const record = getEditorialRecord(collection, slug);
  return record?.status === "published" ? record : undefined;
}

export function listEditorialEntries(collection: EditorialCollection): EditorialEntry[] {
  return collections[collection].filter((entry) => entry.status === "published");
}

export function sectionCopy(slug: string) {
  const entry = getEditorialEntry("sections", slug);
  if (!entry) throw new Error("Missing editorial section: " + slug);
  return { title: entry.title, lead: entry.excerpt, editPath: entry.filepath };
}
