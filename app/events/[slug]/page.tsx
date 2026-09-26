import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { getPublishedContent } from "../../lib/content-store";
import { getArchivedEvent } from "../../lib/event-archive";
import { missingPageMetadata, pageMetadata } from "../../lib/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublishedContent("event", slug);
  if (item) return pageMetadata({ title: item.title, description: item.excerpt, path: `/events/${item.slug}`, image: item.coverUrl, imageAlt: item.coverAlt || item.title });
  const archived = getArchivedEvent(slug);
  return archived
    ? pageMetadata({ title: archived.title, description: archived.excerpt, path: `/events/${archived.slug}` })
    : missingPageMetadata("Мероприятие не найдено");
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getPublishedContent("event", slug);
  if (!item) {
    const archived = getArchivedEvent(slug);
    if (!archived) notFound();
    return <article className="article-page"><header className="article-header"><div className="shell article-header-inner"><Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Мероприятия", href: "/events" }, { label: archived.title }]} /><p className="eyebrow">{archived.type}</p><h1>{archived.title}</h1><p className="article-intro">{archived.excerpt}</p><div className="article-meta"><strong>{archived.date}</strong><span>{archived.place}</span></div></div></header><div className="shell article-body archive-publication-body" dangerouslySetInnerHTML={{ __html: archived.html }} /><div className="shell article-source"><a className="text-link" href="/events">Вернуться к мероприятиям <span aria-hidden="true">→</span></a></div></article>;
  }
  return <article className="article-page"><header className="article-header"><div className="shell article-header-inner"><Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Мероприятия", href: "/events" }, { label: item.title }]} /><p className="eyebrow">{item.location || "Мероприятие IISPC"}</p><h1>{item.title}</h1><p className="article-intro">{item.excerpt}</p><div className="article-meta"><strong>{item.eventDate ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${item.eventDate}T00:00:00`)) : "Дата уточняется"}</strong><a className="button" href="/contacts?topic=events#contact-form">Уточнить участие <span>→</span></a></div></div></header>{item.coverUrl ? <div className="shell article-cover"><Image src={item.coverUrl} alt={item.coverAlt || item.title} width={1600} height={900} sizes="(max-width: 1080px) 100vw, 1080px" /></div> : null}<div className="shell article-body">{item.body.split(/\n\n+/).filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></article>;
}
