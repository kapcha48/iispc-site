import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const cmsUrl = (process.env.IISPC_CMS_URL || "http://127.0.0.1:3010").replace(/\/$/, "");
const projectRoot = process.cwd();
const contentRoot = path.join(projectRoot, "content");
const backupRoot = path.join(projectRoot, "migration-backups", "payload-2026-09-26");
const collections = ["news", "events", "programs", "publications", "galleries", "people", "pages"];

function lexicalToMarkdown(value) {
  const root = value?.root || value;
  if (!root || typeof root !== "object") return typeof value === "string" ? value : "";
  const render = (node) => {
    if (!node || typeof node !== "object") return "";
    if (node.type === "text") {
      let text = node.text || "";
      if (node.format & 1) text = `**${text}**`;
      if (node.format & 2) text = `*${text}*`;
      if (node.format & 8) text = `__${text}__`;
      if (node.format & 16) text = `~~${text}~~`;
      if (node.format & 32) text = `\`${text}\``;
      return text;
    }
    const children = Array.isArray(node.children) ? node.children.map(render).join("") : "";
    if (node.type === "heading") return `${"#".repeat(Number(node.tag?.slice?.(1)) || 2)} ${children}\n\n`;
    if (node.type === "quote") return children.split("\n").filter(Boolean).map((line) => `> ${line}`).join("\n") + "\n\n";
    if (node.type === "listitem") return `- ${children.trim()}\n`;
    if (node.type === "list") return `${children}\n`;
    if (node.type === "link" || node.type === "autolink") return `[${children}](${node.url || "#"})`;
    if (node.type === "linebreak") return "  \n";
    if (node.type === "paragraph") return `${children.trim()}\n\n`;
    return children;
  };
  return render(root).replace(/\n{3,}/g, "\n\n").trim();
}

function mediaPath(value) {
  if (!value || typeof value !== "object") return "";
  return value.legacyPath || "";
}

function yamlValue(value) {
  if (value == null) return '""';
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return JSON.stringify(value);
  return JSON.stringify(String(value));
}

function frontMatter(fields) {
  return Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${yamlValue(value)}`)
    .join("\n");
}

function documentFor(collection, doc) {
  const common = {
    title: doc.title,
    slug: doc.slug,
    status: doc._status || "published",
    excerpt: doc.excerpt || doc.description || "",
    cover: mediaPath(doc.cover) || mediaPath(doc.images?.[0]),
    coverAlt: doc.cover?.alt || doc.images?.[0]?.alt || "",
  };
  const fields = collection === "news" ? {
    ...common,
    publishedAt: doc.publishedAt || "",
    sourceUrl: doc.sourceUrl || "",
  } : collection === "events" ? {
    ...common,
    eventDate: doc.eventDate || "",
    endDate: doc.endDate || "",
    format: doc.format || "offline",
    location: doc.location || "",
    registrationUrl: doc.registrationUrl || "",
  } : collection === "programs" ? {
    ...common,
    programType: doc.programType || "other",
    duration: doc.duration || "",
    document: doc.document || "",
    admission: lexicalToMarkdown(doc.admission),
  } : collection === "publications" ? {
    ...common,
    authors: doc.authors || "",
    year: doc.year || "",
    file: mediaPath(doc.file),
    externalUrl: doc.externalUrl || "",
  } : collection === "galleries" ? {
    ...common,
    eventDate: doc.eventDate || "",
    images: (doc.images || []).map(mediaPath).filter(Boolean),
  } : collection === "people" ? {
    ...common,
    role: doc.role || "",
    degree: doc.degree || "",
    group: doc.group || "team",
    order: doc.order || 0,
  } : collection === "pages" ? {
    ...common,
    section: doc.section || "other",
    sourceUrl: doc.sourceUrl || "",
  } : {
    ...common,
    topic: doc.topic || "other",
    name: doc.name || "",
    email: doc.email || "",
    phone: doc.phone || "",
    message: doc.message || "",
  };
  return `---\n${frontMatter(fields)}\n---\n\n${lexicalToMarkdown(doc.body)}\n`;
}

async function loadCollection(collection) {
  const url = `${cmsUrl}/api/${collection}?limit=1000&depth=2&draft=true`;
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`${collection}: HTTP ${response.status}`);
  return response.json();
}

await mkdir(contentRoot, { recursive: true });
await mkdir(backupRoot, { recursive: true });

const summary = {};
for (const collection of collections) {
  const data = await loadCollection(collection);
  await writeFile(path.join(backupRoot, `${collection}.json`), `${JSON.stringify(data, null, 2)}\n`);
  const docs = data.docs || [];
  summary[collection] = docs.length;
  const target = path.join(contentRoot, collection);
  await mkdir(target, { recursive: true });
  for (const doc of docs) {
    const slug = doc.slug || `${collection}-${doc.id}`;
    await writeFile(path.join(target, `${slug}.md`), documentFor(collection, doc));
  }
}

await writeFile(path.join(backupRoot, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary));
