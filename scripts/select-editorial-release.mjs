import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

const main = git("rev-parse", "HEAD");
const candidate = git("for-each-ref", "--format=%(objectname)", "refs/remotes/origin/preview") || main;
const commonBase = git("merge-base", main, candidate);
const preview = commonBase === candidate ? main : candidate;
const rawPayload = process.env.CMS_PAYLOAD;
let promote = false;

if (rawPayload) {
  const payload = JSON.parse(rawPayload);
  if (payload.source !== "pages-cms" || payload.action?.name !== "publish-preview" || payload.repository?.ref !== "preview") {
    throw new Error("Откройте версию preview в Pages CMS и запустите публикацию в ней.");
  }
  if (payload.repository?.sha !== candidate) {
    throw new Error("Предпросмотр уже обновился. Проверьте свежую версию и запустите публикацию снова.");
  }
  if (candidate !== main && commonBase !== main) {
    throw new Error("Код сайта изменился после начала редактирования. Обновите ветку preview из main перед публикацией.");
  }
  promote = candidate !== main;
}

const changedPaths = git("diff", "--no-renames", "--name-only", "-z", commonBase, candidate).split("\0").filter(Boolean);
if (changedPaths.some((file) => !file.startsWith("content/") && !file.startsWith("public/archive/source/"))) {
  throw new Error("В версии preview можно менять материалы и медиафайлы сайта.");
}

appendFileSync(process.env.GITHUB_OUTPUT, [
  "main_sha=" + main,
  "preview_sha=" + preview,
  "promote=" + promote,
  "",
].join("\n"));
