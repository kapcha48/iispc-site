import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { missingPageMetadata, pageMetadata } from "../../lib/page-metadata";
import { getArchivedTravelProgram, travelArchive } from "../../lib/travel-archive";

export function generateStaticParams() {
  return travelArchive.map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const program = getArchivedTravelProgram(slug);
  return program
    ? pageMetadata({ title: program.title, description: program.excerpt, path: `/international/${program.slug}`, image: program.coverUrl, imageAlt: program.title })
    : missingPageMetadata("Программа не найдена");
}

export default async function InternationalProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = getArchivedTravelProgram(slug);
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
      {program.coverUrl ? <div className="shell article-cover"><Image src={program.coverUrl} alt="" width={1600} height={900} sizes="(max-width: 1080px) 100vw, 1080px" /></div> : null}
      <div className="shell article-body archive-publication-body" dangerouslySetInnerHTML={{ __html: program.html }} />
      <div className="shell article-source"><a className="text-link" href="/international">Вернуться к международным программам <span aria-hidden="true">→</span></a></div>
    </article>
  );
}
