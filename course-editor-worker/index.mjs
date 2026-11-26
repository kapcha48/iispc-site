import yaml from "js-yaml";
import photos from "../app/content/course-pilot-photos.json" with { type: "json" };

const site = "https://kapcha48.github.io";
const ownerId = 310751599;
const repositoryId = "1389040570";
const branch = "preview";
const course = "/repos/kapcha48/iispc-site/contents/content/programs/course-14937.md";
const cookie = "__Host-iispc-oauth";
const cookieAttributes = "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=";
const strings = { title: 180, excerpt: 2400, cover: 500, coverAlt: 220 };
const coverChoices = new Set(photos.map(({ path }) => path));
const utf8 = new TextEncoder();
const decode = new TextDecoder("utf-8", { fatal: true });
const clean = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };

function base64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
const unbase64 = (value) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
const encode64 = (bytes) => base64(bytes).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
const decode64 = (value) => unbase64(value.replaceAll("-", "+").replaceAll("_", "/"));
const random = (size) => encode64(crypto.getRandomValues(new Uint8Array(size)));

async function seal(key, value, scope) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: utf8.encode(scope) }, key, utf8.encode(JSON.stringify(value)));
  return `${encode64(iv)}.${encode64(new Uint8Array(encrypted))}`;
}

async function unseal(key, value, scope) {
  if (!value || !/^[\w-]{16}\.[\w-]{20,2000}$/.test(value)) return null;
  try {
    const [nonce, payload] = value.split(".");
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decode64(nonce), additionalData: utf8.encode(scope) }, key, decode64(payload));
    const data = JSON.parse(decode.decode(plain));
    return data.expiresAt > Date.now() ? data : null;
  } catch { return null; }
}

function api(value, status = 200, cors = true) {
  return Response.json(value, { status, headers: { ...clean, Vary: "Origin", ...(cors ? { "Access-Control-Allow-Origin": site } : {}) } });
}
const fail = (error, status) => api({ error }, status);

function authResult(data, status = 200) {
  const nonce = random(16);
  const message = JSON.stringify({ type: "iispc-course-session", ...data }).replaceAll("<", "\\u003c");
  const description = data.token ? "Вход выполнен. Вернитесь к странице курса." : "Вход не выполнен. Вернитесь к странице курса и попробуйте снова.";
  return new Response(`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Вход в редактор IISPC</title><main><h1>${description}</h1></main><script nonce="${nonce}">if (window.opener) { window.opener.postMessage(${message}, ${JSON.stringify(site)}); window.close(); }</script></html>`, {
    status, headers: { ...clean, "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": `default-src 'none'; base-uri 'none'; frame-ancestors 'none'; script-src 'nonce-${nonce}'`, "Set-Cookie": `${cookie}=${cookieAttributes}0` },
  });
}

const github = (path, token, options = {}) => fetch(`https://api.github.com${path}`, {
  ...options, redirect: "error", signal: AbortSignal.timeout(10000),
  headers: { Accept: "application/vnd.github+json", "User-Agent": "IISPC-course-editor", "X-GitHub-Api-Version": "2022-11-28", Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {}) },
});

function parseCourse(source) {
  const match = source.match(/^(\uFEFF?---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$)[\s\S]*)$/);
  if (!match) throw new Error("Missing frontmatter");
  const data = yaml.load(match[2], { schema: yaml.CORE_SCHEMA });
  if (!data || typeof data !== "object" || Array.isArray(data) || data.status !== "published" || data.slug !== "course-14937") throw new Error("Unexpected course record");
  return { data, match };
}

function fields(record) {
  return Object.fromEntries(Object.keys(strings).map((field) => [field, typeof record[field] === "string" ? record[field].trim() : ""]));
}

async function readEdit(request) {
  if (!request.headers.get("content-type")?.startsWith("application/json") || !request.body) return null;
  const reader = request.body.getReader();
  let data = "";
  let length = 0;
  const bodyDecoder = new TextDecoder("utf-8", { fatal: true });
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 16384) { await reader.cancel(); return null; }
      data += bodyDecoder.decode(value, { stream: true });
    }
    const edit = JSON.parse(data + bodyDecoder.decode());
    if (!edit || typeof edit !== "object" || Object.keys(edit).sort().join() !== "cover,coverAlt,excerpt,revision,title") return null;
    if (typeof edit.revision !== "string" || !/^[a-f0-9]{40}$/.test(edit.revision)) return null;
    for (const [key, limit] of Object.entries(strings)) {
      if (typeof edit[key] !== "string" || edit[key].length > limit || Array.from(edit[key]).some((character) => {
        const code = character.charCodeAt(0);
        return code === 127 || (code < 32 && ![9, 10, 13].includes(code));
      })) return null;
    }
    const value = fields(edit);
    if (!value.title || !value.excerpt || /[\r\n]/.test(value.title + value.cover + value.coverAlt)) return null;
    return { ...value, revision: edit.revision };
  } catch { return null; }
}

async function updateCourse(request, token) {
  const edit = request.method === "PUT" ? await readEdit(request) : null;
  if (request.method === "PUT" && !edit) return fail("Проверьте заголовок, описание и обложку.", 400);
  const response = await github(`${course}?ref=${branch}`, token);
  if (response.status === 401) return fail("Вход истёк. Войдите через GitHub ещё раз.", 401);
  if ([403, 404].includes(response.status)) return fail("У редактора нет доступа к записи курса.", 403);
  if (!response.ok) return fail("Не удалось загрузить курс. Попробуйте ещё раз.", 502);
  const file = await response.json();
  if (file.type !== "file" || file.encoding !== "base64" || typeof file.content !== "string" || typeof file.sha !== "string") return fail("Карточка курса недоступна.", 502);
  const { data, match } = parseCourse(decode.decode(unbase64(file.content)));
  const current = fields(data);
  if (!edit) return api({ ...current, revision: file.sha });
  if (edit.revision !== file.sha) return fail("Курс уже изменился. Скопируйте свои правки и откройте редактор заново.", 409);
  if (edit.cover !== current.cover && !coverChoices.has(edit.cover)) return fail("Выберите обложку из списка.", 400);
  const revised = fields(edit);
  if (Object.keys(revised).every((name) => revised[name] === current[name])) return api({ ...current, revision: file.sha });
  const eol = match[1].endsWith("\r\n") ? "\r\n" : "\n";
  const frontmatter = yaml.dump({ ...data, ...revised }, { schema: yaml.CORE_SCHEMA, lineWidth: -1, noRefs: true }).trimEnd().replace(/\n/g, eol);
  const saved = await github(course, token, { method: "PUT", body: JSON.stringify({
    branch, sha: file.sha, message: "Обновить карточку курса «Психиатрия и аддиктология»",
    content: base64(utf8.encode(match[1] + frontmatter + match[3])),
  }) });
  if ([409, 422].includes(saved.status)) return fail("Не удалось сохранить текущую версию. Скопируйте свои правки и откройте редактор заново.", 409);
  if (saved.status === 401) return fail("Вход истёк. Войдите через GitHub ещё раз.", 401);
  if ([403, 404].includes(saved.status)) return fail("У редактора нет прав на сохранение.", 403);
  if (!saved.ok) return fail("GitHub не сохранил правки. Попробуйте ещё раз.", 502);
  const result = await saved.json();
  return api({ ...revised, revision: result.content.sha });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isAPI = url.pathname === "/api/course";
    const isAuth = url.pathname === "/auth/login" || url.pathname === "/auth/callback";
    if (!isAPI && !isAuth) return new Response(null, { status: 404, headers: clean });
    if (isAPI && request.headers.get("origin") !== site) return api({ error: "Недоступно с этого адреса." }, 403, false);
    if (isAPI && request.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...clean, Vary: "Origin", "Access-Control-Allow-Origin": site, "Access-Control-Allow-Methods": "GET, PUT, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Max-Age": "300" } });
    if ((isAPI && !["GET", "PUT"].includes(request.method)) || (isAuth && request.method !== "GET")) return fail("Недопустимое действие.", 405);

    try {
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.SESSION_KEY || env.WORKER_ORIGIN !== url.origin) {
        return isAPI ? fail("Вход ещё не подключён.", 503) : authResult({ error: "Вход ещё не подключён." }, 503);
      }
      const keyBytes = decode64(env.SESSION_KEY);
      if (keyBytes.length !== 32) throw new Error("Invalid key");
      const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
      if (isAPI) {
        const bearer = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
        const session = await unseal(key, bearer, "session");
        if (session?.owner !== ownerId || typeof session.token !== "string") return fail("Войдите через GitHub.", 401);
        return await updateCourse(request, session.token);
      }

      const callback = `${env.WORKER_ORIGIN}/auth/callback`;
      if (url.pathname === "/auth/login") {
        const state = random(24);
        const verifier = random(32);
        const challenge = encode64(new Uint8Array(await crypto.subtle.digest("SHA-256", utf8.encode(verifier))));
        const value = await seal(key, { state, verifier, expiresAt: Date.now() + 600000 }, "oauth");
        const authorization = new URL("https://github.com/login/oauth/authorize");
        authorization.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, redirect_uri: callback, state, code_challenge: challenge, code_challenge_method: "S256" });
        return new Response(null, { status: 302, headers: { ...clean, Location: authorization.href, "Set-Cookie": `${cookie}=${value}${cookieAttributes}600` } });
      }

      const code = url.searchParams.get("code");
      const cookieValue = request.headers.get("cookie")?.split(/;\s*/).find((part) => part.startsWith(`${cookie}=`))?.slice(cookie.length + 1);
      const flow = await unseal(key, cookieValue, "oauth");
      if (!flow || flow.state !== url.searchParams.get("state") || !code || code.length > 512) return authResult({ error: "Не удалось подтвердить вход. Попробуйте снова." }, 400);
      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(10000),
        headers: { Accept: "application/json" },
        body: new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, code_verifier: flow.verifier, redirect_uri: callback, repository_id: repositoryId }),
      });
      const result = response.ok ? await response.json() : {};
      if (typeof result.access_token !== "string" || !result.access_token.startsWith("ghu_")) return authResult({ error: "GitHub не подтвердил вход." }, 401);
      const account = await github("/user", result.access_token);
      const identity = account.ok ? await account.json() : {};
      if (identity.id !== ownerId) return authResult({ error: "Сохранять правки может только владелец сайта." }, 403);
      const token = await seal(key, { token: result.access_token, owner: identity.id, expiresAt: Date.now() + 1200000 }, "session");
      return authResult({ token });
    } catch {
      return isAPI ? fail("Редактор временно недоступен. Попробуйте ещё раз.", 503) : authResult({ error: "Редактор временно недоступен. Попробуйте ещё раз." }, 503);
    }
  },
};
