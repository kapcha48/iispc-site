import { sectionCopy } from "../lib/editorial-content";
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
  const copy = sectionCopy("contacts");
  const staticHost = process.env.IISPC_STATIC_HOST === "1";
  const { topic, program } = await searchParams;
  const initialTopic = program ? "education" : topic;
  const initialMessage = program ? `Меня интересует программа «${program.slice(0, 180)}». Хотелось бы уточнить условия и ближайшие даты.` : "";
  return (
    <>
      <PageHero eyebrow="Контакты" title={copy.title} editPath={copy.editPath} lead={copy.lead} />
      <SectionNav items={[{ href: "#contact-form", label: "Отправить обращение" }, { href: "#contact-options", label: "Другие способы связи" }]} />
      <section className="section contact-form-section" id="contact-form">
        <div className="shell contact-form-layout">
          <div className="contact-form-aside">
            <p className="eyebrow">Прямая связь</p>
            <h2>Один вопрос — один понятный следующий шаг</h2>
            <p>{staticHost ? "Напишите нам по электронной почте или в WhatsApp. В сообщении укажите тему и удобный способ связи." : "Выберите тему и оставьте удобный контакт. Обращение сохранится в закрытой панели института и не будет опубликовано."}</p>
            <ol>
              <li><span>01</span>Вы описываете вопрос</li>
              <li><span>02</span>Команда уточняет детали</li>
              <li><span>03</span>Вы получаете ответ по выбранному контакту</li>
            </ol>
          </div>
          {staticHost ? (
            <div className="inquiry-form">
              <h2>Написать в IISPC</h2>
              <p>Выберите удобный способ связи.</p>
              <div className="button-row">
                <a className="button" href="mailto:iispc2022@gmail.com">Написать на почту</a>
                <a className="text-link" href="https://wa.me/77073330372" target="_blank" rel="noreferrer">Написать в WhatsApp</a>
              </div>
            </div>
          ) : <InquiryForm initialTopic={initialTopic} initialMessage={initialMessage} />}
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
