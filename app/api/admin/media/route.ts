import { getChatGPTUser } from "../../../chatgpt-auth";
import { isSameOriginMutation, jsonNoStore } from "../../../lib/http-security";
import { deleteUnusedMedia, isAdminUser, listMedia, saveMedia } from "../../../lib/content-store";

export const dynamic = "force-dynamic";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"]);

export async function GET() {
  const user = await getChatGPTUser();
  if (!(await isAdminUser(user))) return jsonNoStore({ error: "Нет доступа" }, 403);
  try {
    return jsonNoStore({ media: await listMedia() });
  } catch {
    return jsonNoStore({ error: "Не удалось загрузить медиатеку" }, 500);
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user || !(await isAdminUser(user))) return jsonNoStore({ error: "Нет доступа" }, 403);
  if (!isSameOriginMutation(request)) return jsonNoStore({ error: "Запрос отклонён" }, 403);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16 * 1024 * 1024) return jsonNoStore({ error: "Файл должен быть меньше 15 МБ" }, 413);
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonNoStore({ error: "Не удалось прочитать файл" }, 400);
  }
  const file = formData.get("file");
  const altText = String(formData.get("altText") ?? "").trim().slice(0, 240);
  if (!(file instanceof File) || !allowedTypes.has(file.type)) {
    return jsonNoStore({ error: "Разрешены JPG, PNG, WebP, AVIF и PDF" }, 400);
  }
  if (file.size === 0 || file.size > 15 * 1024 * 1024) return jsonNoStore({ error: "Файл должен быть меньше 15 МБ" }, 400);
  if (!(await hasExpectedSignature(file))) return jsonNoStore({ error: "Содержимое файла не соответствует его формату" }, 400);
  try {
    return jsonNoStore(await saveMedia(file, altText, user));
  } catch {
    return jsonNoStore({ error: "Не удалось загрузить файл. Попробуйте ещё раз." }, 500);
  }
}

export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!user || !(await isAdminUser(user))) return jsonNoStore({ error: "Нет доступа" }, 403);
  if (!isSameOriginMutation(request)) return jsonNoStore({ error: "Запрос отклонён" }, 403);
  const url = new URL(request.url).searchParams.get("url");
  if (!url || !/^\/media\/[a-f0-9-]{36}\.(?:jpg|png|webp|avif|pdf)$/.test(url)) {
    return jsonNoStore({ error: "Файл не найден" }, 400);
  }
  try {
    await deleteUnusedMedia(url);
    return jsonNoStore({ ok: true });
  } catch {
    return jsonNoStore({ error: "Не удалось удалить неиспользуемый файл" }, 500);
  }
}

async function hasExpectedSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const startsWith = (...signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  if (file.type === "image/jpeg") return startsWith(0xff, 0xd8, 0xff);
  if (file.type === "image/png") return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (file.type === "image/webp") return text(bytes, 0, 4) === "RIFF" && text(bytes, 8, 12) === "WEBP";
  if (file.type === "image/avif") return text(bytes, 4, 8) === "ftyp" && /avif|avis/.test(text(bytes, 8, 32));
  if (file.type === "application/pdf") return text(bytes, 0, 5) === "%PDF-";
  return false;
}

function text(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}
