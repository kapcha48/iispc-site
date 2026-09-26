import Image from "next/image";
import { archivedEvents, faculty, programs, publications } from "./data";
import { ParticleLogo } from "./components/ParticleLogo";
import { listPublishedContent } from "./lib/content-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const latestNews = await listPublishedContent("news", 3);
  return (
    <>
      <section className="origin-hero">
        <div className="shell origin-hero-inner">
          <div className="origin-hero-copy">
            <h1 className="origin-kicker">Международный институт социальной психотерапии и консультирования</h1>
            <div className="origin-actions">
              <a className="origin-button origin-button-light" href="/education">Смотреть программы <span>→</span></a>
              <a className="origin-button origin-button-ghost" href="/events"><span className="live-dot" aria-hidden="true" /> Ближайшие мероприятия</a>
            </div>
          </div>

          <div className="origin-visual" aria-label="Основные направления IISPC">
            <div className="origin-scan origin-scan-one" aria-hidden="true" />
            <div className="origin-scan origin-scan-two" aria-hidden="true" />
            <div className="origin-symbol-wrap">
              <div className="origin-symbol-halo" aria-hidden="true" />
              <ParticleLogo />
            </div>
            <a className="origin-label origin-label-education" href="/education"><i aria-hidden="true" />Обучение</a>
            <a className="origin-label origin-label-science" href="/science"><i aria-hidden="true" />Научная работа</a>
            <a className="origin-label origin-label-world" href="/international"><i aria-hidden="true" />Международные проекты</a>
          </div>
        </div>

        <div className="origin-trust">
          <div className="shell origin-trust-inner">
            <p>Основа профессиональной подготовки</p>
            <div><strong>01</strong><span>научно обоснованные подходы</span></div>
            <div><strong>02</strong><span>практика и супервизия</span></div>
            <div><strong>03</strong><span>международные связи</span></div>
            <div><strong>04</strong><span>непрерывное развитие</span></div>
          </div>
        </div>
      </section>

      {latestNews.length ? (
        <section className="section">
          <div className="shell">
            <div className="section-heading split-heading"><div><p className="eyebrow">Актуальное</p><h2>Новости института</h2></div><a className="text-link" href="/news">Все новости <span>→</span></a></div>
            <div className="content-grid content-grid-compact">{latestNews.map((item) => <article className="content-card" key={item.id}>{item.coverUrl ? <Image src={item.coverUrl} alt="" width={1200} height={750} sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" unoptimized /> : <div className="content-card-placeholder" aria-hidden="true">IISPC</div>}<div className="content-card-body"><p className="card-kicker">Актуальное</p><h3>{item.title}</h3><p>{item.excerpt}</p><a className="text-link" href={`/news/${item.slug}`}>Читать <span>→</span></a></div></article>)}</div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="shell">
          <div className="section-heading split-heading">
            <div><p className="eyebrow">Три опоры института</p><h2>Учиться. Исследовать. Сотрудничать.</h2></div>
            <p>Профессиональная среда, в которой образование продолжается практикой, исследованием и сотрудничеством.</p>
          </div>
          <div className="priority-grid">
            <a className="priority-card priority-primary" href="/education">
              <span className="card-index">01</span><h3>Обучение</h3>
              <p>Долгосрочные программы, тематические циклы, непрерывная подготовка и супервизия.</p>
              <span className="card-link">Смотреть программы →</span>
            </a>
            <a className="priority-card" href="/events">
              <span className="card-index">02</span><h3>Мероприятия</h3>
              <p>Конгрессы, семинары, конференции и практические интенсивы.</p>
              <span className="card-link">Календарь →</span>
            </a>
            <a className="priority-card" href="/science">
              <span className="card-index">03</span><h3>Наука</h3>
              <p>Исследовательские проекты, публикации и профессиональная научная дискуссия.</p>
              <span className="card-link">Исследования и публикации →</span>
            </a>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell">
          <div className="section-heading split-heading">
            <div><p className="eyebrow">Образовательные траектории</p><h2>Программы для профессионального роста</h2></div>
            <a className="text-link" href="/education">Все программы <span>→</span></a>
          </div>
          <div className="program-grid">
            {programs.slice(0, 3).map((program) => (
              <article className="program-card" key={program.title}>
                <p className="card-kicker">{program.type}</p>
                <h3>{program.title}</h3>
                <dl><div><dt>Объём</dt><dd>{program.duration}</dd></div><div><dt>Для кого</dt><dd>{program.audience}</dd></div></dl>
                <span className="status-dot">{program.status}</span>
                <a className="program-card-cta" href={`/education/${program.slug}`} aria-label={`Подробнее о программе ${program.title}`}>Подробнее о программе →</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell event-feature">
          <div>
            <p className="eyebrow">Архив мероприятий</p>
            <h2>Конференции и семинары для обмена опытом</h2>
            <p>Мы публикуем только подтверждённые даты. Календарь обновляется после утверждения программы, а прошедшие события доступны в архиве.</p>
            <a className="button" href="/events">Смотреть мероприятия <span>→</span></a>
          </div>
          <div className="event-stack">
            {archivedEvents.slice(0, 2).map((event) => (
              <article key={event.title}>
                <div className="event-meta"><span>{event.date}</span><span>{event.place}</span></div>
                <p>{event.type}</p><h3>{event.title}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-dark science-home">
        <div className="shell">
          <div className="science-home-intro">
            <div>
              <p className="eyebrow">Научная деятельность</p>
              <h2>Знания, которые проходят проверку исследованием</h2>
            </div>
            <div className="science-home-summary">
              <p>В основе образовательных программ IISPC — современная методология, профессиональная дискуссия и публикационная деятельность.</p>
              <a className="button button-light" href="/science">Исследования и публикации <span>→</span></a>
            </div>
          </div>
          <ol className="publication-list science-home-publications">
            {publications.slice(0, 4).map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}
          </ol>
        </div>
      </section>

      <section className="section international-band">
        <div className="shell international-inner">
          <p className="eyebrow">Международная деятельность</p>
          <h2>Совместные проекты и профессиональные связи разных стран</h2>
          <p>Представители, партнёры, научно-практические экспедиции и образовательные инициативы, объединяющие специалистов разных регионов.</p>
          <a className="text-link" href="/international">Международные проекты <span>↗</span></a>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell">
          <div className="section-heading split-heading"><div><p className="eyebrow">Руководство и эксперты</p><h2>Опыт, который поддерживает обучение</h2></div><a className="text-link" href="/about">Познакомиться с институтом <span>→</span></a></div>
          <div className="faculty-grid">{faculty.map((person, index) => <article key={person.name}><div className="faculty-monogram">{person.name.split(" ").slice(0,2).map(x=>x[0]).join("")}</div><span>0{index+1}</span><h3>{person.name}</h3>{person.degree ? <p>{person.degree}</p> : null}<small>{person.role}</small></article>)}</div>
        </div>
      </section>
    </>
  );
}
