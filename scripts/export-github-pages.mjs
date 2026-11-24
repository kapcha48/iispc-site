import { cp, lstat, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse, parseFragment, serialize } from "parse5";
import worker from "../dist/server/index.js";

const [, , baseFlag, base, outFlag, directory] = process.argv;
const allowedBases = ["/iispc-site", "/iispc-site/preview"];
const allowedDirectories = ["pages-output/site", "pages-output/site/preview"];
if (baseFlag !== "--base" || outFlag !== "--out" || !allowedBases.includes(base) ||
    directory !== allowedDirectories[allowedBases.indexOf(base)]) {
  throw new Error("Expected --base /iispc-site --out pages-output/site (append /preview to both for editorial preview).");
}

const client = path.resolve("dist/client");
const host = "https://kapcha48.github.io";
const origin = "https://iispc.org";
const preview = base.endsWith("/preview");
const out = path.resolve(directory);
const urlAttributes = new Set(["href", "src", "poster", "srcset", "imagesrcset", "action"]);
const unsafeUpload = /\.(?:html?|xhtml|js|mjs|css|svgz?|wasm|xml)$/i;

function sitePath(value) {
  if (value === base || value.startsWith(base + "/") || !value.startsWith("/") || value.startsWith("//")) return value;
  return base + value;
}

function attrValue(key, value) {
  if (key.toLowerCase().endsWith("srcset")) {
    return value.split(",").map((candidate) => candidate.replace(/^(\s*)(\/[^\s,]+)/, (_, spaces, url) => spaces + sitePath(url))).join(",");
  }
  return sitePath(value);
}

function rewriteFlight(value) {
  if (Array.isArray(value)) return value.map(rewriteFlight);
  if (!value || typeof value !== "object") return value;
  for (const [key, field] of Object.entries(value)) {
    if (typeof field === "string" && urlAttributes.has(key.toLowerCase())) {
      value[key] = attrValue(key, field);
    } else if (key === "__html" && typeof field === "string") {
      const fragment = parseFragment(field);
      rewriteNodes(fragment);
      value[key] = serialize(fragment);
    } else if (field && typeof field === "object") {
      rewriteFlight(field);
    }
  }
  return value;
}

function rewriteFlightScript(script) {
  const push = script.match(/(\.rsc\.push\()("(?:\\.|[^"\\])*")(\))/s);
  if (!push) return script;
  const row = JSON.parse(push[2]);
  const match = row.match(/^([0-9a-f]*:)(HL|I)?((?:\[|\{)[\s\S]*)\n$/);
  if (!match) return script;
  const [, prefix, type = "", data] = match;
  let value;
  try {
    value = JSON.parse(data);
  } catch {
    return script;
  }
  if (type === "HL" && typeof value[0] === "string") value[0] = sitePath(value[0]);
  else rewriteFlight(value);
  const escaped = JSON.stringify(prefix + type + JSON.stringify(value) + "\n").replaceAll("<", "\\u003c");
  return script.replace(push[0], () => push[1] + escaped + push[3]);
}

function rewriteNodes(node) {
  for (const attr of node.attrs ?? []) {
    if (urlAttributes.has(attr.name)) attr.value = attrValue(attr.name, attr.value);
  }
  if (node.tagName === "script" && node.childNodes?.[0]?.nodeName === "#text") {
    node.childNodes[0].value = rewriteFlightScript(node.childNodes[0].value);
  }
  for (const child of node.childNodes ?? []) rewriteNodes(child);
}

function siteHtml(source) {
  const document = parse(source);
  rewriteNodes(document);
  const html = serialize(document);
  return html.replace("</head>", '<meta name="robots" content="noindex, nofollow"></head>');
}

function routeFromLocation(location) {
  const url = new URL(location);
  if (url.origin !== origin || url.search || url.hash) throw new Error("Unexpected sitemap URL: " + location);
  const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts.some((part) => part === "." || part === ".." || part.includes("/") || part.includes("\\"))) {
    throw new Error("Invalid route: " + url.pathname);
  }
  return { url: url.pathname, parts };
}

const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const context = { waitUntil() {}, passThroughOnException() {} };
function render(url) {
  return worker.fetch(new Request(origin + url, { headers: { accept: "text/html" } }), env, context);
}

for (const target of ["pages-output", "pages-output/site", ...(preview ? [directory] : [])]) {
  const status = await lstat(target).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (status && (!status.isDirectory() || status.isSymbolicLink())) throw new Error("Unsafe output: " + target);
}
await mkdir(out, { recursive: true });
if ((await readdir(out)).length) throw new Error("Static output directory must be empty: " + directory);
await cp(client, out, {
  recursive: true,
  filter: (source) => {
    const relative = path.relative(client, source);
    const parts = relative.split(path.sep);
    if (parts.some((part) => part.startsWith(".")) || parts[0] === "admin" || parts[0] === "robots.txt") return false;
    if (parts[0] === "archive" && parts[1] === "source" && unsafeUpload.test(relative)) return false;
    return true;
  },
});

const cssDir = path.join(out, "_next/static/css");
for (const filename of await readdir(cssDir)) {
  if (!filename.endsWith(".css")) continue;
  const target = path.join(cssDir, filename);
  const css = await readFile(target, "utf8");
  const localCss = css.replace(/url\((['"]?)(\/[^)'"\s]+)/gi, (_, quote, url) => "url(" + quote + sitePath(url));
  await writeFile(target, localCss);
}

const sitemap = await render("/sitemap.xml");
if (!sitemap.ok) throw new Error("Sitemap failed: " + sitemap.status);
const xml = await sitemap.text();
const urls = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]))];
if (!urls.length) throw new Error("The published sitemap contains no pages.");
urls.push(origin + "/admin");

for (const location of urls) {
  const route = routeFromLocation(location);
  const response = await render(route.url);
  if (!response.ok) throw new Error(route.url + " failed: " + response.status);
  const target = path.join(out, ...route.parts);
  await mkdir(target, { recursive: true });
  await writeFile(path.join(target, "index.html"), siteHtml(await response.text()));
}

const notFound = await render("/__iispc-not-found__");
if (notFound.status !== 404) throw new Error("Expected a 404 route.");
await writeFile(path.join(out, "404.html"), siteHtml(await notFound.text()));
await writeFile(path.join(out, "sitemap.xml"), xml.replaceAll("<loc>" + origin, "<loc>" + host + base));
if (!preview) await writeFile(path.join(out, "robots.txt"), "User-agent: *\nDisallow: /\n");
console.log("Exported " + urls.length + " routes to " + base + ".");
