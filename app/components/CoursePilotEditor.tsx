"use client";

import Image from "next/image";
import { createContext, useContext, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { staticBase } from "../lib/static-path";

type Course = { title: string; excerpt: string; cover: string; coverAlt: string };
type Version = Course & { revision: string };
type Photo = { path: string; label: string };
type Field = "title" | "excerpt" | "cover";
type Busy = "login" | "load" | "save" | null;
const fields = ["title", "excerpt", "cover", "coverAlt"] as const;
const cms = "https://app.pagescms.org/kapcha48/iispc-site/preview";
const connectionError = "Не удалось связаться с редактором. Попробуйте ещё раз.";
const labels = { title: "Название курса", excerpt: "Краткое описание", cover: "Обложка курса" };

function endpointOrigin(endpoint?: string) {
  try {
    const url = new URL(endpoint ?? "");
    return url.protocol === "https:" && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash ? url.origin : "";
  } catch { return ""; }
}

function isArchivePhoto(path: string) {
  try {
    const decoded = decodeURIComponent(path);
    return decoded.startsWith("/archive/source/") && /\.(?:jpe?g|png|webp|avif|gif)$/i.test(decoded) &&
      !/[?#\\]/.test(decoded) && !Array.from(decoded).some((character) => character.charCodeAt(0) < 32) &&
      !decoded.split("/").slice(1).some((part) => !part || part === "." || part === "..");
  } catch { return false; }
}

function isVersion(data: unknown): data is Version {
  if (!data || typeof data !== "object") return false;
  const row = data as Record<string, unknown>;
  return fields.every((key) => typeof row[key] === "string") &&
    (row.cover === "" || isArchivePhoto(row.cover as string)) && typeof row.revision === "string" && !!row.revision;
}

class CourseError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function requestCourse(origin: string, token: string, course?: Version): Promise<Version> {
  const response = await fetch(origin + "/api/course", {
    method: course ? "PUT" : "GET",
    headers: { Authorization: "Bearer " + token, ...(course ? { "Content-Type": "application/json" } : {}) },
    body: course ? JSON.stringify(course) : undefined,
    cache: "no-store",
    credentials: "omit",
    redirect: "error",
    referrerPolicy: "no-referrer",
    signal: AbortSignal.timeout(15_000),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data && typeof data === "object" && "error" in data ? data.error : null;
    throw new CourseError(typeof message === "string" ? message : connectionError, response.status);
  }
  if (!isVersion(data)) throw new Error(connectionError);
  return data;
}

type EditorState = {
  course: Course; photos: Photo[]; active: boolean; field: Field | null; busy: Busy; toolbar: ReactNode;
  selectField: (field: Field | null) => void;
  change: (key: keyof Course, value: string) => void;
};

const EditorContext = createContext<EditorState | null>(null);
function useEditor() {
  const context = useContext(EditorContext);
  if (!context) throw new Error("CoursePilotEditor is required");
  return context;
}

export function CoursePilotEditor({ initial, endpoint, photos, children }: {
  initial: Course; endpoint?: string; photos: Photo[]; children: ReactNode;
}) {
  const origin = endpointOrigin(endpoint);
  const [course, setCourse] = useState<Course>(initial);
  const [saved, setSaved] = useState<Version>({ ...initial, revision: "" });
  const [token, setToken] = useState("");
  const [active, setActive] = useState(false);
  const [field, selectField] = useState<Field | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState<Version | true | null>(null);
  const stopLogin = useRef<(() => void) | null>(null);
  const dirty = fields.some((key) => course[key] !== saved[key]);

  useEffect(() => () => stopLogin.current?.(), []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function apply(version: Version, keepEdits = false) {
    setSaved(version);
    if (!keepEdits) setCourse({ title: version.title, excerpt: version.excerpt, cover: version.cover, coverAlt: version.coverAlt });
    setConflict(null);
  }

  function fail(reason: unknown) {
    if (reason instanceof CourseError && (reason.status === 401 || reason.status === 403)) {
      setToken("");
      setError(reason.status === 403 ? "У этой учётной записи нет прав на курс." : "Вход истёк. Войдите снова. Правки пока остаются на странице.");
    } else if (reason instanceof CourseError && reason.status === 409) {
      setConflict(true);
      setError("Курс уже изменили. Ваши правки не перезаписали запись. Можно загрузить текущую версию.");
    } else {
      setError(reason instanceof CourseError ? reason.message : connectionError);
    }
  }

  function signIn() {
    if (!origin) return;
    stopLogin.current?.();
    setNotice("");
    setError("");
    const popup = window.open(origin + "/auth/login", "iispc-course-login", "popup,width=620,height=670");
    if (!popup) { setError("Браузер не открыл окно входа. Разрешите всплывающие окна и повторите."); return; }
    setBusy("login");
    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener("message", receive);
      stopLogin.current = null;
      popup.close();
    };
    const receive = (event: MessageEvent) => {
      if (event.origin !== origin || event.source !== popup || event.data?.type !== "iispc-course-session") return;
      cleanup();
      if (typeof event.data.token !== "string" || !event.data.token) {
        setBusy(null);
        setError(typeof event.data.error === "string" ? event.data.error : "Не удалось войти. Выберите учётную запись владельца сайта.");
        return;
      }
      const nextToken: string = event.data.token;
      setBusy("load");
      void requestCourse(origin, nextToken).then((version) => {
        setToken(nextToken);
        if (dirty && saved.revision !== version.revision) {
          setConflict(version);
          setError("После выхода курс изменился. Загрузите текущую версию перед новой правкой.");
        } else {
          apply(version, dirty);
        }
        setActive(true);
      }).catch(fail).finally(() => setBusy(null));
    };
    const timer = window.setTimeout(() => {
      cleanup();
      setBusy(null);
      setError("Не получили подтверждение входа. Попробуйте ещё раз.");
    }, 180_000);
    stopLogin.current = cleanup;
    window.addEventListener("message", receive);
  }

  async function save() {
    if (!origin || !token || !dirty || !saved.revision || conflict || busy) return;
    if (!course.title.trim() || !course.excerpt.trim()) {
      const missing = !course.title.trim() ? "title" : "excerpt";
      selectField(missing);
      setError(missing === "title" ? "Введите название курса." : "Введите краткое описание.");
      return;
    }
    setBusy("save");
    setError("");
    setNotice("");
    try {
      const request = { title: course.title, excerpt: course.excerpt, cover: course.cover, coverAlt: course.coverAlt, revision: saved.revision };
      apply(await requestCourse(origin, token, request));
      selectField(null);
      setNotice("Правки сохранены для предпросмотра. Для обновления сайта нужна отдельная публикация.");
    } catch (reason) { fail(reason); }
    finally { setBusy(null); }
  }

  async function loadLatest() {
    if (!token || !conflict || busy || !window.confirm("Заменить несохранённые правки текущей версией курса?")) return;
    setError("");
    setBusy("load");
    try {
      apply(conflict === true ? await requestCourse(origin, token) : conflict);
      setNotice("Загружена текущая версия.");
    } catch (reason) { fail(reason); }
    finally { setBusy(null); }
  }

  function closeEditor() {
    if (dirty && !window.confirm("Отменить несохранённые правки курса?")) return;
    setActive(false);
    selectField(null);
    setCourse(saved);
    setConflict(null);
    setError("");
    setNotice("");
    setToken("");
  }

  const toolbar = (
    <section className="course-pilot-tools" aria-label="Визуальный редактор курса" id="course-pilot-tools">
      <div className="course-pilot-tools__label">
        <strong>{origin ? "Визуальный редактор" : "Пробный визуальный редактор"}</strong>
        <p>{!origin ? "Правки видны только в этой вкладке. Сохранение на сайт не подключено."
          : active ? "Выберите заголовок, описание или обложку. Дизайн страницы не меняется."
            : "Войдите как владелец сайта, чтобы править курс прямо здесь."}</p>
      </div>
      <div className="course-pilot-tools__actions">
        {origin && !token && (
          <button className="course-pilot-control course-pilot-primary" type="button" onClick={signIn} disabled={busy === "load" || busy === "save"}>
            {busy === "login" ? "Открыть окно входа снова" : busy === "load" ? "Проверяем доступ…" : "Войти через GitHub"}
          </button>
        )}
        {!origin && !active && <button className="course-pilot-control course-pilot-primary" type="button" onClick={() => setActive(true)}>Попробовать правку</button>}
        {active && (
          <>
            <button className="course-pilot-control course-pilot-primary" type="button" onClick={() => void save()} disabled={!origin || !token || !dirty || !!busy || !!conflict}>
              {busy === "save" ? "Сохраняем…" : "Сохранить в предпросмотр"}
            </button>
            <button className="course-pilot-control" type="button" onClick={closeEditor} disabled={!!busy}>{dirty ? "Отменить правки" : "Закрыть редактор"}</button>
            {!!conflict && token && <button className="course-pilot-control" type="button" onClick={() => void loadLatest()} disabled={!!busy}>Загрузить текущую версию</button>}
          </>
        )}
        {token && !dirty && <a href={cms} target="_blank" rel="noopener noreferrer" className="course-pilot-control">Открыть публикацию в админке</a>}
      </div>
      {error && <p className="course-pilot-feedback course-pilot-feedback--error" role="alert">{error}</p>}
      <p className="course-pilot-feedback" role="status">{notice || (token && !dirty ? "В админке команда публикации применит все проверенные правки, не только этот курс." : "")}</p>
    </section>
  );

  return (
    <EditorContext.Provider value={{ course, photos, active, field, selectField, change: (key, value) => setCourse((previous) => ({ ...previous, [key]: value })), busy, toolbar }}>
      {children}
    </EditorContext.Provider>
  );
}

function EditTarget({ name, label, children }: { name: Field; label: string; children: ReactNode }) {
  const { active, field, selectField, busy } = useEditor();
  if (!active) return children;
  return (
    <button className="course-pilot-target" type="button" aria-expanded={field === name} aria-controls={field === name ? "course-pilot-" + name : undefined} data-course-field={name}
      onClick={() => selectField(field === name ? null : name)} disabled={busy === "save" || busy === "load"}>
      {children}
      <span className="course-pilot-target__badge">{label}</span>
    </button>
  );
}

function FieldEditor({ name }: { name: Field }) {
  const { active, course, photos, change, field, selectField, busy } = useEditor();
  const control = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null);
  useEffect(() => { if (active && field === name) control.current?.focus(); }, [active, field, name]);
  if (!active || field !== name) return null;
  const id = "course-pilot-" + name;
  const valueId = id + "-value";
  function close() {
    const target = document.querySelector<HTMLButtonElement>("[data-course-field=" + name + "]");
    selectField(null);
    target?.focus();
  }
  function closeOnEscape(event: KeyboardEvent) {
    if (event.key === "Escape") { event.preventDefault(); close(); }
  }
  return (
    <fieldset className="course-pilot-field" id={id} disabled={busy === "save" || busy === "load"}>
      <legend>{labels[name]}</legend>
      {name === "title" && <input ref={(node) => { control.current = node; }} id={valueId} aria-label={labels.title} value={course.title} maxLength={180} onKeyDown={closeOnEscape} onChange={(event) => change(name, event.target.value)} />}
      {name === "excerpt" && <textarea ref={(node) => { control.current = node; }} id={valueId} aria-label={labels.excerpt} value={course.excerpt} rows={4} maxLength={2400} onKeyDown={closeOnEscape} onChange={(event) => change(name, event.target.value)} />}
      {name === "cover" && (
        <>
          <label htmlFor={valueId}>Выберите фото из медиатеки</label>
          <select ref={(node) => { control.current = node; }} id={valueId} value={course.cover} onKeyDown={closeOnEscape} onChange={(event) => {
            change("cover", event.target.value);
            change("coverAlt", "");
          }}>
            {course.cover && !photos.some((photo) => photo.path === course.cover) && <option value={course.cover}>Текущая обложка</option>}
            {!course.cover && <option value="">Без обложки</option>}
            {photos.map((photo) => <option key={photo.path} value={photo.path}>{photo.label}</option>)}
          </select>
          <label htmlFor={id + "-alt"}>Описание фото</label>
          <input id={id + "-alt"} value={course.coverAlt} maxLength={220} onKeyDown={closeOnEscape} onChange={(event) => change("coverAlt", event.target.value)} />
        </>
      )}
      <div className="course-pilot-tools__actions">
        <button className="course-pilot-control" type="button" onClick={close}>Готово</button>
        {name === "cover" && <a className="course-pilot-control" href="#course-pilot-tools">К сохранению</a>}
      </div>
    </fieldset>
  );
}

export function CoursePilotHeader() {
  const { course, toolbar, active } = useEditor();
  return (
    <>
      <h1><EditTarget name="title" label="Изменить название">{course.title || (active ? "Название курса" : "")}</EditTarget></h1>
      <FieldEditor name="title" />
      <p className="article-intro"><EditTarget name="excerpt" label="Изменить описание">{course.excerpt || (active ? "Краткое описание" : "")}</EditTarget></p>
      <FieldEditor name="excerpt" />
      {toolbar}
    </>
  );
}

export function CoursePilotCover() {
  const { course, active } = useEditor();
  if (!active && !course.cover) return null;
  return (
    <div className="shell article-cover">
      <EditTarget name="cover" label={course.cover ? "Заменить обложку" : "Добавить обложку"}>
        {course.cover && <Image src={staticBase + course.cover} alt={course.coverAlt} width={1600} height={900} sizes="(max-width: 1080px) 100vw, 1080px" unoptimized />}
      </EditTarget>
      <FieldEditor name="cover" />
    </div>
  );
}
