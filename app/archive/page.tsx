import { PageHero } from "../components/PageHero";
import { SectionNav } from "../components/SectionNav";
import { listEditorialArchiveItems } from "../lib/editorial-pages";
import { pageMetadata } from "../lib/page-metadata";
import { sourceArchive } from "../lib/source-archive";

export const metadata = pageMetadata({
  title: "Архив прежнего сайта",
  description: "Полный архив опубликованных страниц, новостей и образовательных программ прежней версии IISPC.",
  path: "/archive",
});

const groups = [
  { kind: "page", id: "archive-pages", label: "Страницы", title: "Материалы и разделы прежнего сайта" },
  { kind: "post", id: "archive-news", label: "Новости", title: "Опубликованные новости" },
  { kind: "course", id: "archive-courses", label: "Программы", title: "Образовательные программы" },
] as const;

export default function SourceArchivePage() {
  const itemsByKind = listEditorialArchiveItems();
  const savedFiles = sourceArchive.stats.downloaded + sourceArchive.stats.existing;
  return (
    <>
      <PageHero
        eyebrow="Архив IISPC"
        title="Материалы прежней версии сайта"
        lead={`Страницы, новости и учебные программы прежнего сайта. Сохранено ${savedFiles} связанных файлов.`}
        action={{ href: "#archive-pages", label: "Открыть архив" }}
      />
      <SectionNav items={groups.map((group) => ({ href: `#${group.id}`, label: group.label }))} />
      {groups.map((group, groupIndex) => {
        const items = itemsByKind.filter((item) => item.kind === group.kind);
        return (
          <section className={`section source-archive-section${groupIndex % 2 ? " section-soft" : ""}`} id={group.id} key={group.kind}>
            <div className="shell">
              <div className="section-heading section-heading-editorial">
                <div><p className="eyebrow">{group.label}</p><h2>{group.title}</h2></div>
                <p>{items.length} {countLabel(items.length, group.kind)}</p>
              </div>
              <div className="archive-list source-archive-list">
                {items.map((item, index) => (
                  <article key={item.slug}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <p>{formatDate(item.date)}</p>
                      <h3>{item.title}</h3>
                    </div>
                    <a className="text-link" href={`/archive/${item.slug}`}>Открыть <span aria-hidden="true">→</span></a>
                  </article>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

function countLabel(count: number, kind: "page" | "post" | "course") {
  if (kind === "page") return count === 1 ? "страница" : "страниц";
  if (kind === "post") return count === 1 ? "новость" : "новостей";
  return count === 1 ? "программа" : "программ";
}

