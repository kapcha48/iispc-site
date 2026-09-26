import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { programs } from "../../data";
import { missingPageMetadata, pageMetadata } from "../../lib/page-metadata";

export function generateStaticParams() {
  return programs.map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const program = programs.find((item) => item.slug === slug);
  return program
    ? pageMetadata({ title: program.title, description: program.summary, path: `/education/${program.slug}`, image: null })
    : missingPageMetadata("Программа не найдена");
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = programs.find((item) => item.slug === slug);
  if (!program) notFound();
  return (
    <>
      <section className="program-hero">
        <div className="shell">
          <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Обучение", href: "/education" }, { label: program.title }]} />
          <p className="eyebrow">{program.type}</p>
          <h1>{program.title}</h1>
          <p className="program-hero-lead">{program.summary}</p>
          <div className="program-hero-actions"><a className="button" href={`/contacts?program=${encodeURIComponent(program.title)}`}>Узнать о программе <span>→</span></a><span className="status-dot">{program.status}</span></div>
        </div>
      </section>
      <section className="section">
        <div className="shell program-details-grid">
          <dl className="program-facts">
            <div><dt>Объём</dt><dd>{program.duration}</dd></div>
            <div><dt>Для кого</dt><dd>{program.audience}</dd></div>
            {program.format ? <div><dt>Формат</dt><dd>{program.format}</dd></div> : null}
            {program.document ? <div><dt>Документ</dt><dd>{program.document}</dd></div> : null}
          </dl>
          {program.outcomes.length ? <div>
            <p className="eyebrow">Результат обучения</p>
            <h2>Что развивает программа</h2>
            <ul className="outcome-list">{program.outcomes.map((item) => <li key={item}>{item}</li>)}</ul>
          </div> : null}
        </div>
      </section>
      {program.modules.length ? <section className="section section-soft">
        <div className="shell pathway-grid">
          <div><p className="eyebrow">Структура</p><h2>Основные этапы подготовки</h2><p className="muted-copy">Точная последовательность, расписание и состав модулей подтверждаются перед началом нового набора.</p></div>
          <ol className="pathway-list">{program.modules.map((item, index) => <li key={item}><span>0{index + 1}</span><div><h3>{item}</h3></div></li>)}</ol>
        </div>
      </section> : null}
      <section className="section enrollment-band"><div className="shell enrollment-inner"><div><p className="eyebrow">Консультация</p><h2>Уточните условия ближайшего набора</h2></div><div><p>Расскажите о вашем образовании, опыте и профессиональных задачах. Команда института поможет понять, подходит ли вам эта программа.</p><a className="button" href={`/contacts?program=${encodeURIComponent(program.title)}`}>Задать вопрос о программе <span>→</span></a></div></div></section>
    </>
  );
}
