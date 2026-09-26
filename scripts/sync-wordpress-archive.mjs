import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const projectRoot = process.cwd();
const exportRoot = process.argv[2];
if (!exportRoot) {
  throw new Error("Usage: node scripts/sync-wordpress-archive.mjs <wordpress-export-directory>");
}

const readJson = (name) => JSON.parse(readFileSync(join(exportRoot, `${name}.json`), "utf8"));
const pages = readJson("pages");
const posts = readJson("posts");
const courses = readJson("courses");
const media = [...new Map(readJson("media").map((item) => [item.id, item])).values()];

const excludedPageSlugs = new Set([
  "profile",
  "pricing",
  "contact-us",
  "console",
  "reg-student",
  "reg-tutor",
]);

const sourceGroups = [
  { kind: "page", label: "Страницы старого сайта", records: pages.filter((item) => !excludedPageSlugs.has(item.slug)) },
  { kind: "post", label: "Новости старого сайта", records: posts },
  { kind: "course", label: "Образовательные программы", records: courses },
];

const archivePathBySourcePath = new Map();
for (const group of sourceGroups) {
  for (const record of group.records) {
    if (!record.link) continue;
    try {
      archivePathBySourcePath.set(new URL(record.link).pathname.replace(/\/$/, "") || "/", `/archive/${group.kind}-${record.id}`);
    } catch {
      // Ignore malformed legacy links; the material itself is still preserved.
    }
  }
}

function decodeEntities(value = "") {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function plainText(value = "") {
  return decodeEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeRemoteUrl(value) {
  if (!value) return null;
  const decoded = decodeEntities(value).replace(/^['"]|['"]$/g, "").trim();
  if (!/^https?:\/\/(?:www\.)?(?:iispc\.org|iasp\.kz)\/wp-content\/(?:uploads\/|themes\/turitor\/assets\/images\/)/i.test(decoded)) return null;
  try {
    const url = new URL(decoded);
    url.protocol = "https:";
    url.hash = "";
    url.search = "";
    return url.href;
  } catch {
    return null;
  }
}

function localPathFor(remoteUrl) {
  const url = new URL(remoteUrl);
  const marker = "/wp-content/uploads/";
  const markerIndex = url.pathname.indexOf(marker);
  const relative = (markerIndex >= 0
    ? url.pathname.slice(markerIndex + marker.length)
    : `theme/${url.pathname.split("/").at(-1)}`)
    .split("/")
    .map(safeDecode)
    .join("/");
  const hostPrefix = url.hostname === "iispc.org" || url.hostname === "www.iispc.org" ? "" : `external/${url.hostname}/`;
  return `/archive/source/${hostPrefix}${relative}`;
}

const remoteToOriginal = new Map();
const mediaById = new Map();
for (const item of media) {
  mediaById.set(item.id, item);
  const original = normalizeRemoteUrl(item.source_url);
  if (!original) continue;
  remoteToOriginal.set(original, original);
  remoteToOriginal.set(original.replace("https://", "http://"), original);
  for (const size of Object.values(item.media_details?.sizes ?? {})) {
    const sized = normalizeRemoteUrl(size.source_url);
    if (!sized) continue;
    remoteToOriginal.set(sized, original);
    remoteToOriginal.set(sized.replace("https://", "http://"), original);
  }
}

function uploadUrls(value = "") {
  const urls = [];
  for (const match of value.matchAll(/(?:src|href|poster)=["']([^"']+)["']/gi)) {
    const normalized = normalizeRemoteUrl(match[1]);
    if (normalized) urls.push(normalized);
  }
  for (const match of value.matchAll(/srcset=["']([^"']+)["']/gi)) {
    for (const candidate of match[1].split(",")) {
      const normalized = normalizeRemoteUrl(candidate.trim().split(/\s+/)[0]);
      if (normalized) urls.push(normalized);
    }
  }
  for (const match of value.matchAll(/url\(["']?([^"')]+)["']?\)/gi)) {
    const normalized = normalizeRemoteUrl(match[1]);
    if (normalized) urls.push(normalized);
  }
  return urls;
}

const structuralTags = new Set([
  "p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "strong", "em", "u", "br",
  "blockquote", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "figure", "figcaption",
]);

function escapeAttribute(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function localizeInternalHref(value) {
  try {
    const url = new URL(value, "https://iispc.org");
    if (url.hostname !== "iispc.org" && url.hostname !== "www.iispc.org") return value;
    if (url.pathname.startsWith("/wp-content/uploads/")) return value;
    const normalizedPath = url.pathname.replace(/\/$/, "") || "/";
    return archivePathBySourcePath.get(normalizedPath) ?? (normalizedPath === "/" ? "/" : "/archive");
  } catch {
    return value.startsWith("#") ? value : "/archive";
  }
}

function cleanTag(token) {
  const match = token.match(/^<\s*(\/?)\s*([a-z0-9]+)\b/i);
  if (!match) return "";
  const closing = Boolean(match[1]);
  const tag = match[2].toLowerCase();
  if (structuralTags.has(tag)) return closing && tag !== "br" ? `</${tag}>` : `<${tag}>`;
  if (tag === "a" && closing) return "</a>";
  if (closing) return "";
  if (tag === "img") {
    const src = token.match(/\ssrc=["']([^"']+)["']/i)?.[1];
    if (!src || /^(?:javascript|data):/i.test(src)) return "";
    const rawAlt = token.match(/\salt=["']([^"']*)["']/i)?.[1] ?? "";
    const alt = /^https?:\/\//i.test(rawAlt.trim()) ? "" : plainText(rawAlt);
    if (/^https?:\/\//i.test(src)) return escapeAttribute(alt);
    return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}">`;
  }
  if (tag === "a") {
    const rawHref = token.match(/\shref=["']([^"']+)["']/i)?.[1];
    const href = rawHref ? localizeInternalHref(rawHref) : null;
    if (!href || /^(?:javascript|data):/i.test(href)) return "<a>";
    return `<a href="${escapeAttribute(href)}" rel="noreferrer">`;
  }
  return "";
}

const selectedIds = new Set(sourceGroups.flatMap((group) => group.records.map((record) => record.id)));
const downloadUrls = new Set();
for (const item of media) {
  if (!selectedIds.has(item.post)) continue;
  const original = normalizeRemoteUrl(item.source_url);
  if (original) downloadUrls.add(original);
}

function localizeHtml(value = "") {
  let html = decodeEntities(value);
  const candidates = uploadUrls(html);
  for (const candidate of candidates) {
    const original = remoteToOriginal.get(candidate) ?? candidate;
    downloadUrls.add(original);
    const local = localPathFor(original);
    const variants = [candidate, candidate.replace("https://", "http://")];
    for (const variant of variants) html = html.split(variant).join(local);
  }

  html = html.replace(/((?:src|href|poster)=["'])([^"']+)(["'])/gi, (token, prefix, rawUrl, suffix) => {
    const candidate = normalizeRemoteUrl(rawUrl);
    if (!candidate) return token;
    const original = remoteToOriginal.get(candidate) ?? candidate;
    downloadUrls.add(original);
    return `${prefix}${localPathFor(original)}${suffix}`;
  });

  html = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|noscript|form)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(input|button|select|textarea)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(input|button|select|textarea)[^>]*\/?>/gi, "")
    .replace(/<iframe[^>]+src=["']([^"']*youtube[^"']*)["'][^>]*>[\s\S]*?<\/iframe>/gi, (_, url) => {
      const id = decodeEntities(url).match(/(?:embed\/|youtu\.be\/|v=)([\w-]+)/)?.[1];
      return id ? `<p><a href="https://www.youtube.com/watch?v=${id}" rel="noreferrer">Смотреть видео на YouTube</a></p>` : "";
    })
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<video[^>]*>[\s\S]*?<source[^>]+src=["']([^"']+)["'][^>]*>[\s\S]*?<\/video>/gi, '<p><a href="$1" rel="noreferrer">Открыть видео</a></p>')
    .replace(/<video[^>]+src=["']([^"']+)["'][^>]*>[\s\S]*?<\/video>/gi, '<p><a href="$1" rel="noreferrer">Открыть видео</a></p>')
    .replace(/<[^>]+>/g, cleanTag)
    .replace(/<(h[1-6]|p)>\s*<\/\1>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return html;
}

const items = [];
for (const group of sourceGroups) {
  for (const record of group.records) {
    const html = localizeHtml(record.content?.rendered ?? "");
    const featured = mediaById.get(record.featured_media);
    const featuredRemote = normalizeRemoteUrl(featured?.source_url);
    if (featuredRemote) downloadUrls.add(featuredRemote);
    const fallbackExcerpt = html ? plainText(html).slice(0, 260) : "В исходной версии сайта основной текст для этой страницы не был опубликован.";
    items.push({
      slug: `${group.kind}-${record.id}`,
      sourceSlug: record.slug,
      kind: group.kind,
      kindLabel: group.label,
      title: plainText(record.title?.rendered ?? "Без названия"),
      date: record.date,
      modifiedAt: record.modified,
      excerpt: plainText(record.excerpt?.rendered ?? "") || fallbackExcerpt,
      coverUrl: featuredRemote ? localPathFor(featuredRemote) : html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null,
      html,
      sourceUrl: record.link,
    });
  }
}

async function downloadFile(remoteUrl) {
  const localUrl = localPathFor(remoteUrl);
  const destination = join(projectRoot, "public", localUrl);
  if (existsSync(destination) && statSync(destination).size > 0) return { status: "existing", remoteUrl, localUrl };
  mkdirSync(dirname(destination), { recursive: true });
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(remoteUrl, { redirect: "follow" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
      return { status: "downloaded", remoteUrl, localUrl };
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  return { status: "failed", remoteUrl, localUrl, error: String(lastError) };
}

const queue = [...downloadUrls];
const results = [];
const workers = Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const remoteUrl = queue.shift();
    results.push(await downloadFile(remoteUrl));
  }
});
await Promise.all(workers);

const unavailableResults = results.filter((result) => result.status === "failed" && /HTTP (?:404|410)/.test(result.error ?? ""));
const unavailableLocalUrls = new Set(unavailableResults.map((result) => result.localUrl));
for (const item of items) {
  if (item.coverUrl && unavailableLocalUrls.has(item.coverUrl)) item.coverUrl = null;
  for (const localUrl of unavailableLocalUrls) {
    const escapedUrl = localUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    item.html = item.html.replace(new RegExp(`<img[^>]+src=["']${escapedUrl}["'][^>]*>`, "gi"), "");
  }
}

const output = {
  generatedAt: new Date().toISOString(),
  sourceUrl: "https://iispc.org",
  stats: {
    pages: sourceGroups.find((group) => group.kind === "page").records.length,
    posts: posts.length,
    courses: courses.length,
    media: downloadUrls.size,
    downloaded: results.filter((result) => result.status === "downloaded").length,
    existing: results.filter((result) => result.status === "existing").length,
    unavailableAtSource: unavailableResults.length,
    failed: results.filter((result) => result.status === "failed" && !unavailableResults.includes(result)).length,
  },
  items: items.sort((a, b) => b.date.localeCompare(a.date)),
};

mkdirSync(join(projectRoot, "app", "content"), { recursive: true });
writeFileSync(join(projectRoot, "app", "content", "source-archive.json"), `${JSON.stringify(output, null, 2)}\n`);
writeFileSync(join(projectRoot, "app", "content", "source-media-manifest.json"), `${JSON.stringify(results, null, 2)}\n`);

console.log(JSON.stringify(output.stats, null, 2));
if (output.stats.failed) process.exitCode = 1;
