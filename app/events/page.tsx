import { PageHero } from "../components/PageHero";
import { SectionNav } from "../components/SectionNav";
import { archivedEvents } from "../data";
import { listPublishedContent } from "../lib/content-store";
import { pageMetadata } from "../lib/page-metadata";

export const metadata = pageMetadata({
  title: "Мероприятия",
  description: "Конгрессы, научные конференции, семинары и практические интенсивы IISPC.",
  path: "/events",
});

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await listPublishedContent("event", 100);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingEvents = events.filter((event) => event.eventDate && new Date(event.eventDate).getTime() >= today.getTime());
  const pastEvents = events.filter((event) => !event.eventDate || new Date(event.eventDate).getTime() < today.getTime());
  return (
    <>
      <PageHero eyebrow="Мероприятия и семинары" title="Встречи для обмена знаниями и профессиональной практикой" lead="Конгрессы, международные конференции, тематические семинары и практические интенсивы IISPC." action={{ href: "#events-calendar", label: "Перейти к календарю" }} />
      <SectionNav items={[{ href: "#events-calendar", label: "Ближайшие события" }, { href: "#events-archive", label: "Архив мероприятий" }]} />
      <section className="section events-current" id="events-calendar"><div className="shell">{upcomingEvents.length ? <><div className="section-heading section-heading-editorial"><div><p className="eyebrow">Ближайшие события</p><h2>Календарь IISPC</h2></div><p>Актуальные даты, форматы участия и программы профессиональных встреч.</p></div><div className="event-stack upcoming-stack event-ledger">{upcomingEvents.map((event) => <article key={event.id}><div className="event-meta"><span>{formatEventDate(event.eventDate)}</span><span>{event.location || "Формат уточняется"}</span></div><p>Мероприятие IISPC</p><h3>{event.title}</h3><p className="event-excerpt">{event.excerpt}</p><a className="text-link" href={`/events/${event.slug}`}>Подробнее <span>→</span></a></article>)}</div></> : <div className="empty-upcoming events-empty"><div><span className="events-empty-mark" aria-hidden="true">IISPC</span><p className="eyebrow">Ближайшие события</p><h2>Новые даты готовятся к публикации</h2></div><div><p>Мы размещаем мероприятие только после утверждения программы, формата и состава участников. Оставьте контакт — сообщим о следующей встрече.</p><a className="button button-light" href="/contacts?topic=events#contact-form">Получать анонсы <span>→</span></a></div></div>}</div></section>
      <section className="section section-soft events-archive" id="events-archive">
        <div className="shell">
          <div className="section-heading section-heading-editorial"><div><p className="eyebrow">Архив</p><h2>Прошедшие мероприятия</h2></div><p>Конференции и семинары, сформировавшие профессиональную повестку института.</p></div>
          <div className="archive-list archive-ledger">
            {pastEvents.length ? pastEvents.map((event) => (
              <article key={event.id}><time>{formatEventDate(event.eventDate)}</time><div><p>Мероприятие IISPC</p><h3>{event.title}</h3><a className="text-link" href={`/events/${event.slug}`}>Открыть архив <span aria-hidden="true">→</span></a></div><span>{event.location || "IISPC"}</span></article>
            )) : archivedEvents.map((event) => (
              <article key={event.title}><time>{event.date}</time><div><p>{event.type}</p><h3>{event.title}</h3><a className="text-link" href={`/events/${event.slug}`}>Открыть архив <span aria-hidden="true">→</span></a></div><span>{event.place}</span></article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function formatEventDate(value: string | null) {
  if (!value) return "Дата уточняется";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата уточняется";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(date);
}
