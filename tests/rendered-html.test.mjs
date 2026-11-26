import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const staticBase = process.env.NEXT_PUBLIC_IISPC_STATIC_BASE ?? "";
const editorial = JSON.parse(readFileSync(new URL("../app/content/editorial-content.json", import.meta.url)));
const sourceArchive = JSON.parse(readFileSync(new URL("../app/content/source-archive.json", import.meta.url)));
const integrativeProgram = editorial.programs.find((entry) => entry.slug === "course-12775");

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the IISPC home page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /IISPC — Международный институт социальной психотерапии/);
  assert.match(html, /Международный институт социальной психотерапии и консультирования/);
  assert.match(html, /<h1[^>]*class="origin-kicker"/);
  assert.match(html, /href="#main-content"/);
  assert.match(html, /<main[^>]*id="main-content"/);
  assert.match(html, /Графический знак IISPC/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("all primary sections are directly reachable", async () => {
  const routes = [
    "/education",
    "/events",
    "/news",
    "/gallery",
    "/science",
    "/international",
    "/about",
    "/contacts",
  ];

  for (const route of routes) {
    const response = await render(route);
    assert.equal(response.status, 200, `${route} should return 200`);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  }
});

test("renders clear, accessible site navigation", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /aria-label="Основные разделы"/);
  assert.match(html, /aria-label="Открыть меню"/);
  assert.match(html, /aria-label="Мобильная навигация"/);
  assert.match(html, /Основные направления/);

  for (const route of [
    "/education",
    "/events",
    "/science",
    "/international",
    "/news",
    "/about",
    "/gallery",
    "/contacts",
  ]) {
    assert.ok(html.includes('href="' + route + '"') || html.includes('href="' + staticBase + route + '"'), route + " should be present in navigation");
  }
});

test("renders page-level navigation and complete breadcrumbs", async () => {
  const education = await render("/education");
  const educationHtml = await education.text();
  assert.match(educationHtml, /aria-label="Содержание страницы"/);
  assert.match(educationHtml, /href="#programs"/);
  assert.match(educationHtml, /href="#education-types"/);
  assert.match(educationHtml, /href="#education-consultation"/);

  const science = await render("/science");
  const scienceHtml = await science.text();
  assert.match(scienceHtml, /page-hero-number[^>]*>03</);
  assert.match(scienceHtml, /href="#science-publications"/);

  const international = await render("/international");
  const internationalHtml = await international.text();
  assert.match(internationalHtml, /international-masthead-index[^>]*[^>]*>04</);
  assert.match(internationalHtml, /href="#international-representatives"/);

  const program = await render("/education/integrative-polymodal-psychotherapy");
  assert.equal(program.status, integrativeProgram?.status === "published" ? 200 : 404);
  if (program.status === 404) return;
  const programHtml = await program.text();
  assert.match(programHtml, /aria-label="Путь по сайту"/);
  assert.match(programHtml, /aria-current="page"/);
});

test("archived courses use their program record and link to that record only in preview", async () => {
  const isPreview = process.env.IISPC_PREVIEW === "1";
  for (const item of sourceArchive.items.filter((item) => item.kind === "course")) {
    const program = editorial.programs.find((entry) => entry.slug === item.slug);
    const response = await render(`/archive/${item.slug}`);
    assert.equal(response.status, program && program.status !== "published" ? 404 : 200, item.slug);
    if (response.status !== 200) continue;
    const html = await response.text();
    if (program?.status === "published") {
      const courseLink = `https://app.pagescms.org/kapcha48/iispc-site/preview/collection/programs/edit/${encodeURIComponent(program.filepath)}`;
      assert.equal(html.includes(`href="${courseLink}"`), isPreview, item.slug);
      assert.ok(html.includes(`>${escapeHtml(program.title)}</h1>`), item.slug);
      assert.ok(html.includes(`>${escapeHtml(program.excerpt)}</p>`), item.slug);
      if (program.coverUrl) assert.ok(html.includes(escapeHtml(encodeURI(program.coverUrl))) || html.includes(escapeHtml(program.coverUrl)), item.slug);
      if (!program.bodyChanged && item.html) assert.ok(html.includes(item.html), `${item.slug}: original article body`);
    }
    assert.equal(html.includes("Редактировать этот курс"), isPreview && program?.status === "published", item.slug);
  }

  const nonCourse = sourceArchive.items.find((item) => item.kind === "post");
  assert.doesNotMatch(await (await render(`/archive/${nonCourse.slug}`)).text(), /Редактировать этот курс/);
});

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[character]);
}
