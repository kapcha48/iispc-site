import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const projectRoot = process.cwd();
const archive = JSON.parse(readFileSync(join(projectRoot, "app/content/source-archive.json"), "utf8"));
const events = JSON.parse(readFileSync(join(projectRoot, "app/content/events.json"), "utf8"));

test("the migrated archive is independent from the retired WordPress installation", () => {
  assert.equal(archive.stats.failed, 0);
  assert.equal(archive.items.length, 53);

  for (const item of archive.items) {
    const runtimeMarkup = `${item.coverUrl ?? ""}\n${item.html ?? ""}`;
    assert.doesNotMatch(runtimeMarkup, /https?:\/\/(?:www\.)?iispc\.org/i, item.slug);
    assert.doesNotMatch(runtimeMarkup, /\/wp-content\//i, item.slug);

    const imageSources = [item.coverUrl, ...[...item.html.matchAll(/src=["']([^"']+)["']/gi)].map((match) => match[1])].filter(Boolean);
    for (const imageSource of imageSources) {
      assert.doesNotMatch(imageSource, /^https?:\/\//i, `${item.slug}: remote media ${imageSource}`);
    }

    const localAssets = [...runtimeMarkup.matchAll(/(?:src|href)=["'](\/archive\/source\/[^"']+)["']/gi)];
    for (const [, assetPath] of localAssets) {
      assert.ok(existsSync(join(projectRoot, "public", decodeURIComponent(assetPath))), `${item.slug}: ${assetPath}`);
    }
  }
});

test("the separately stored WordPress event is present in the local archive", () => {
  assert.ok(events.some((event) => event.slug === "knowledge-day-2021"));
});
