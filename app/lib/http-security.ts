import { NextResponse } from "next/server";

export function isSameOriginMutation(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function jsonNoStore(data: unknown, init: number | ResponseInit = 200) {
  const responseInit: ResponseInit = typeof init === "number" ? { status: init } : init;
  const response = NextResponse.json(data, responseInit);
  response.headers.set("cache-control", "no-store, max-age=0");
  response.headers.set("pragma", "no-cache");
  return response;
}

export async function requestFingerprint(request: Request) {
  const forwarded = request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 180) ?? "unknown";
  const bytes = new TextEncoder().encode(`${forwarded}|${userAgent}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function isInternalMediaUrl(value: unknown): value is string | null {
  if (value == null || value === "") return true;
  if (typeof value !== "string" || value.length > 300) return false;
  try {
    const url = new URL(value, "https://iispc.local");
    return url.origin === "https://iispc.local"
      && url.pathname.startsWith("/media/")
      && !url.search
      && !url.hash;
  } catch {
    return false;
  }
}
