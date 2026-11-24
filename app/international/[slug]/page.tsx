import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import EditorialMarkdown from "../../components/EditorialMarkdown";
import { getEditorialTravelProgram, listEditorialTravelPrograms } from "../../lib/editorial-pages";
import { missingPageMetadata, pageMetadata } from "../../lib/page-metadata";

export function generateStaticParams() {
  return listEditorialTravelPrograms().map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const program = getEditorialTravelProgram(slug);
  return program
    ? pageMetadata({ title: program.title, description: program.excerpt, path: `/international/${program.slug}`, image: program.coverUrl, imageAlt: program.coverAlt || program.title })
    : missingPageMetadata("Программа не найдена");
}

export default async function InternationalProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = getEditorialTravelProgram(slug);
  if (!program) notFound();

  return (
    <article className="article-page">
      <header className="article-header">
        <div className="shell article-header-inner">
          <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Международные проекты", href: "/international" }, { label: program.place }]} />
          <p className="eyebrow">Архивная программа · {program.date}</p>
          <h1>{program.title}</h1>
          <p className="article-intro">{program.excerpt}</p>
          <div className="article-meta"><strong>{program.place}</strong><span>Программа завершена</span></div>
        </div>
      </header>
      {program.coverUrl ? <div className="shell article-cover"><Image src={program.coverUrl} alt={program.coverAlt} width={1600} height={900} sizes="(max-width: 1080px) 100vw, 1080px" unoptimized /></div> : null}
      {program.editorialBody === undefined
        ? <div className="shell article-body archive-publication-body" dangerouslySetInnerHTML={{ __html: program.html }} />
        : <div className="shell article-body archive-publication-body"><EditorialMarkdown source={program.editorialBody} /></div>}
      <div className="shell article-source"><a className="text-link" href="/international">Вернуться к международным программам <span aria-hidden="true">→</span></a></div>
    </article>
  );
}
