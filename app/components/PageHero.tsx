import { Breadcrumbs } from "./Breadcrumbs";

const sectionNumbers: Record<string, string> = {
  "Обучение": "01",
  "Мероприятия и семинары": "02",
  "Наука": "03",
  "Международная деятельность": "04",
  "Новости": "05",
  "О нас": "06",
  "Фотогалерея": "07",
  "Контакты": "08",
};

export function PageHero({
  eyebrow,
  title,
  lead,
  backLabel,
  action,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  backLabel?: string;
  action?: { href: string; label: string };
}) {
  const sectionNumber = sectionNumbers[eyebrow] ?? "IISPC";

  return (
    <section className="page-hero">
      <div className="shell">
        <div className="page-hero-topline">
          <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: backLabel ?? eyebrow }]} />
          <span className="page-hero-number" aria-hidden="true">{sectionNumber}</span>
        </div>
        <div className="page-hero-grid">
          <div className="page-hero-title">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          </div>
          <div className="page-hero-aside">
            <span className="page-hero-rule" aria-hidden="true" />
            <p className="page-lead">{lead}</p>
            {action ? <a className="page-hero-action" href={action.href}>{action.label} <span aria-hidden="true">↓</span></a> : null}
            <small>Международный институт социальной психотерапии и консультирования</small>
          </div>
        </div>
      </div>
    </section>
  );
}
