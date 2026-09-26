import Image from "next/image";
import { PageHero } from "../components/PageHero";
import { listPublishedContent } from "../lib/content-store";
import { newsArchive } from "../lib/news-archive";
import { pageMetadata } from "../lib/page-metadata";

export const metadata = pageMetadata({
  title: "Новости",
  description: "Актуальные новости, объявления и материалы IISPC.",
  path: "/news",
});

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const items = await listPublishedContent("news");
  const managedSlugs = new Set(items.map((item) => item.slug));
  const archivedItems = items.length ? [] : newsArchive.filter((item) => !managedSlugs.has(item.slug));
  return (
    <>
      <PageHero eyebrow="Новости" title="Актуальная жизнь института" lead="Новые наборы, анонсы, результаты мероприятий, проекты и важные объявления IISPC." action={{ href: "#news-feed", label: "Перейти к материалам" }} />
      <nav className="content-subnav" aria-label="Материалы института"><div className="shell"><span>Материалы:</span><a aria-current="page" href="/news">Новости</a><a href="/gallery">Фотогалерея</a></div></nav>
      <section className="section news-index" id="news-feed">
        <div className="shell">
          <div className="section-heading section-heading-editorial">
            <div><p className="eyebrow">Материалы института</p><h2>Новости IISPC</h2></div>
            <p>События, проекты и материалы института — включая публикации, перенесённые из прежней версии сайта.</p>
          </div>
          {items.length || archivedItems.length ? (
            <div className="content-grid news-grid">
              {items.map((item) => (
                <article className="content-card" key={item.id}>
                  {item.coverUrl ? <Image src={item.coverUrl} alt={item.coverAlt || item.title} width={1200} height={750} sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" /> : <div className="content-card-placeholder" aria-hidden="true">IISPC</div>}
                  <div className="content-card-body">
                    <p className="card-kicker">{formatDate(item.publishedAt)}</p>
                    <h2>{item.title}</h2>
                    <p>{item.excerpt}</p>
                    <a className="text-link" href={`/news/${item.slug}`}>Читать материал <span>→</span></a>
                  </div>
                </article>
              ))}
              {archivedItems.map((item) => (
                <article className="content-card" key={item.slug}>
                  {item.coverUrl ? <Image src={item.coverUrl} alt="" width={1200} height={750} sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" /> : <div className="content-card-placeholder" aria-hidden="true">IISPC</div>}
                  <div className="content-card-body">
                    <p className="card-kicker">{item.category} · {formatArchiveDate(item.date)}</p>
                    <h2>{item.title}</h2>
                    <p>{item.excerpt}</p>
                    <a className="text-link" href={`/news/${item.slug}`}>Читать материал <span>→</span></a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>Материалы готовятся к публикации.</p>
          )}
        </div>
      </section>
    </>
  );
}

function formatDate(value: number | null) {
  if (!value) return "Новости IISPC";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

function formatArchiveDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}
