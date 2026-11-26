import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { CoursePilotCover, CoursePilotEditor, CoursePilotHeader } from "../../components/CoursePilotEditor";
import EditorialMarkdown from "../../components/EditorialMarkdown";
import pilotPhotos from "../../content/course-pilot-photos.json";
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
  const pilot = Boolean(editorUrl && item.slug === "course-14937");
  const configuredEndpoint = process.env.IISPC_COURSE_EDITOR_URL ?? "";
  const endpoint = /^https:\/\/iispc-course-editor\.[a-z0-9-]+\.workers\.dev$/.test(configuredEndpoint) ? configuredEndpoint : undefined;

  const article = (
    <article className="article-page source-archive-detail">
      <header className="article-header">
        <div className="shell article-header-inner">
          <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Архив", href: "/archive" }, { label: item.title }]} />
          <p className="eyebrow">{item.kindLabel} · архив IISPC</p>
          {pilot ? <CoursePilotHeader /> : <>
            <h1>{item.title}</h1>
            <p className="article-intro">{item.excerpt}</p>
          </>}
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
      {pilot ? <CoursePilotCover /> : item.coverUrl ? <div className="shell article-cover"><Image src={item.coverUrl} alt={item.coverAlt} width={1600} height={900} sizes="(max-width: 1080px) 100vw, 1080px" unoptimized /></div> : null}
      {item.editorialBody === undefined
        ? <div className="shell article-body archive-publication-body" dangerouslySetInnerHTML={{ __html: html }} />
        : <div className="shell article-body archive-publication-body"><EditorialMarkdown source={item.editorialBody} /></div>}
      <div className="shell article-source"><a className="text-link" href="/archive">Вернуться ко всему архиву <span aria-hidden="true">→</span></a></div>
    </article>
  );
  return pilot ? <CoursePilotEditor endpoint={endpoint} photos={pilotPhotos} initial={{ title: item.title, excerpt: item.excerpt, cover: item.coverUrl ?? "", coverAlt: item.coverAlt }}>{article}</CoursePilotEditor> : article;
}
