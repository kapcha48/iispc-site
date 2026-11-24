import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import yaml from "js-yaml";

const root = process.cwd();
const contentRoot = path.join(root, "content");
const outputPath = path.join(root, "app", "content", "git-content.json");
const editorialPath = path.join(root, "app", "content", "editorial-content.json");
const baseline = JSON.parse(await readFile(path.join(root, "app", "content", "imported-body-hashes.json"), "utf8"));
const collections = { news: "news", events: "event", publications: "publication", galleries: "gallery" };

async function* readCollection(folder) {
  const directory = path.join(contentRoot, folder);
  const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const names = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md")).map((entry) => entry.name).sort();
  const slugs = new Set();
  for (const filename of names) {
    const filepath = "content/" + folder + "/" + filename;
    const source = await readFile(path.join(directory, filename), "utf8");
    const match = source.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
    if (!match) throw new Error(filepath + ": missing YAML frontmatter");
    const data = yaml.load(match[1], { schema: yaml.CORE_SCHEMA, filename: filepath });
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error(filepath + ": invalid YAML frontmatter");
    const slug = (asText(data.slug) || filename.slice(0, -3)).normalize("NFC");
    if (!/^[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?$/u.test(slug)) {
      throw new Error(filepath + ": invalid address");
    }
    if (slugs.has(slug)) throw new Error(filepath + ": duplicate address " + slug);
    slugs.add(slug);
    const status = folder === "sections" ? "published" : asText(data.status) || "draft";
    if (!["draft", "published", "archived"].includes(status)) throw new Error(filepath + ": invalid publication status");
    yield { filepath, slug, status, data, body: match[2].trim() };
  }
}

function timestamp(value, fallback = 0) {
  const parsed = value ? Date.parse(String(value)) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}
function asText(value) { return typeof value === "string" ? value.trim() : ""; }

function asList(value) {
  return Array.isArray(value) ? value.map(asText).filter(Boolean) : [];
}

function localAsset(value) {
  const url = asText(value);
  if (!url.startsWith("/archive/") || url.includes("?") || url.includes("#")) return null;
  try {
    const decoded = decodeURIComponent(url);
    const invalidSegment = decoded.split("/").slice(2).some((part) => part === "" || part === "." || part === "..");
    const invalidCharacter = [...decoded].some((char) => char === "\\" || char.charCodeAt(0) < 32);
    return invalidSegment || invalidCharacter ? null : url;
  } catch {
    return null;
  }
}

function httpsLink(value) {
  try {
    const url = new URL(asText(value));
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

async function loadCollection(folder, type) {
  const items = [];
  for await (const { data, body, slug, status } of readCollection(folder)) {
    if (status !== "published") continue;
    const images = asList(data.images).map(localAsset).filter(Boolean);
    const publishedAt = timestamp(type === "event" ? data.eventDate : data.publishedAt, timestamp(data.updatedAt, 0));
    items.push({
      id: `git:${folder}:${slug}`, type, slug,
      title: asText(data.title) || "Материал IISPC", excerpt: asText(data.excerpt), body,
      author: asText(data.authors) || "IISPC", coverUrl: localAsset(data.cover) || images[0] || null,
      coverAlt: asText(data.coverAlt) || asText(data.title),
      attachmentUrl: localAsset(data.file) || localAsset(data.document),
      eventDate: asText(data.eventDate) || null, location: asText(data.location) || null,
      status: "published", publishedAt: publishedAt || null, createdAt: publishedAt, updatedAt: publishedAt,
    });
  }
  return items.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
}

async function loadEditorialCollection(folder) {
  const entries = [];
  for await (const { filepath, slug, status, data, body } of readCollection(folder)) {
    if (status !== "published") {
      entries.push({ slug, status });
      continue;
    }
    const title = asText(data.title);
    if (!title) throw new Error(filepath + ": a published entry needs a title");
    const bodyChanged = createHash("sha256").update(body.replace(/\r\n/g, "\n")).digest("hex") !== baseline[filepath];
    entries.push({
      slug, status, title, body, bodyChanged,
      excerpt: asText(data.excerpt),
      coverUrl: localAsset(data.cover),
      coverAlt: asText(data.coverAlt),
      attachmentUrl: localAsset(data.document),
      programType: asText(data.programType),
      programFormat: asText(data.programFormat),
      duration: asText(data.duration),
      admission: asText(data.admission),
      audience: asText(data.audience),
      intake: asText(data.intake),
      credential: asText(data.credential),
      outcomes: asList(data.outcomes),
      modules: asList(data.modules),
      registrationUrl: httpsLink(data.registrationUrl),
      section: asText(data.section),
      role: asText(data.role),
      degree: asText(data.degree),
      group: asText(data.group) || "faculty",
      location: asText(data.location),
      order: Number.isSafeInteger(data.order) ? data.order : 0,
    });
  }
  return entries;
}

const output = [];
for (const [folder, type] of Object.entries(collections)) output.push(...await loadCollection(folder, type));
const editorial = {};
for (const folder of ["programs", "pages", "people", "sections"]) editorial[folder] = await loadEditorialCollection(folder);
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
await writeFile(editorialPath, JSON.stringify(editorial) + "\n");
console.log("Prepared", output.length + Object.values(editorial).flat().filter((entry) => entry.status === "published").length, "published CMS entries.");
