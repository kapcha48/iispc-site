"use client";

import { useRef, useState } from "react";

type FormValues = {
  topic: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
  website: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const topicLabels: Record<string, string> = {
  education: "Обучение и выбор программы",
  events: "Мероприятия и семинары",
  science: "Научные материалы",
  international: "Международное сотрудничество",
  other: "Другой вопрос",
};

export function InquiryForm({ initialTopic = "education", initialMessage = "" }: { initialTopic?: string; initialMessage?: string }) {
  const initialValues: FormValues = {
    topic: topicLabels[initialTopic] ? initialTopic : "education",
    name: "",
    email: "",
    phone: "",
    message: initialMessage,
    consent: false,
    website: "",
  };
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const update = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const next: FieldErrors = {};
    if (values.name.trim().length < 2) next.name = "Укажите ваше имя";
    if (!values.email.trim() && !values.phone.trim()) {
      next.email = "Укажите электронную почту или телефон";
      next.phone = "Укажите электронную почту или телефон";
    }
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = "Проверьте адрес электронной почты";
    if (values.phone && !/^[+\d\s()\-–]{6,40}$/.test(values.phone.trim())) next.phone = "Проверьте номер телефона";
    if (values.message.trim().length < 10) next.message = "Опишите вопрос хотя бы в 10 символах";
    if (!values.consent) next.consent = "Подтвердите согласие, чтобы отправить обращение";
    return next;
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setStatus("error");
      setServerMessage("Проверьте отмеченные поля");
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }

    setStatus("sending");
    setServerMessage("");
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Не удалось отправить обращение");
      setStatus("success");
      setServerMessage("");
    } catch (error) {
      setStatus("error");
      setServerMessage(error instanceof Error ? error.message : "Не удалось отправить обращение");
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
    }
  }

  if (status === "success") {
    return (
      <div className="inquiry-success" role="status">
        <span aria-hidden="true">✓</span>
        <p className="eyebrow">Обращение отправлено</p>
        <h2>Спасибо, мы получили ваше сообщение</h2>
        <p>Команда IISPC ознакомится с вопросом и ответит по указанному контакту.</p>
        <button className="text-link" type="button" onClick={() => { setValues(initialValues); setStatus("idle"); }}>Отправить ещё одно обращение</button>
      </div>
    );
  }

  const summaryErrors = Object.entries(errors).filter(([, message], index, all) => (
    Boolean(message) && all.findIndex(([, candidate]) => candidate === message) === index
  ));

  return (
    <form className="inquiry-form" onSubmit={submit} noValidate>
      <div className="inquiry-form-heading">
        <p className="eyebrow">Написать в IISPC</p>
        <h2>Расскажите, чем мы можем помочь</h2>
        <p>Ответ придёт на электронную почту или по указанному телефону.</p>
      </div>

      {status === "error" ? (
        <div className="form-error-summary" role="alert" tabIndex={-1} ref={errorSummaryRef}>
          <strong>{serverMessage || "Проверьте заполнение формы"}</strong>
          {summaryErrors.length ? <ul>{summaryErrors.map(([field, message]) => <li key={field}><a href={`#inquiry-${field}`}>{message}</a></li>)}</ul> : null}
        </div>
      ) : null}

      <div className="inquiry-fields">
        <label className="field-full" htmlFor="inquiry-topic">Тема обращения
          <select id="inquiry-topic" value={values.topic} onChange={(event) => update("topic", event.target.value)}>
            {Object.entries(topicLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>

        <label htmlFor="inquiry-name">Ваше имя <span aria-hidden="true">*</span>
          <input id="inquiry-name" autoComplete="name" value={values.name} onChange={(event) => update("name", event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "inquiry-name-error" : undefined} />
          {errors.name ? <small className="field-error" id="inquiry-name-error">{errors.name}</small> : null}
        </label>

        <label htmlFor="inquiry-email">Электронная почта
          <input id="inquiry-email" type="email" inputMode="email" autoComplete="email" value={values.email} onChange={(event) => update("email", event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "inquiry-email-error" : "inquiry-contact-hint"} />
          {errors.email ? <small className="field-error" id="inquiry-email-error">{errors.email}</small> : null}
        </label>

        <label htmlFor="inquiry-phone">Телефон
          <input id="inquiry-phone" type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={(event) => update("phone", event.target.value)} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "inquiry-phone-error" : "inquiry-contact-hint"} />
          {errors.phone ? <small className="field-error" id="inquiry-phone-error">{errors.phone}</small> : null}
        </label>

        <p className="field-hint field-full" id="inquiry-contact-hint">Достаточно указать один удобный способ связи.</p>

        <label className="field-full" htmlFor="inquiry-message">Сообщение <span aria-hidden="true">*</span>
          <textarea id="inquiry-message" rows={6} maxLength={2000} value={values.message} onChange={(event) => update("message", event.target.value)} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "inquiry-message-error" : "inquiry-message-hint"} />
          <span className="field-meta" id="inquiry-message-hint">Кратко опишите программу, мероприятие или формат сотрудничества.</span>
          {errors.message ? <small className="field-error" id="inquiry-message-error">{errors.message}</small> : null}
        </label>

        <label className="form-trap" aria-hidden="true" htmlFor="inquiry-website">Не заполняйте это поле
          <input id="inquiry-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(event) => update("website", event.target.value)} />
        </label>

        <label className="consent-field field-full" htmlFor="inquiry-consent">
          <input id="inquiry-consent" type="checkbox" checked={values.consent} onChange={(event) => update("consent", event.target.checked)} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? "inquiry-consent-error" : undefined} />
          <span>Согласен(на) на обработку указанных данных для ответа на обращение. <a href="/privacy">Подробнее</a>.</span>
          {errors.consent ? <small className="field-error" id="inquiry-consent-error">{errors.consent}</small> : null}
        </label>
      </div>

      <button className="button inquiry-submit" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Отправляем…" : "Отправить обращение"} <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
