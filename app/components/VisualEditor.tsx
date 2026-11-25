"use client";

import { useEffect, useRef, useState } from "react";
import { withStaticBase } from "../lib/static-path";

type Edit = { path: string; field: string; before: string; after: string };
type Selected = Edit & { label: string };
const selector = "[data-edit-path][data-edit-field]";
const storageKey = "iispc-visual-draft-v1";
const cms = "https://app.pagescms.org/kapcha48/iispc-site/preview";

function splitEdits(source: string | null): Edit[] {
  try {
    const saved: unknown = JSON.parse(source ?? "[]");
    return Array.isArray(saved) ? saved.filter((item) =>
      item && ["path", "field", "before", "after"].every((key) => typeof item[key] === "string")) : [];
  } catch {
    return [];
  }
}

export function VisualEditor() {
  const [active, setActive] = useState(false);
  const [edits, setEdits] = useState<Edit[]>([]);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const form = useRef<HTMLDialogElement>(null);
  const handoff = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement>(null);

  function update(next: Edit[]) {
    setEdits(next);
    try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Temporary edits still work in this page. */ }
  }

  function start() {
    try { setEdits(splitEdits(sessionStorage.getItem(storageKey))); } catch { setEdits([]); }
    setActive(true);
  }

  useEffect(() => {
    if (!active) return;
    const main = document.getElementById("main-content");
    if (!main) return;
    const elements = [...main.querySelectorAll<HTMLElement>(selector)];
    const initial = elements.map((element) => ({
      element, text: element.textContent, src: element.getAttribute("src"), tabIndex: element.getAttribute("tabindex"),
    }));
    for (const element of elements) {
      element.tabIndex = 0;
      const edit = edits.find((item) => item.path === element.dataset.editPath && item.field === element.dataset.editField && item.before === element.dataset.editValue);
      if (edit) {
        if (element instanceof HTMLImageElement) element.src = withStaticBase(edit.after);
        else element.textContent = edit.after;
      }
    }
    const open = (event: Event) => {
      if (event instanceof KeyboardEvent && !["Enter", " "].includes(event.key)) return;
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>(selector);
      if (!target || !main.contains(target)) return;
      event.preventDefault();
      const { editPath: path = "", editField: field = "", editValue: before = "", editLabel: label = "" } = target.dataset;
      const existing = edits.find((item) => item.path === path && item.field === field && item.before === before);
      trigger.current = target;
      setSelected({ path, field, before, after: existing?.after ?? before, label });
      setValue(existing?.after ?? before);
      setMessage("");
      form.current?.showModal();
    };
    main.setAttribute("data-visual-editing", "");
    main.addEventListener("click", open);
    main.addEventListener("keydown", open);
    return () => {
      main.removeAttribute("data-visual-editing");
      main.removeEventListener("click", open);
      main.removeEventListener("keydown", open);
      for (const { element, text, src, tabIndex } of initial) {
        if (element instanceof HTMLImageElement && src !== null) element.setAttribute("src", src);
        else if (element.textContent !== text) element.textContent = text;
        if (tabIndex === null) element.removeAttribute("tabindex");
        else element.setAttribute("tabindex", tabIndex);
      }
    };
  }, [active, edits]);

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const after = value.trim();
    if (!after || (selected.field === "cover" && !/^\/archive\/source\/[^\\?#]+\.(jpg|jpeg|png|webp|gif)$/i.test(after))) {
      setMessage(selected.field === "cover" ? "Укажите путь к фото из медиатеки /archive/source/." : "Заполните поле.");
      return;
    }
    const next = edits.filter((item) => item.path !== selected.path || item.field !== selected.field);
    if (after !== selected.before) next.push({ path: selected.path, field: selected.field, before: selected.before, after });
    if (JSON.stringify(next).length > 12000) {
      setMessage("Слишком много правок за раз. Передайте часть правок через админку.");
      return;
    }
    update(next);
    form.current?.close();
  }

  return (
    <>
      {active ? <>
        <button type="button" onClick={() => setActive(false)}>Выйти из режима</button>
        <button type="button" disabled={!edits.length} onClick={() => { setMessage(""); handoff.current?.showModal(); }}>Сохранить в админке ({edits.length})</button>
        <span>Нажмите на выделенный текст или фото.</span>
      </> : <button type="button" onClick={start}>Редактировать страницу</button>}
      <dialog ref={form} className="inline-edit-dialog" aria-labelledby="inline-edit-title" onClose={() => trigger.current?.focus()}>
        <form onSubmit={save}>
          <h2 id="inline-edit-title">{selected?.label ?? "Редактирование"}</h2>
          <label htmlFor="inline-edit-value">{selected?.field === "cover" ? "Путь к фотографии из медиатеки" : "Новый текст"}</label>
          <textarea id="inline-edit-value" value={value} maxLength={selected?.field === "cover" ? 900 : 6000} onChange={(event) => setValue(event.target.value)} />
          {selected?.field === "cover" && <p>Сначала загрузите фото в <a href={cms + "/media/default"} target="_blank" rel="noreferrer">медиатеке</a>, затем вставьте путь к нему.</p>}
          {message && <p role="alert">{message}</p>}
          <div className="inline-edit-buttons"><button className="button" type="submit">Применить</button><button type="button" onClick={() => form.current?.close()}>Отмена</button></div>
        </form>
      </dialog>
      <dialog ref={handoff} className="inline-edit-dialog" aria-labelledby="inline-save-title">
        <h2 id="inline-save-title">Передать правки в админку</h2>
        <p>Скопируйте пакет правок. В админке выберите «Принять правки со страницы» и вставьте пакет в поле. Для этого используется ваш вход через GitHub.</p>
        <textarea readOnly aria-label="Пакет правок" value={JSON.stringify(edits)} onFocus={(event) => event.target.select()} rows={3} />
        <div className="inline-edit-buttons">
          <button className="button" type="button" onClick={async () => {
            try { await navigator.clipboard.writeText(JSON.stringify(edits)); setMessage("Пакет скопирован."); }
            catch { setMessage("Выделите и скопируйте пакет вручную."); }
          }}>Скопировать пакет</button>
          <a href={cms} target="_blank" rel="noreferrer">Открыть админку</a>
          <button type="button" onClick={() => handoff.current?.close()}>Закрыть</button>
        </div>
        <p role="status">{message}</p>
        <button type="button" onClick={() => { update([]); handoff.current?.close(); }}>Очистить локальные правки</button>
      </dialog>
    </>
  );
}
