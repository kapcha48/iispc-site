import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { getPublishedContent } from "../../../lib/content-store";
import { missingPageMetadata, pageMetadata } from "../../../lib/page-metadata";
import { getArchivedPublication } from "../../../lib/publication-archive";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublishedContent("publication", slug);
  if (item) return pageMetadata({ title: item.title, description: item.excerpt, path: `/science/publications/${item.slug}`, image: item.coverUrl, imageAlt: item.coverAlt || item.title });
  const archived = getArchivedPublication(slug);
  return archived
    ? pageMetadata({ title: archived.title, description: archived.excerpt, path: `/science/publications/${archived.slug}` })
    : missingPageMetadata("Публикация не найдена");
}

export default async function PublicationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getPublishedContent("publication", slug);
  if (!item) {
    const archived = getArchivedPublication(slug);
    if (!archived) notFound();
    return <article className="article-page"><header className="article-header"><div className="shell article-header-inner"><Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Наука", href: "/science" }, { label: archived.title }]} /><p className="eyebrow">Архив научных публикаций</p><h1>{archived.title}</h1><p className="article-intro">{archived.excerpt}</p></div></header><div className="shell article-body archive-publication-body" dangerouslySetInnerHTML={{ __html: archived.html }} /><div className="shell article-source"><a className="text-link" href="/science">Вернуться к научной деятельности <span aria-hidden="true">→</span></a></div></article>;
  }
  return <article className="article-page"><header className="article-header"><div className="shell article-header-inner"><Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Наука", href: "/science" }, { label: item.title }]} /><p className="eyebrow">Научная публикация</p><h1>{item.title}</h1><p className="article-intro">{item.excerpt}</p>{item.author ? <p className="article-author">{item.author}</p> : null}</div></header>{item.coverUrl ? <div className="shell article-cover"><Image src={item.coverUrl} alt={item.coverAlt || item.title} width={1600} height={900} sizes="(max-width: 1080px) 100vw, 1080px" /></div> : null}<div className="shell article-body">{item.body.split(/\n\n+/).filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{item.attachmentUrl ? <a className="button" href={item.attachmentUrl}>Скачать PDF <span aria-hidden="true">↓</span></a> : null}</div></article>;
}
