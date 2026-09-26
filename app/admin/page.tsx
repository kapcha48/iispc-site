import type { Metadata } from "next";
import { requireChatGPTUser, chatGPTSignOutPath } from "../chatgpt-auth";
import { isAdminUser, listAllContent, listInquiries, listMedia } from "../lib/content-store";
import { AdminDashboard } from "./AdminDashboard";

export const metadata: Metadata = { title: "Управление материалами", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  if (!(await isAdminUser(user))) {
    return <section className="admin-gate"><div><p className="eyebrow">Закрытый раздел</p><h1>У этой учётной записи нет доступа</h1><p>Войдите под учётной записью владельца сайта или обратитесь к администратору IISPC.</p><a className="button" href={chatGPTSignOutPath("/admin")}>Сменить учётную запись</a></div></section>;
  }
  const [items, inquiries, media] = await Promise.all([listAllContent(), listInquiries(), listMedia()]);
  return <AdminDashboard initialItems={items} initialInquiries={inquiries} initialMedia={media} displayName={user.displayName} />;
}
