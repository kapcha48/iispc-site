import assert from "node:assert/strict";
import test from "node:test";
import yaml from "js-yaml";
import worker from "../course-editor-worker/index.mjs";

const origin = "https://kapcha48.github.io";
const workerOrigin = "https://editor.example.test";
const coursePath = "/repos/kapcha48/iispc-site/contents/content/programs/course-14937.md";
const revision = "a".repeat(40);
const updatedRevision = "b".repeat(40);
const currentCover = "/archive/source/2024/05/babochka.jpg";
const nextCover = "/archive/source/2022/12/777-1.png";
const env = {
  WORKER_ORIGIN: workerOrigin,
  GITHUB_CLIENT_ID: "mock-client-id",
  GITHUB_CLIENT_SECRET: "mock-client-secret",
  SESSION_KEY: Buffer.alloc(32, 12).toString("base64url"),
};
const body = "\r\n## Программа\r\n\r\nТекст курса  \r\n---\r\n";
const source = [
  "---", "slug: course-14937", "status: published", "title: Исходный заголовок",
  "excerpt: Исходное описание", `cover: ${currentCover}`, "coverAlt: Исходная подпись",
  "unknownSetting: keep-me", "---", "",
].join("\r\n") + body;

function mockGithub(t, owner = 310751599) {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (target, options = {}) => {
    const url = new URL(target);
    const method = options.method ?? "GET";
    calls.push({ url, method, options });
    if (url.href === "https://github.com/login/oauth/access_token" && method === "POST") return Response.json({ access_token: "ghu_for_unit_test_only" });
    if (url.href === "https://api.github.com/user" && method === "GET") return Response.json({ id: owner });
    if (url.href === `https://api.github.com${coursePath}?ref=preview` && method === "GET") {
      return Response.json({ type: "file", encoding: "base64", content: Buffer.from(source).toString("base64"), sha: revision });
    }
    if (url.href === `https://api.github.com${coursePath}` && method === "PUT") return Response.json({ content: { sha: updatedRevision } });
    throw new Error(`Unexpected outbound request: ${method} ${url}`);
  });
  return calls;
}

async function auth({ tamperState = false } = {}) {
  const start = await worker.fetch(new Request(`${workerOrigin}/auth/login`), env);
  assert.equal(start.status, 302);
  const destination = new URL(start.headers.get("location"));
  assert.equal(destination.origin, "https://github.com");
  assert.equal(destination.searchParams.get("code_challenge_method"), "S256");
  assert.match(start.headers.get("set-cookie"), /HttpOnly; Secure; SameSite=Lax/);
  const state = destination.searchParams.get("state");
  const callback = new URL(`${workerOrigin}/auth/callback`);
  callback.searchParams.set("code", "mock-code");
  callback.searchParams.set("state", tamperState ? "wrong-state" : state);
  const response = await worker.fetch(new Request(callback, {
    headers: { cookie: start.headers.get("set-cookie").split(";")[0] },
  }), env);
  const html = await response.text();
  const token = html.match(/"token":"([^"]+)"/)?.[1];
  return { response, token, html };
}

function api({ token, requestOrigin = origin, edit } = {}) {
  return worker.fetch(new Request(`${workerOrigin}/api/course`, {
    method: edit === undefined ? "GET" : "PUT",
    headers: {
      Origin: requestOrigin,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(edit === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: edit === undefined ? undefined : JSON.stringify(edit),
  }), env);
}

const validEdit = { title: "Новый заголовок", excerpt: "Описание\nиз двух строк", cover: nextCover, coverAlt: "Подпись", revision };

test("course editor rejects requests without a session or from a different origin", async (t) => {
  const calls = mockGithub(t);
  assert.equal((await api({ edit: validEdit })).status, 401);
  const crossOrigin = await api({ requestOrigin: "https://unrelated.example.test", edit: validEdit });
  assert.equal(crossOrigin.status, 403);
  assert.equal(crossOrigin.headers.get("Access-Control-Allow-Origin"), null);
  assert.deepEqual(calls, []);
});

test("course editor does not grant a session to another GitHub user", async (t) => {
  const calls = mockGithub(t, 310751600);
  const { response, token } = await auth();
  assert.equal(response.status, 403);
  assert.equal(token, undefined);
  assert.deepEqual(calls.map(({ url }) => url.pathname), ["/login/oauth/access_token", "/user"]);
  assert.equal((await api()).status, 401);
});

test("course editor rejects mismatched OAuth state before token exchange", async (t) => {
  const calls = mockGithub(t);
  const { response, token } = await auth({ tamperState: true });
  assert.equal(response.status, 400);
  assert.equal(token, undefined);
  assert.deepEqual(calls, []);
});

test("owner saves only the existing course in preview, leaving its main body unchanged", async (t) => {
  const calls = mockGithub(t);
  const { response, token, html } = await auth();
  assert.equal(response.status, 200);
  assert.ok(token);
  assert.doesNotMatch(html, /ghu_for_unit_test_only/);
  assert.equal(calls[0].options.body.get("repository_id"), "1389040570");
  const before = await api({ token });
  assert.equal(before.status, 200);
  assert.equal((await before.json()).revision, revision);

  const saved = await api({ token, edit: validEdit });
  assert.equal(saved.status, 200);
  assert.deepEqual(await saved.json(), { ...validEdit, revision: updatedRevision });
  const writes = calls.filter(({ method }) => method === "PUT");
  assert.equal(writes.length, 1);
  assert.equal(writes[0].url.href, `https://api.github.com${coursePath}`);
  const request = JSON.parse(writes[0].options.body);
  assert.equal(request.branch, "preview");
  assert.equal(request.sha, revision);
  const revised = Buffer.from(request.content, "base64").toString("utf8");
  const [, frontmatter, preserved] = revised.match(/^---\r\n([\s\S]*?)\r\n---\r\n([\s\S]*)$/);
  assert.equal(preserved, body);
  const parsed = yaml.load(frontmatter, { schema: yaml.CORE_SCHEMA });
  const expectedEdit = { ...validEdit };
  delete expectedEdit.revision;
  assert.deepEqual(parsed, { slug: "course-14937", status: "published", ...expectedEdit, unknownSetting: "keep-me" });
});

test("stale edits, arbitrary cover URLs, and unexpected fields never reach GitHub writes", async (t) => {
  const calls = mockGithub(t);
  const { token } = await auth();
  assert.ok(token);
  assert.equal((await api({ token, edit: { ...validEdit, revision: "c".repeat(40) } })).status, 409);
  assert.equal((await api({ token, edit: { ...validEdit, cover: "https://unrelated.example.test/image.jpg" } })).status, 400);
  assert.equal((await api({ token, edit: { ...validEdit, branch: "main" } })).status, 400);
  assert.equal(calls.filter(({ method }) => method === "PUT").length, 0);
});
