import { PageHero } from "../components/PageHero";
import { SectionNav } from "../components/SectionNav";
import { educationTypes, programs } from "../data";
import { pageMetadata } from "../lib/page-metadata";

export const metadata = pageMetadata({
  title: "Обучение",
  description: "Образовательные программы IISPC для психотерапевтов, психологов, консультантов и специалистов ментального здоровья.",
  path: "/education",
});

export default function EducationPage() {
  return (
    <>
      <PageHero eyebrow="Обучение" title="Обучающие программы" lead="Авторские курсы для психотерапевтов, психологов, консультантов и специалистов помогающих профессий." action={{ href: "#programs", label: "Перейти к программам" }} />
      <SectionNav items={[{ href: "#programs", label: "Программы" }, { href: "#education-types", label: "Виды образования" }, { href: "#education-consultation", label: "Консультация" }]} />
      <section className="section education-catalog" id="programs">
        <div className="shell">
          <div className="program-themes" aria-label="Направления обучения">
            <strong>Направления:</strong><span>Психотерапия</span><span>Психология</span><span>Консультирование</span><span>Непрерывное образование</span>
          </div>
          <div className="program-catalog">
            {programs.map((program, index) => (
              <article className="program-row" key={program.title}>
                <span className="program-row-number">0{index + 1}</span>
                <div className="program-row-title"><p className="card-kicker">{program.type}</p><h2>{program.title}</h2></div>
                <div className="program-row-details">
                  <dl><div><dt>Объём</dt><dd>{program.duration}</dd></div><div><dt>Для кого</dt><dd>{program.audience}</dd></div></dl>
                  <span className="status-dot">{program.status}</span>
                </div>
                <a className="program-row-link" href={`/education/${program.slug}`} aria-label={`Подробнее о программе ${program.title}`}><span>Подробнее</span><span aria-hidden="true">→</span></a>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-soft pathway-section" id="education-types">
        <div className="shell pathway-grid">
          <div><p className="eyebrow">Направления</p><h2>Мы даем 6 видов образования</h2></div>
          <ol className="pathway-list">
            {educationTypes.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{item}</h3></div></li>)}
          </ol>
        </div>
      </section>
      <section className="section section-soft education-tools-teaser">
        <div className="shell enrollment-inner">
          <div><p className="eyebrow">Практические материалы</p><h2>Инструменты для специалистов и родителей</h2></div>
          <div><p>Архив авторских психологических материалов IISPC, включая комплект-мотиватор Sattystep.</p><a className="button" href="/education/tools">Открыть инструменты <span>→</span></a></div>
        </div>
      </section>
      <section className="section enrollment-band education-enrollment" id="education-consultation">
        <div className="shell enrollment-inner">
          <div><p className="eyebrow">Следующий шаг</p><h2>Подберём программу под ваш профессиональный опыт</h2></div>
          <div><p>Напишите, какое у вас образование, практический опыт и интересующее направление. Команда института уточнит формат, ближайший набор и условия участия.</p><a className="button" href="/contacts">Получить консультацию <span>→</span></a></div>
        </div>
      </section>
    </>
  );
}
