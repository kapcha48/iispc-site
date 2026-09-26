import { createInquiry, type InquiryInput, type InquiryTopic } from "../../lib/content-store";
import { isSameOriginMutation, jsonNoStore, requestFingerprint } from "../../lib/http-security";

export const dynamic = "force-dynamic";

const topics = new Set<InquiryTopic>(["education", "events", "science", "international", "other"]);

type InquiryRequest = InquiryInput & {
  consent?: boolean;
  website?: string;
};

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return jsonNoStore({ error: "Запрос отклонён" }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return jsonNoStore({ error: "Неверный формат запроса" }, 415);
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8_000) return jsonNoStore({ error: "Обращение слишком большое" }, 413);

  let input: InquiryRequest;
  try {
    input = await request.json() as InquiryRequest;
  } catch {
    return jsonNoStore({ error: "Не удалось прочитать обращение" }, 400);
  }

  if (input.website) return jsonNoStore({ ok: true });

  const normalized = normalizeInquiry(input);
  const error = validateInquiry(normalized, input.consent);
  if (error) return jsonNoStore({ error }, 400);

  try {
    const result = await createInquiry(normalized, await requestFingerprint(request));
    if (!result.accepted) {
      return jsonNoStore(
        { error: "Слишком много обращений. Пожалуйста, повторите попытку позднее." },
        { status: 429, headers: { "retry-after": String(result.retryAfter) } },
      );
    }
    return jsonNoStore({ ok: true }, 201);
  } catch {
    return jsonNoStore({ error: "Сервис обращений временно недоступен. Напишите нам по электронной почте." }, 503);
  }
}

function normalizeInquiry(input: InquiryRequest): InquiryInput {
  return {
    topic: input.topic,
    name: typeof input.name === "string" ? input.name.trim() : "",
    email: typeof input.email === "string" ? input.email.trim().toLowerCase() : "",
    phone: typeof input.phone === "string" ? input.phone.trim() : "",
    message: typeof input.message === "string" ? input.message.trim() : "",
  };
}

function validateInquiry(input: InquiryInput, consent: unknown) {
  if (!topics.has(input.topic)) return "Выберите тему обращения";
  if (input.name.length < 2 || input.name.length > 100) return "Укажите имя — от 2 до 100 символов";
  if (!input.email && !input.phone) return "Укажите электронную почту или телефон";
  if (input.email && (input.email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))) return "Проверьте адрес электронной почты";
  if (input.phone && (input.phone.length > 40 || !/^[+\d\s()\-–]{6,40}$/.test(input.phone))) return "Проверьте номер телефона";
  if (input.message.length < 10 || input.message.length > 2_000) return "Сообщение должно содержать от 10 до 2000 символов";
  if (consent !== true) return "Подтвердите согласие на обработку данных для ответа на обращение";
  return null;
}
