import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

test("Git-based CMS configuration exposes the editorial collections", () => {
  const config = readFileSync(join(root, ".pages.yml"), "utf8");
  for (const collection of ["news", "events", "programs", "publications", "galleries", "people", "pages"]) assert.match(config, new RegExp(`name: ${collection}\\b`));
  assert.match(config, /input: public\/archive\/source/);
});

test("published Markdown content is generated for the site", () => {
  const items = JSON.parse(readFileSync(join(root, "app/content/git-content.json"), "utf8"));
  assert.ok(items.some((item) => item.type === "news"));
  assert.ok(items.some((item) => item.type === "event"));
  assert.ok(items.some((item) => item.type === "publication"));
  for (const item of items) { assert.equal(item.status, "published"); assert.ok(item.slug); assert.ok(item.title); }
});
