import type { Metadata } from "next";
export const metadata: Metadata = { title: "Админка сайта", description: "Управление материалами сайта IISPC.", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <section className="admin-gate"><div><p className="eyebrow">Управление сайтом</p><h1>Админка IISPC</h1><p>Новости, мероприятия, программы, публикации, страницы и фотографии хранятся в защищённом репозитории IISPC.</p><a className="button" href="https://app.pagescms.org" target="_blank" rel="noreferrer">Открыть админку <span aria-hidden="true">→</span></a><p className="admin-gate-note">Вход выполняется через GitHub. Доступ предоставляется только владельцам репозитория.</p></div></section>;
}
