import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import EditorialMarkdown from "../../components/EditorialMarkdown";
import { getProgram, listPrograms } from "../../lib/editorial-programs";
import { missingPageMetadata, pageMetadata } from "../../lib/page-metadata";

export function generateStaticParams() {
  return listPrograms().map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const program = getProgram(slug);
  return program
    ? pageMetadata({ title: program.title, description: program.summary, path: `/education/${program.slug}`, image: program.coverUrl, imageAlt: program.coverAlt || program.title })
    : missingPageMetadata("Программа не найдена");
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = getProgram(slug);
  if (!program) notFound();
  const contactHref = `/contacts?program=${encodeURIComponent(program.title)}#contact-form`;
  const facts = [
    ["Объём", program.duration],
    ["Для кого", program.audience],
    ["Формат", program.format],
    ["Документ", program.document],
  ].filter(([, value]) => value);
  return (
    <>
      <section className="program-hero">
        <div className="shell">
          <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Обучение", href: "/education" }, { label: program.title }]} />
          <p className="eyebrow">{program.type}</p>
          <h1>{program.title}</h1>
          {program.summary ? <p className="program-hero-lead">{program.summary}</p> : null}
          <div className="program-hero-actions">
            <a className="button" href={program.registrationUrl || contactHref}>{program.registrationUrl ? "Записаться на программу" : "Узнать о программе"}</a>
            {program.status ? <span className="status-dot">{program.status}</span> : null}
          </div>
        </div>
      </section>
      {program.coverUrl ? <div className="shell article-cover">
        <Image src={program.coverUrl} alt={program.coverAlt || program.title} width={1600} height={900} sizes="(max-width: 1080px) 100vw, 1080px" unoptimized />
      </div> : null}
      {facts.length || program.attachmentUrl || program.outcomes.length ? <section className="section">
        <div className="shell program-details-grid">
          {facts.length || program.attachmentUrl ? <dl className="program-facts">
            {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            {program.attachmentUrl ? <div><dt>Файл</dt><dd><a className="text-link" href={program.attachmentUrl}>Документ программы</a></dd></div> : null}
          </dl> : null}
          {program.outcomes.length ? <div>
            <p className="eyebrow">Результат обучения</p>
            <h2>Что развивает программа</h2>
            <ul className="outcome-list">{program.outcomes.map((item) => <li key={item}>{item}</li>)}</ul>
          </div> : null}
        </div>
      </section> : null}
      {program.modules.length ? <section className="section section-soft">
        <div className="shell pathway-grid">
          <div><p className="eyebrow">Структура</p><h2>Основные этапы подготовки</h2><p className="muted-copy">Точная последовательность, расписание и состав модулей подтверждаются перед началом нового набора.</p></div>
          <ol className="pathway-list">{program.modules.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{item}</h3></div></li>)}</ol>
        </div>
      </section> : null}
      {program.body || program.admission ? <section className="shell article-body archive-publication-body">
        {program.body ? <>
          <h2>Описание программы</h2>
          <EditorialMarkdown source={program.body} />
        </> : null}
        {program.admission ? <>
          <h2>Как поступить</h2>
          <EditorialMarkdown source={program.admission} />
        </> : null}
        {program.archiveHref ? <a className="text-link" href={program.archiveHref}>Посмотреть исходные материалы в архиве IISPC</a> : null}
      </section> : null}
      <section className="section enrollment-band"><div className="shell enrollment-inner"><div><p className="eyebrow">Консультация</p><h2>Уточните условия ближайшего набора</h2></div><div><p>Расскажите о вашем образовании, опыте и профессиональных задачах. Команда института поможет понять, подходит ли вам эта программа.</p><a className="button" href={contactHref}>Задать вопрос о программе</a></div></div></section>
    </>
  );
}
