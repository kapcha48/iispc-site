import { getChatGPTUser } from "../../chatgpt-auth";
import { getMediaForDelivery, isAdminUser } from "../../lib/content-store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!/^[a-f0-9-]{36}\.(?:jpg|png|webp|avif|pdf)$/.test(key)) return new Response("Not found", { status: 404 });
  const media = await getMediaForDelivery(key);
  if (!media) return new Response("Not found", { status: 404 });
  const admin = media.isPublished ? false : await isAdminUser(await getChatGPTUser());
  if (!media.isPublished && !admin) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  media.object.writeHttpMetadata(headers);
  headers.set("etag", media.object.httpEtag);
  headers.set("cache-control", media.isPublished ? "public, max-age=3600, stale-while-revalidate=86400" : "private, no-store");
  headers.set("x-content-type-options", "nosniff");
  headers.set("content-security-policy", "default-src 'none'; frame-ancestors 'self'; sandbox");
  headers.set("content-disposition", `${media.contentType === "application/pdf" ? "attachment" : "inline"}; filename="${safeFilename(media.filename)}"`);
  return new Response(media.object.body, { headers });
}

function safeFilename(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  return cleaned || "iispc-file";
}
