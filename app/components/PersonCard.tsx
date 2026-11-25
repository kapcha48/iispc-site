import Image from "next/image";
import type { EditorialPerson } from "../lib/editorial-people";
import EditorialMarkdown from "./EditorialMarkdown";
import { visualField } from "../lib/visual-fields";

export function PersonPortrait({ person, compact = false }: { person: EditorialPerson; compact?: boolean }) {
  if (!person.coverUrl) {
    if (compact) return null;
    const initials = person.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("");
    return <div className="faculty-monogram" aria-hidden="true">{initials}</div>;
  }
  return (
    <Image
      className="faculty-monogram"
      src={person.coverUrl}
      alt={person.coverAlt || person.name}
      width={compact ? 56 : 86}
      height={compact ? 56 : 86}
      style={compact ? { objectFit: "cover", width: 56, height: 56, margin: 0 } : { objectFit: "cover" }}
      unoptimized
      {...visualField(person.editPath, "cover", person.coverUrl, "Фотография сотрудника")}
    />
  );
}

export function PersonBiography({ person }: { person: EditorialPerson }) {
  if (!person.body) return null;
  return (
    <details>
      <summary>Биография</summary>
      <div className="prose"><EditorialMarkdown source={person.body} /></div>
    </details>
  );
}

export function PersonCard({ person, index }: { person: EditorialPerson; index: number }) {
  return (
    <article>
      <PersonPortrait person={person} />
      <span>{String(index + 1).padStart(2, "0")}</span>
      <h3 {...visualField(person.editPath, "title", person.name, "Имя сотрудника")}>{person.name}</h3>
      {person.degree ? <p {...visualField(person.editPath, "degree", person.degree, "Квалификация")}>{person.degree}</p> : null}
      {person.excerpt ? <p {...visualField(person.editPath, "excerpt", person.excerpt, "Краткое описание")}>{person.excerpt}</p> : null}
      {person.role ? <small {...visualField(person.editPath, "role", person.role, "Должность")}>{person.role}</small> : null}
      <PersonBiography person={person} />
    </article>
  );
}
