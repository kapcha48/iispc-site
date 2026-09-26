"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="status-page">
      <div className="shell status-page-inner">
        <p className="eyebrow">Что-то пошло не так</p>
        <h1>Страница временно недоступна</h1>
        <p>Повторите попытку. Если ошибка останется, сообщите команде института.</p>
        <div className="status-page-actions">
          <button className="button" type="button" onClick={reset}>Попробовать снова</button>
          <a className="text-link" href="/contacts">Связаться с IISPC</a>
        </div>
      </div>
    </section>
  );
}
