import type { Metadata } from "next";

export const metadata: Metadata = { title: "Админка сайта", description: "Управление материалами сайта IISPC.", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <section className="admin-gate">
      <div>
        <p className="eyebrow">Управление сайтом</p>
        <h1>Редактор IISPC</h1>
        <p>Меняйте программы, страницы и карточки сотрудников через Pages CMS. Для входа используйте свой аккаунт GitHub.</p>
        <a className="button" href="https://app.pagescms.org/kapcha48/iispc-site/preview">Открыть редактор</a>
        <ol className="admin-workflow">
          <li>Откройте материал, внесите правки и нажмите <strong>Save</strong>.</li>
          <li>Дождитесь сборки и <a className="text-link" href="https://kapcha48.github.io/iispc-site/preview/">откройте предпросмотр</a>. Для показа материала в предпросмотре выберите статус «Опубликовано» в редакторе.</li>
          <li>Вернитесь в редактор и в разделе <strong>Actions</strong> выберите <strong>Опубликовать проверенные правки</strong>. Сайт обновится автоматически после сборки.</li>
        </ol>
        <p className="admin-gate-note">Репозиторий и ссылка на предпросмотр публичные. Загружайте сюда только материалы для открытого сайта.</p>
      </div>
    </section>
  );
}
