import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { missingPageMetadata, pageMetadata } from "../../lib/page-metadata";
import { getSourceArchiveItem, sourceArchiveItems } from "../../lib/source-archive";

export function generateStaticParams() {
  return sourceArchiveItems.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = getSourceArchiveItem(slug);
  return item
    ? pageMetadata({ title: item.title, description: item.excerpt, path: `/archive/${item.slug}`, image: item.coverUrl, imageAlt: item.title })
    : missingPageMetadata("Архивный материал не найден");
}

export default async function SourceArchiveDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getSourceArchiveItem(slug);
  if (!item) notFound();
  const html = item.html || '<p class="archive-empty-note">В прежней версии сайта эта страница была опубликована без основного текста.</p>';

  return (
    <article className="article-page source-archive-detail">
      <header className="article-header">
        <div className="shell article-header-inner">
          <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Архив", href: "/archive" }, { label: item.title }]} />
          <p className="eyebrow">{item.kindLabel} · архив IISPC</p>
          <h1>{item.title}</h1>
          <p className="article-intro">{item.excerpt}</p>
        </div>
      </header>
      {item.coverUrl ? <div className="shell article-cover"><Image src={item.coverUrl} alt="" width={1600} height={900} sizes="(max-width: 1080px) 100vw, 1080px" unoptimized /></div> : null}
      <div className="shell article-body archive-publication-body" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="shell article-source"><a className="text-link" href="/archive">Вернуться ко всему архиву <span aria-hidden="true">→</span></a></div>
    </article>
  );
}
