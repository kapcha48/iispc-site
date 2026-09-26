import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const contentRoot = path.join(root, "content");
const outputPath = path.join(root, "app", "content", "git-content.json");
const collections = { news: "news", events: "event", publications: "publication", galleries: "gallery" };

function scalar(value) {
  const text = value.trim();
  if (!text) return "";
  if (text === "null" || text === "~") return null;
  if (text === "true") return true;
  if (text === "false") return false;
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number(text);
  if (text.startsWith('"') && text.endsWith('"')) {
    try { return JSON.parse(text); } catch { return text.slice(1, -1); }
  }
  if (text.startsWith("'") && text.endsWith("'")) return text.slice(1, -1).replace(/''/g, "'");
  if (text.startsWith("[") && text.endsWith("]")) {
    try { return JSON.parse(text); } catch { return text.slice(1, -1).split(",").map((item) => scalar(item)); }
  }
  return text;
}

function parseDocument(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: source.trim() };
  const data = {};
  let listKey = null;
  for (const line of match[1].split(/\r?\n/)) {
    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && listKey) { data[listKey].push(scalar(listItem[1])); continue; }
    const pair = line.match(/^([A-Za-z][A-Za-z0-9_-]*):(?:\s*(.*))?$/);
    if (!pair) continue;
    const [, key, raw = ""] = pair;
    if (!raw.trim()) { data[key] = []; listKey = key; }
    else { data[key] = scalar(raw); listKey = null; }
  }
  return { data, body: match[2].trim() };
}

function timestamp(value, fallback = 0) {
  const parsed = value ? Date.parse(String(value)) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}
function asText(value) { return typeof value === "string" ? value.trim() : ""; }

async function loadCollection(folder, type) {
  const directory = path.join(contentRoot, folder);
  let filenames = [];
  try { filenames = (await readdir(directory)).filter((name) => name.endsWith(".md")); } catch { return []; }
  const items = [];
  for (const filename of filenames) {
    const { data, body } = parseDocument(await readFile(path.join(directory, filename), "utf8"));
    if (data.status !== "published") continue;
    const slug = asText(data.slug) || filename.replace(/\.md$/, "");
    const images = Array.isArray(data.images) ? data.images.filter((item) => typeof item === "string") : [];
    const publishedAt = timestamp(type === "event" ? data.eventDate : data.publishedAt, timestamp(data.updatedAt, 0));
    items.push({
      id: `git:${folder}:${slug}`, type, slug,
      title: asText(data.title) || "Материал IISPC", excerpt: asText(data.excerpt), body,
      author: asText(data.authors) || "IISPC", coverUrl: asText(data.cover) || images[0] || null,
      coverAlt: asText(data.coverAlt) || asText(data.title),
      attachmentUrl: asText(data.file) || asText(data.document) || null,
      eventDate: asText(data.eventDate) || null, location: asText(data.location) || null,
      status: "published", publishedAt: publishedAt || null, createdAt: publishedAt, updatedAt: publishedAt,
    });
  }
  return items.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
}

const output = [];
for (const [folder, type] of Object.entries(collections)) output.push(...await loadCollection(folder, type));
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Prepared ${output.length} published Git-based CMS entries.`);
