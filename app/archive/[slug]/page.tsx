import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import EditorialMarkdown from "../../components/EditorialMarkdown";
import { getEditorialArchiveItem, listEditorialArchiveItems } from "../../lib/editorial-pages";
import { missingPageMetadata, pageMetadata } from "../../lib/page-metadata";

export function generateStaticParams() {
  return listEditorialArchiveItems().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = getEditorialArchiveItem(slug);
  return item
    ? pageMetadata({ title: item.title, description: item.excerpt, path: `/archive/${item.slug}`, image: item.coverUrl, imageAlt: item.coverAlt || item.title })
    : missingPageMetadata("Архивный материал не найден");
}

export default async function SourceArchiveDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getEditorialArchiveItem(slug);
  if (!item) notFound();
  const html = item.html || '<p class="archive-empty-note">В прежней версии сайта эта страница была опубликована без основного текста.</p>';
  const editorUrl = process.env.IISPC_PREVIEW === "1" && item.kind === "course" && item.editorialPath
    ? `https://app.pagescms.org/kapcha48/iispc-site/preview/collection/programs/edit/${encodeURIComponent(item.editorialPath)}`
    : null;

  return (
    <article className="article-page source-archive-detail">
      <header className="article-header">
        <div className="shell article-header-inner">
          <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Архив", href: "/archive" }, { label: item.title }]} />
          <p className="eyebrow">{item.kindLabel} · архив IISPC</p>
          <h1>{item.title}</h1>
          <p className="article-intro">{item.excerpt}</p>
          {editorUrl && (
            <div className="archive-course-editor">
              <a className="button button-small" href={editorUrl} target="_blank" rel="noopener noreferrer" aria-describedby="course-editor-hint">
                Редактировать этот курс
              </a>
              <p id="course-editor-hint">Админка откроется в новой вкладке. После сохранения дождитесь сборки и обновите эту страницу. Публикация на сайте — отдельно.</p>
            </div>
          )}
        </div>
      </header>
      {item.coverUrl ? <div className="shell article-cover"><Image src={item.coverUrl} alt={item.coverAlt} width={1600} height={900} sizes="(max-width: 1080px) 100vw, 1080px" unoptimized /></div> : null}
      {item.editorialBody === undefined
        ? <div className="shell article-body archive-publication-body" dangerouslySetInnerHTML={{ __html: html }} />
        : <div className="shell article-body archive-publication-body"><EditorialMarkdown source={item.editorialBody} /></div>}
      <div className="shell article-source"><a className="text-link" href="/archive">Вернуться ко всему архиву <span aria-hidden="true">→</span></a></div>
    </article>
  );
}
