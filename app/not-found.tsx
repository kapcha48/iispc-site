export default function NotFound() {
  return (
    <section className="status-page">
      <div className="shell status-page-inner">
        <p className="eyebrow">Ошибка 404</p>
        <h1>Такой страницы нет</h1>
        <p>Возможно, адрес изменился или материал ещё не опубликован.</p>
        <div className="status-page-actions">
          <a className="button" href="/">На главную <span aria-hidden="true">→</span></a>
          <a className="text-link" href="/contacts">Задать вопрос</a>
        </div>
      </div>
    </section>
  );
}
