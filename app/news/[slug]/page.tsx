import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { getPublishedContent } from "../../lib/content-store";
import { getArchivedNewsItem } from "../../lib/news-archive";
import { missingPageMetadata, pageMetadata } from "../../lib/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublishedContent("news", slug);
  if (item) return pageMetadata({ title: item.title, description: item.excerpt, path: `/news/${item.slug}`, image: item.coverUrl, imageAlt: item.coverAlt || item.title });
  const archived = getArchivedNewsItem(slug);
  return archived
    ? pageMetadata({ title: archived.title, description: archived.excerpt, path: `/news/${archived.slug}`, image: archived.coverUrl, imageAlt: archived.title })
    : missingPageMetadata("Новость не найдена");
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getPublishedContent("news", slug);
  if (!item) {
    const archived = getArchivedNewsItem(slug);
    if (!archived) notFound();
    return (
      <article className="article-page">
        <header className="article-header">
          <div className="shell article-header-inner">
            <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Новости", href: "/news" }, { label: archived.title }]} />
            <p className="eyebrow">{archived.category} · {formatArchiveDate(archived.date)}</p>
            <h1>{archived.title}</h1>
            <p className="article-intro">{archived.excerpt}</p>
          </div>
        </header>
        {archived.coverUrl ? <div className="shell article-cover"><Image src={archived.coverUrl} alt="" width={1600} height={900} sizes="(max-width: 1080px) 100vw, 1080px" /></div> : null}
        <div className="shell article-body archive-publication-body" dangerouslySetInnerHTML={{ __html: archived.html }} />
        <div className="shell article-source"><a className="text-link" href="/news">Вернуться к новостям <span aria-hidden="true">→</span></a></div>
      </article>
    );
  }
  return (
    <article className="article-page">
      <header className="article-header">
        <div className="shell article-header-inner">
          <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Новости", href: "/news" }, { label: item.title }]} />
          <p className="eyebrow">{item.publishedAt ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(item.publishedAt)) : "IISPC"}</p>
          <h1>{item.title}</h1>
          <p className="article-intro">{item.excerpt}</p>
        </div>
      </header>
      {item.coverUrl ? <div className="shell article-cover"><Image src={item.coverUrl} alt={item.coverAlt || item.title} width={1600} height={900} sizes="(max-width: 1080px) 100vw, 1080px" /></div> : null}
      <div className="shell article-body">
        {item.body.split(/\n\n+/).filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </article>
  );
}

function formatArchiveDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}
