import { listEditorialEntries } from "./editorial-content";

type PeopleGroup = "leadership" | "faculty" | "representatives";

export type EditorialPerson = {
  slug: string;
  name: string;
  role: string;
  degree: string;
  location: string;
  excerpt: string;
  body: string;
  coverUrl: string | null;
  coverAlt: string;
};

export function listPeople(group: PeopleGroup): EditorialPerson[] {
  return listEditorialEntries("people")
    .filter((entry) => (entry.group || "faculty") === group)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title, "ru"))
    .map((entry) => ({
      slug: entry.slug,
      name: entry.title,
      role: entry.role,
      degree: entry.degree,
      location: entry.location,
      excerpt: entry.excerpt,
      body: entry.body,
      coverUrl: entry.coverUrl,
      coverAlt: entry.coverAlt,
    }));
}
