import { getChatGPTUser } from "../../../chatgpt-auth";
import { isInternalMediaUrl, isSameOriginMutation, jsonNoStore } from "../../../lib/http-security";
import { deleteContent, isAdminUser, listAllContent, saveContent, type ContentInput } from "../../../lib/content-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getChatGPTUser();
  if (!(await isAdminUser(user))) return jsonNoStore({ error: "Нет доступа" }, 403);
  return jsonNoStore({ items: await listAllContent() });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user || !(await isAdminUser(user))) return jsonNoStore({ error: "Нет доступа" }, 403);
  if (!isSameOriginMutation(request)) return jsonNoStore({ error: "Запрос отклонён" }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return jsonNoStore({ error: "Неверный формат запроса" }, 415);
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 70_000) return jsonNoStore({ error: "Материал слишком большой" }, 413);

  let input: ContentInput;
  try {
    input = await request.json() as ContentInput;
  } catch {
    return jsonNoStore({ error: "Не удалось прочитать данные" }, 400);
  }

  const error = validateContentInput(input);
  if (error) return jsonNoStore({ error }, 400);

  try {
    const normalized: ContentInput = {
      ...input,
      title: input.title.trim(),
      excerpt: input.excerpt.trim(),
      body: input.body.trim(),
      author: input.author.trim(),
      coverAlt: input.coverAlt.trim() || input.title.trim(),
      eventDate: input.type === "event" ? input.eventDate || null : null,
      location: input.type === "event" ? input.location?.trim() || null : null,
      coverUrl: input.coverUrl || null,
      attachmentUrl: input.type === "publication" ? input.attachmentUrl || null : null,
    };
    return jsonNoStore(await saveContent(normalized, user));
  } catch {
    return jsonNoStore({ error: "Не удалось сохранить материал. Попробуйте ещё раз." }, 500);
  }
}

export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!(await isAdminUser(user))) return jsonNoStore({ error: "Нет доступа" }, 403);
  if (!isSameOriginMutation(request)) return jsonNoStore({ error: "Запрос отклонён" }, 403);
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[a-zA-Z0-9-]{1,80}$/.test(id)) return jsonNoStore({ error: "Материал не найден" }, 400);
  try {
    await deleteContent(id);
    return jsonNoStore({ ok: true });
  } catch {
    return jsonNoStore({ error: "Не удалось удалить материал" }, 500);
  }
}

function validateContentInput(input: ContentInput) {
  if (!input || typeof input !== "object") return "Не удалось прочитать данные";
  if (!["news", "publication", "event", "gallery"].includes(input.type)) return "Выберите корректный тип материала";
  if (!["draft", "published", "archived"].includes(input.status)) return "Выберите корректный статус";
  if (typeof input.title !== "string" || input.title.trim().length < 3 || input.title.trim().length > 180) return "Заголовок должен содержать от 3 до 180 символов";
  if (typeof input.excerpt !== "string" || input.excerpt.trim().length < 10 || input.excerpt.trim().length > 600) return "Краткое описание должно содержать от 10 до 600 символов";
  if (typeof input.body !== "string" || input.body.length > 60_000) return "Основной текст слишком длинный";
  if (typeof input.author !== "string" || input.author.length > 160) return "Имя автора слишком длинное";
  if (typeof input.coverAlt !== "string" || input.coverAlt.length > 240) return "Описание фотографии слишком длинное";
  if (input.id && !/^[a-zA-Z0-9-]{1,80}$/.test(input.id)) return "Некорректный идентификатор материала";
  if (input.slug && !/^[a-z0-9-]{1,180}$/.test(input.slug)) return "Некорректный адрес материала";
  if (!isInternalMediaUrl(input.coverUrl) || !isInternalMediaUrl(input.attachmentUrl)) return "Используйте файл, загруженный через панель IISPC";
  if (input.eventDate && (typeof input.eventDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.eventDate))) return "Укажите корректную дату";
  if (input.location && (typeof input.location !== "string" || input.location.length > 160)) return "Название места слишком длинное";
  return null;
}
