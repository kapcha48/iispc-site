import { readFile, writeFile, lstat } from "node:fs/promises";
import yaml from "js-yaml";

const fields = {
  sections: new Set(["title", "excerpt"]),
  programs: new Set(["title", "excerpt", "cover"]),
  people: new Set(["title", "role", "degree", "excerpt", "cover"]),
};
const payload = JSON.parse(process.env.CMS_PAYLOAD ?? "{}");
if (payload.source !== "pages-cms" || payload.action?.name !== "import-visual-edits" || payload.repository?.ref !== "preview") {
  throw new Error("Откройте админку в ветке preview и воспользуйтесь командой импорта.");
}
const raw = payload.inputs?.changes;
if (typeof raw !== "string" || raw.length > 12000) throw new Error("Пакет правок отсутствует или слишком велик.");
const edits = JSON.parse(raw);
if (!Array.isArray(edits) || !edits.length || edits.length > 50) throw new Error("В пакете должно быть от 1 до 50 правок.");

async function coverExists(value) {
  if (!/^\/archive\/source\/[^\\?#]+\.(jpg|jpeg|png|webp|gif)$/i.test(value)) return false;
  let decoded;
  try { decoded = decodeURIComponent(value); } catch { return false; }
  const parts = decoded.slice(1).split("/");
  if (parts.some((part) => !part || part === "." || part === ".." || part.includes("\\"))) return false;
  let current = "public";
  for (const part of parts) {
    current += "/" + part;
    const stat = await lstat(current).catch(() => null);
    if (!stat || stat.isSymbolicLink()) return false;
    if (current === "public" + decoded) return stat.isFile();
  }
  return false;
}

const files = new Map();
for (const edit of edits) {
  const path = edit?.path;
  const match = typeof path === "string" && path.match(/^content\/(sections|programs|people)\/[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?\.md$/u);
  if (!match || !fields[match[1]].has(edit.field) ||
      typeof edit.before !== "string" || typeof edit.after !== "string" ||
      !edit.after.trim() || edit.after.length > 6000) throw new Error("Недопустимое поле или значение.");
  if (!files.has(path)) {
    if (!(await lstat("content")).isDirectory() ||
        !(await lstat("content/" + match[1])).isDirectory() ||
        !(await lstat(path)).isFile()) throw new Error("Материал отсутствует: " + path);
    const file = await readFile(path, "utf8");
    const parts = file.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?=\r?\n|$)([\s\S]*)$/);
    if (!parts) throw new Error("Не удалось прочитать материал: " + path);
    const data = yaml.load(parts[1], { schema: yaml.CORE_SCHEMA });
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Недопустимый формат материала.");
    if (match[1] !== "sections" && data.status !== "published") throw new Error("Материал больше не доступен в предпросмотре.");
    files.set(path, { data, body: parts[2] });
  }
  const { data } = files.get(path);
  const current = typeof data[edit.field] === "string" ? data[edit.field].trim() : "";
  const after = edit.after.trim();
  if (current === after) continue;
  if (current !== edit.before) throw new Error("Материал уже изменён. Обновите предпросмотр: " + path);
  if (edit.field === "cover" && !(await coverExists(after))) throw new Error("Фото не найдено в медиатеке.");
  data[edit.field] = after;
  files.get(path).changed = true;
}
for (const [path, { data, body, changed }] of files) {
  if (changed) await writeFile(path, "---\n" + yaml.dump(data, { schema: yaml.CORE_SCHEMA, lineWidth: -1 }) + "---" + body);
}
console.log("Правки проверены. Материалов: " + files.size);
