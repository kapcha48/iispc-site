import { PageHero } from "../components/PageHero";
import { InquiryForm } from "../components/InquiryForm";
import { SectionNav } from "../components/SectionNav";
import { pageMetadata } from "../lib/page-metadata";

export const metadata = pageMetadata({
  title: "Контакты",
  description: "Связаться с IISPC по вопросам обучения, мероприятий, науки и международного сотрудничества.",
  path: "/contacts",
});

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ topic?: string; program?: string }> }) {
  const { topic, program } = await searchParams;
  const initialTopic = program ? "education" : topic;
  const initialMessage = program ? `Меня интересует программа «${program.slice(0, 180)}». Хотелось бы уточнить условия и ближайшие даты.` : "";
  return (
    <>
      <PageHero eyebrow="Контакты" title="Задайте вопрос об обучении или сотрудничестве" lead="Команда института поможет уточнить программу, ближайший набор, участие в мероприятии или возможный формат партнёрства." />
      <SectionNav items={[{ href: "#contact-form", label: "Отправить обращение" }, { href: "#contact-options", label: "Другие способы связи" }]} />
      <section className="section contact-form-section" id="contact-form">
        <div className="shell contact-form-layout">
          <div className="contact-form-aside">
            <p className="eyebrow">Прямая связь</p>
            <h2>Один вопрос — один понятный следующий шаг</h2>
            <p>Выберите тему и оставьте удобный контакт. Обращение сохранится в закрытой панели института и не будет опубликовано.</p>
            <ol>
              <li><span>01</span>Вы описываете вопрос</li>
              <li><span>02</span>Команда уточняет детали</li>
              <li><span>03</span>Вы получаете ответ по выбранному контакту</li>
            </ol>
          </div>
          <InquiryForm initialTopic={initialTopic} initialMessage={initialMessage} />
        </div>
      </section>
      <section className="section section-soft" id="contact-options">
        <div className="shell contact-grid">
          <a href="tel:+77073330372"><span>Телефон</span><strong>+7 707 333 03 72</strong><small>Позвонить →</small></a>
          <a href="mailto:iispc2022@gmail.com"><span>Электронная почта</span><strong>iispc2022@gmail.com</strong><small>Написать →</small></a>
          <a href="https://wa.me/77073330372" target="_blank" rel="noreferrer"><span>Мессенджер</span><strong>WhatsApp</strong><small>Открыть диалог →</small></a>
        </div>
      </section>
    </>
  );
}
