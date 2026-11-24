import { sectionCopy } from "../lib/editorial-content";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { PersonBiography, PersonPortrait } from "../components/PersonCard";
import { SectionNav } from "../components/SectionNav";
import { listEditorialTravelPrograms } from "../lib/editorial-pages";
import { listPeople } from "../lib/editorial-people";
import { pageMetadata } from "../lib/page-metadata";

export const metadata = pageMetadata({
  title: "Международная деятельность",
  description: "Научно-практические экспедиции, образовательные путешествия и региональные представители IISPC.",
  path: "/international",
});

export default function InternationalPage() {
  const copy = sectionCopy("international");
  const representatives = listPeople("representatives");
  const travelPrograms = listEditorialTravelPrograms();
  return (
    <div className="international-page-v2">
      <section className="international-masthead">
        <div className="shell">
          <div className="international-masthead-topline">
            <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Международная деятельность" }]} />
            <span className="international-masthead-index" aria-hidden="true">04</span>
          </div>
          <div className="international-masthead-grid">
            <div>
              <p className="eyebrow">Международная деятельность</p>
              <h1>{copy.title}</h1>
            </div>
            <div className="international-masthead-aside">
              <p>{copy.lead}</p>
              <dl className="international-masthead-facts" aria-label="Опубликованные сведения">
                <div><dt>Архивные программы</dt><dd>{String(travelPrograms.length).padStart(2, "0")}</dd></div>
                <div><dt>Региональные представители</dt><dd>{String(representatives.length).padStart(2, "0")}</dd></div>
              </dl>
              <a href="#international-projects">Смотреть программы <span aria-hidden="true">↓</span></a>
            </div>
          </div>
        </div>
      </section>

      <SectionNav items={[
        { href: "#international-projects", label: "Программы путешествий" },
        { href: "#international-representatives", label: "Региональные представители" },
      ]} />

      <section className="section international-projects-v2" id="international-projects">
        <div className="shell">
          <p className="international-section-kicker"><span>01</span><span>Путешествия</span></p>
          <div className="international-section-heading">
            <h2>Опубликованные программы и экспедиции</h2>
            <p>Маршруты, образовательные темы и подробное расписание завершённых программ.</p>
          </div>
          <div className="international-project-list">
            {travelPrograms.map((project, index) => (
              <article key={project.slug}>
                <div className="international-project-copy">
                  <div className="international-project-meta">
                    <span className="international-project-number">{String(index + 1).padStart(2, "0")}</span>
                    <p>{project.date}</p>
                  </div>
                  <h3>{project.place}</h3>
                  <h4>{project.title}</h4>
                  <p>{project.excerpt}</p>
                  <a className="text-link" href={`/international/${project.slug}`}>Открыть программу <span aria-hidden="true">→</span></a>
                </div>
              </article>
            ))}
            {!travelPrograms.length ? <p>Список программ обновляется.</p> : null}
          </div>
        </div>
      </section>

      <section className="section international-geography-v2" id="international-representatives">
        <div className="shell">
          <p className="international-section-kicker"><span>02</span><span>Региональные представители</span></p>
          <div className="international-section-heading">
            <h2>Региональные представители IISPC</h2>
            <p>Представительства института в разных городах и странах.</p>
          </div>
          {representatives.length ? <ol className="international-region-list international-representative-list" aria-label="Региональные представители IISPC">
            {representatives.map((representative, index) => (
              <li key={representative.slug}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <PersonPortrait person={representative} compact />
                  {representative.location ? <strong>{representative.location}</strong> : null}
                  <p>{representative.name}</p>
                  {representative.degree ? <small>{representative.degree}</small> : null}
                  {representative.role ? <small>{representative.role}</small> : null}
                  {representative.excerpt ? <small>{representative.excerpt}</small> : null}
                  <PersonBiography person={representative} />
                </div>
              </li>
            ))}
          </ol> : <p>Список представителей обновляется.</p>}
        </div>
      </section>
    </div>
  );
}
