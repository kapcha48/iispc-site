import { sectionCopy } from "../lib/editorial-content";
import { PageHero } from "../components/PageHero";
import { PersonBiography, PersonCard, PersonPortrait } from "../components/PersonCard";
import { SectionNav } from "../components/SectionNav";
import { listPeople } from "../lib/editorial-people";
import { pageMetadata } from "../lib/page-metadata";

export const metadata = pageMetadata({
  title: "О нас",
  description: "Об институте, руководство, преподавательский состав и региональные представители IISPC.",
  path: "/about",
});

export default function AboutPage() {
  const copy = sectionCopy("about");
  const leadership = listPeople("leadership");
  const faculty = listPeople("faculty");
  const representatives = listPeople("representatives");
  return (
    <>
      <PageHero
        eyebrow="О нас"
        title={copy.title}
        lead={copy.lead}
        action={{ href: "#about-institute", label: "Об институте" }}
      />
      <SectionNav items={[
        { href: "#about-institute", label: "Об институте" },
        { href: "#leadership", label: "Руководство" },
        { href: "#faculty", label: "Преподаватели" },
        { href: "#representatives", label: "Представители" },
        { href: "#partners", label: "Партнёры" },
      ]} />

      <section className="section about-mission" id="about-institute">
        <div className="shell about-grid">
          <div>
            <p className="eyebrow">Об институте</p>
            <h2>Приветствуем посетителей сайта нашего Института</h2>
            <span className="mission-signature">Александр Лазаревич Катков</span>
          </div>
          <div className="prose">
            <p>Приветствую всех посетителей сайта нашего Института — здесь вы найдёте много важного и интересного для себя! Я — Александр Лазаревич Катков, доктор медицинских наук, профессор, руководитель образовательных и научных программ Международного института социальной психотерапии и консультирования.</p>
            <p>Международный институт социальной психотерапии и консультирования (МИСПиК) — не только образовательное, но и научное учреждение. Каждая образовательная программа, представляемая Институтом, имеет твёрдую научную основу благодаря выбору квалифицированных профессионалов. Доктора и кандидаты наук — лучшие в своём деле, а участники их образовательных программ в самое короткое время становятся востребованными специалистами.</p>
            <p>Важной особенностью подготовки в МИСПиК является акцент на технологиях экстренной и экспресс-помощи, оказываемой в ходе 1–3 терапевтических или консультативных сессий. Это самый распространённый формат психотерапевтической и консультативной помощи.</p>
            <p>Длительные программы выстраиваются с акцентом на эффективную работу с универсальными мишенями. Здесь наиболее востребован формат психотерапевтических тренингов и самопсихотерапии.</p>
            <p>Образовательные программы МИСПиК предназначены не только для профессионалов, но и для нашей основной аудитории — заинтересованного населения.</p>
            <p>Высокий уровень тревоги, неопределённости, потерянности и беззащитности в агрессивной среде — всё то, с чем неуклонно сталкивается население. Мы знаем, как включать состояние уверенности, спокойствия и силы, когда это особенно нужно. Люди нуждаются не просто в здоровье, но в суперздоровье; не просто в постоянном доступе к ресурсам своей психики, но в суперресурсном доступе. Это основной предмет нашего научного интереса и профессиональной деятельности.</p>
            <p>Мы открытая организация и всегда реагируем на отклики коллег, курсантов, партнёров и клиентов. Пишите нам обо всём, что представляется действительно важным, и мы обязательно ответим.</p>
          </div>
        </div>
      </section>

      <section className="section section-soft about-people" id="leadership">
        <div className="shell">
          <div className="section-heading split-heading">
            <div><p className="eyebrow">Руководство</p><h2>Наш Институт активно растёт и развивается</h2></div>
            <a className="text-link" href="/contacts">Связаться с институтом <span>→</span></a>
          </div>
          {leadership.length ? (
            <div className="faculty-grid leadership-grid">
              {leadership.map((person, index) => <PersonCard key={person.slug} person={person} index={index} />)}
            </div>
          ) : <p>Сведения о руководстве обновляются.</p>}
        </div>
      </section>

      <section className="section about-people" id="faculty">
        <div className="shell">
          <div className="section-heading section-heading-editorial">
            <div><p className="eyebrow">Преподавательский состав</p><h2>Лучшие специалисты в своей области</h2></div>
            <p>Специалисты, которые ведут образовательные программы и развивают профессиональное сообщество IISPC.</p>
          </div>
          {faculty.length ? (
            <div className="faculty-grid">
              {faculty.map((person, index) => <PersonCard key={person.slug} person={person} index={index} />)}
            </div>
          ) : <p>Список преподавателей обновляется.</p>}
        </div>
      </section>

      <section className="section section-soft about-representatives" id="representatives">
        <div className="shell">
          <div className="section-heading section-heading-editorial">
            <div><p className="eyebrow">Региональные представители</p><h2>Представители IISPC</h2></div>
            <p>Представительства института в разных городах и странах.</p>
          </div>
          {representatives.length ? <ol className="representative-grid">
            {representatives.map((representative, index) => (
              <li key={representative.slug}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <PersonPortrait person={representative} compact />
                {representative.location ? <p>{representative.location}</p> : null}
                <h3>{representative.name}</h3>
                {representative.degree ? <p>{representative.degree}</p> : null}
                {representative.role ? <p>{representative.role}</p> : null}
                {representative.excerpt ? <small>{representative.excerpt}</small> : null}
                <PersonBiography person={representative} />
              </li>
            ))}
          </ol> : <p>Список представителей обновляется.</p>}
        </div>
      </section>

      <section className="section" id="partners">
        <div className="shell">
          <div className="section-heading section-heading-editorial">
            <div><p className="eyebrow">Сотрудничество</p><h2>Наши партнёры</h2></div>
            <div><p>Организации и профессиональные сообщества, сотрудничающие с институтом.</p><a className="text-link" href="/about/partners">Открыть список партнёров <span aria-hidden="true">→</span></a></div>
          </div>
        </div>
      </section>
    </>
  );
}
