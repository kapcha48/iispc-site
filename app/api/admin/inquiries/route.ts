import { getChatGPTUser } from "../../../chatgpt-auth";
import { deleteInquiry, isAdminUser, listInquiries, updateInquiryStatus, type InquiryStatus } from "../../../lib/content-store";
import { isSameOriginMutation, jsonNoStore } from "../../../lib/http-security";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getChatGPTUser();
  if (!(await isAdminUser(user))) return jsonNoStore({ error: "Нет доступа" }, 403);
  try {
    return jsonNoStore({ inquiries: await listInquiries() });
  } catch {
    return jsonNoStore({ error: "Не удалось загрузить обращения" }, 500);
  }
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!(await isAdminUser(user))) return jsonNoStore({ error: "Нет доступа" }, 403);
  if (!isSameOriginMutation(request)) return jsonNoStore({ error: "Запрос отклонён" }, 403);

  let input: { id?: string; status?: InquiryStatus };
  try {
    input = await request.json() as { id?: string; status?: InquiryStatus };
  } catch {
    return jsonNoStore({ error: "Не удалось прочитать данные" }, 400);
  }
  if (!input.id || !/^[a-zA-Z0-9-]{1,80}$/.test(input.id) || !input.status || !["new", "reviewed", "closed"].includes(input.status)) {
    return jsonNoStore({ error: "Некорректные данные обращения" }, 400);
  }
  try {
    await updateInquiryStatus(input.id, input.status);
    return jsonNoStore({ ok: true });
  } catch {
    return jsonNoStore({ error: "Не удалось обновить обращение" }, 500);
  }
}

export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!(await isAdminUser(user))) return jsonNoStore({ error: "Нет доступа" }, 403);
  if (!isSameOriginMutation(request)) return jsonNoStore({ error: "Запрос отклонён" }, 403);
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[a-zA-Z0-9-]{1,80}$/.test(id)) return jsonNoStore({ error: "Обращение не найдено" }, 400);
  try {
    await deleteInquiry(id);
    return jsonNoStore({ ok: true });
  } catch {
    return jsonNoStore({ error: "Не удалось удалить обращение" }, 500);
  }
}
