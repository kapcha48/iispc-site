"use client";

import Image from "next/image";
import {
  Archive, BookOpen, CalendarDays, CheckCircle2, ChevronRight, Clock3, ExternalLink,
  Eye, FileText, FlaskConical, ImageIcon, Images, Inbox, LayoutDashboard, Menu,
  MessageSquare, Newspaper, Paperclip, Pencil, Plus, Save, Search, Trash2,
  UploadCloud, UserRound, X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ContentItem, ContentStatus, ContentType, Inquiry, InquiryStatus, MediaFile } from "../lib/content-store";

type FormState = {
  id?: string; slug?: string; type: ContentType; title: string; excerpt: string;
  body: string; author: string; coverUrl: string | null; coverAlt: string;
  attachmentUrl: string | null; eventDate: string; location: string; status: ContentStatus;
};
type AdminSection = "overview" | "content" | "editor" | "media" | "inquiries";
type ContentFilter = ContentType | "all";

const emptyForm: FormState = {
  type: "news", title: "", excerpt: "", body: "", author: "", coverUrl: null,
  coverAlt: "", attachmentUrl: null, eventDate: "", location: "", status: "draft",
};
const typeLabels: Record<ContentType, string> = {
  news: "Новость", publication: "Научная публикация", event: "Мероприятие", gallery: "Фотоальбом",
};
const typeIcons: Record<ContentType, typeof Newspaper> = {
  news: Newspaper, publication: FlaskConical, event: CalendarDays, gallery: Images,
};
const statusLabels: Record<ContentStatus, string> = {
  draft: "Черновик", published: "Опубликовано", archived: "Архив",
};
const inquiryStatusLabels: Record<InquiryStatus, string> = {
  new: "Новое", reviewed: "В работе", closed: "Завершено",
};
const inquiryTopicLabels: Record<Inquiry["topic"], string> = {
  education: "Обучение", events: "Мероприятия", science: "Наука",
  international: "Сотрудничество", other: "Другой вопрос",
};
const draftStorageKey = "iispc-admin-local-draft-v1";

export function AdminDashboard({ initialItems, initialInquiries, initialMedia, displayName }: {
  initialItems: ContentItem[]; initialInquiries: Inquiry[]; initialMedia: MediaFile[]; displayName: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [media, setMedia] = useState(initialMedia);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [cover, setCover] = useState<File | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [mediaUpload, setMediaUpload] = useState<File | null>(null);
  const [mediaAlt, setMediaAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [section, setSection] = useState<AdminSection>("overview");
  const [filter, setFilter] = useState<ContentFilter>("all");
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [savedDraftAvailable, setSavedDraftAvailable] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return Boolean(window.localStorage.getItem(draftStorageKey)); }
    catch { return false; }
  });

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru");
    return items.filter((item) => {
      if (filter !== "all" && item.type !== filter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return `${item.title} ${item.excerpt} ${item.author}`.toLocaleLowerCase("ru").includes(normalizedQuery);
    });
  }, [filter, items, query, statusFilter]);

  const stats = useMemo(() => ({
    published: items.filter((item) => item.status === "published").length,
    drafts: items.filter((item) => item.status === "draft").length,
    media: media.length,
    inquiries: inquiries.filter((item) => item.status === "new").length,
  }), [inquiries, items, media]);

  useEffect(() => {
    if (!form.title.trim() && !form.excerpt.trim() && !form.body.trim()) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(draftStorageKey, JSON.stringify(form));
        setDraftSavedAt(Date.now());
        setSavedDraftAvailable(true);
      } catch { /* Server save remains available when browser storage is disabled. */ }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [form]);

  const update = (field: keyof FormState, value: string | null) => {
    setForm((current) => ({ ...current, [field]: value })); setMessage("");
  };
  function navigate(nextSection: AdminSection) {
    setSection(nextSection); setMobileNavOpen(false); setMessage("");
  }
  function startNew(type: ContentType = "news") {
    setForm({ ...emptyForm, type }); setCover(null); setAttachment(null); setAltText("");
    setShowPreview(false); navigate("editor");
  }
  function restoreLocalDraft() {
    try {
      const value = window.localStorage.getItem(draftStorageKey); if (!value) return;
      setForm({ ...emptyForm, ...JSON.parse(value) as FormState, id: undefined, slug: undefined });
      setMessage("Локальный черновик восстановлен"); navigate("editor");
    } catch { setMessage("Не удалось восстановить локальный черновик"); }
  }
  function clearLocalDraft() {
    try { window.localStorage.removeItem(draftStorageKey); } catch { /* no-op */ }
    setSavedDraftAvailable(false); setDraftSavedAt(null);
  }
  async function upload(file: File, alt: string) {
    const data = new FormData(); data.append("file", file); data.append("altText", alt);
    const response = await fetch("/api/admin/media", { method: "POST", body: data });
    const result = await response.json() as { url?: string; error?: string };
    if (!response.ok || !result.url) throw new Error(result.error || "Не удалось загрузить файл");
    return result.url;
  }
  async function refreshContent() {
    const response = await fetch("/api/admin/content", { cache: "no-store" });
    const result = await response.json() as { items?: ContentItem[] }; if (result.items) setItems(result.items);
  }
  async function refreshMedia() {
    const response = await fetch("/api/admin/media", { cache: "no-store" });
    const result = await response.json() as { media?: MediaFile[] }; if (result.media) setMedia(result.media);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(""); const uploadedUrls: string[] = [];
    try {
      const coverUrl = cover ? await upload(cover, altText) : form.coverUrl;
      if (cover && coverUrl) uploadedUrls.push(coverUrl);
      const attachmentUrl = attachment ? await upload(attachment, form.title) : form.attachmentUrl;
      if (attachment && attachmentUrl) uploadedUrls.push(attachmentUrl);
      const response = await fetch("/api/admin/content", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, coverUrl, coverAlt: cover ? altText : form.coverAlt,
          attachmentUrl, eventDate: form.eventDate || null, location: form.location || null }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Не удалось сохранить материал");
      await Promise.all([refreshContent(), refreshMedia()]); clearLocalDraft();
      setForm(emptyForm); setCover(null); setAttachment(null); setAltText("");
      setMessage(form.status === "published" ? "Материал опубликован" : "Черновик сохранён");
      setSection("content");
    } catch (error) {
      await Promise.allSettled(uploadedUrls.map((url) => fetch(`/api/admin/media?url=${encodeURIComponent(url)}`, { method: "DELETE" })));
      setMessage(error instanceof Error ? error.message : "Произошла ошибка");
    } finally { setBusy(false); }
  }
  function edit(item: ContentItem) {
    setForm({ id: item.id, slug: item.slug, type: item.type, title: item.title, excerpt: item.excerpt,
      body: item.body, author: item.author, coverUrl: item.coverUrl, coverAlt: item.coverAlt,
      attachmentUrl: item.attachmentUrl, eventDate: item.eventDate || "", location: item.location || "", status: item.status });
    setCover(null); setAttachment(null); setAltText(""); setShowPreview(false); navigate("editor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function remove(id: string) {
    if (!window.confirm("Удалить этот материал? Отменить действие будет невозможно.")) return;
    const response = await fetch(`/api/admin/content?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) { await Promise.all([refreshContent(), refreshMedia()]); setMessage("Материал удалён"); }
    else setMessage("Не удалось удалить материал");
  }
  async function uploadToLibrary(event: React.FormEvent) {
    event.preventDefault(); if (!mediaUpload) return; setBusy(true); setMessage("");
    try { await upload(mediaUpload, mediaAlt); await refreshMedia(); setMediaUpload(null); setMediaAlt(""); setMessage("Файл добавлен в медиатеку"); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось загрузить файл"); }
    finally { setBusy(false); }
  }
  function useMedia(item: MediaFile) {
    if (item.contentType === "application/pdf") setForm((current) => ({ ...current, type: "publication", attachmentUrl: item.url }));
    else setForm((current) => ({ ...current, coverUrl: item.url, coverAlt: item.altText || item.filename }));
    setMessage("Файл добавлен к материалу"); setSection("editor");
  }
  async function changeInquiryStatus(id: string, status: InquiryStatus) {
    const response = await fetch("/api/admin/inquiries", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (response.ok) setInquiries((current) => current.map((item) => item.id === id ? { ...item, status } : item));
  }
  async function removeInquiry(id: string) {
    if (!window.confirm("Удалить это обращение? Отменить действие будет невозможно.")) return;
    const response = await fetch(`/api/admin/inquiries?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) setInquiries((current) => current.filter((item) => item.id !== id));
  }

  const navigation = [
    { id: "overview" as const, label: "Обзор", icon: LayoutDashboard },
    { id: "content" as const, label: "Материалы", icon: FileText, badge: items.length },
    { id: "media" as const, label: "Медиатека", icon: Images, badge: media.length },
    { id: "inquiries" as const, label: "Обращения", icon: Inbox, badge: stats.inquiries || undefined },
  ];

  return <section className="admin-workspace">
    <button className="admin-mobile-menu" type="button" onClick={() => setMobileNavOpen((value) => !value)} aria-expanded={mobileNavOpen} aria-controls="admin-sidebar">{mobileNavOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}<span>Меню управления</span></button>
    <aside id="admin-sidebar" className={`admin-sidebar${mobileNavOpen ? " is-open" : ""}`}>
      <div className="admin-brand"><span>IISPC</span><small>Управление сайтом</small></div>
      <nav aria-label="Панель управления">{navigation.map((item) => { const Icon = item.icon; const active = section === item.id || (item.id === "content" && section === "editor"); return <button key={item.id} type="button" className={active ? "is-active" : ""} onClick={() => navigate(item.id)}><Icon aria-hidden="true" /><span>{item.label}</span>{item.badge !== undefined ? <strong>{item.badge}</strong> : null}</button>; })}</nav>
      <div className="admin-sidebar-help"><BookOpen aria-hidden="true" /><div><strong>Нужна помощь?</strong><p>Все изменения можно сначала сохранить как черновик.</p></div></div>
      <a className="admin-view-site" href="/" target="_blank" rel="noreferrer">Открыть сайт <ExternalLink aria-hidden="true" /></a>
    </aside>
    {mobileNavOpen ? <button className="admin-sidebar-backdrop" type="button" aria-label="Закрыть меню" onClick={() => setMobileNavOpen(false)} /> : null}
    <main className="admin-main">
      <header className="admin-topbar"><div><p>Панель IISPC</p><strong>{sectionTitle(section, Boolean(form.id))}</strong></div><div className="admin-user"><span><UserRound aria-hidden="true" /></span><div><strong>{displayName}</strong><small>Администратор</small></div></div></header>
      {message ? <div className={`admin-global-message${/не удалось|ошиб/i.test(message) ? " is-error" : ""}`} role="status"><CheckCircle2 aria-hidden="true" /><span>{message}</span><button type="button" onClick={() => setMessage("")} aria-label="Закрыть сообщение"><X aria-hidden="true" /></button></div> : null}

      {section === "overview" ? <Overview stats={stats} items={items} savedDraftAvailable={savedDraftAvailable} onRestore={restoreLocalDraft} onCreate={startNew} onNavigate={navigate} onEdit={edit} /> : null}
      {section === "content" ? <ContentList items={items} filteredItems={filteredItems} filter={filter} statusFilter={statusFilter} query={query} setFilter={setFilter} setStatusFilter={setStatusFilter} setQuery={setQuery} onCreate={startNew} onEdit={edit} onRemove={remove} /> : null}
      {section === "editor" ? <Editor form={form} cover={cover} attachment={attachment} altText={altText} busy={busy} showPreview={showPreview} draftSavedAt={draftSavedAt} update={update} setCover={setCover} setAttachment={setAttachment} setAltText={setAltText} setShowPreview={setShowPreview} onSubmit={submit} onBack={() => navigate("content")} onNew={startNew} /> : null}
      {section === "media" ? <MediaLibrary media={media} mediaUpload={mediaUpload} mediaAlt={mediaAlt} busy={busy} setMediaUpload={setMediaUpload} setMediaAlt={setMediaAlt} onUpload={uploadToLibrary} onUse={useMedia} /> : null}
      {section === "inquiries" ? <InquiryList inquiries={inquiries} newCount={stats.inquiries} onStatus={changeInquiryStatus} onRemove={removeInquiry} /> : null}
    </main>
  </section>;
}

type Stats = { published: number; drafts: number; media: number; inquiries: number };

function Overview({ stats, items, savedDraftAvailable, onRestore, onCreate, onNavigate, onEdit }: {
  stats: Stats; items: ContentItem[]; savedDraftAvailable: boolean; onRestore: () => void;
  onCreate: (type?: ContentType) => void; onNavigate: (section: AdminSection) => void; onEdit: (item: ContentItem) => void;
}) {
  return <div className="admin-screen admin-overview">
    <ScreenHeading eyebrow="Добро пожаловать" title="Управление сайтом IISPC" description="Публикуйте материалы, добавляйте фотографии и отвечайте на обращения без изменения кода."><button className="button admin-primary-action" type="button" onClick={() => onCreate()}><Plus aria-hidden="true" /> Создать материал</button></ScreenHeading>
    {savedDraftAvailable ? <button className="admin-draft-resume" type="button" onClick={onRestore}><Clock3 aria-hidden="true" /><span><strong>Есть несохранённый черновик</strong><small>Продолжить работу с последним текстом</small></span><ChevronRight aria-hidden="true" /></button> : null}
    <div className="admin-stat-grid">
      <button type="button" onClick={() => onNavigate("content")}><span className="is-green"><CheckCircle2 aria-hidden="true" /></span><div><strong>{stats.published}</strong><small>Опубликовано</small></div></button>
      <button type="button" onClick={() => onNavigate("content")}><span className="is-gold"><Clock3 aria-hidden="true" /></span><div><strong>{stats.drafts}</strong><small>Черновики</small></div></button>
      <button type="button" onClick={() => onNavigate("media")}><span className="is-purple"><ImageIcon aria-hidden="true" /></span><div><strong>{stats.media}</strong><small>Файлы</small></div></button>
      <button type="button" onClick={() => onNavigate("inquiries")}><span className="is-wine"><MessageSquare aria-hidden="true" /></span><div><strong>{stats.inquiries}</strong><small>Новые обращения</small></div></button>
    </div>
    <div className="admin-overview-grid">
      <section className="admin-panel"><PanelHeading eyebrow="Последние изменения" title="Недавние материалы"><button type="button" onClick={() => onNavigate("content")}>Показать все</button></PanelHeading><div className="admin-recent-list">{items.slice(0, 5).map((item) => { const Icon = typeIcons[item.type]; return <button key={item.id} type="button" onClick={() => onEdit(item)}><span><Icon aria-hidden="true" /></span><div><strong>{item.title}</strong><small>{typeLabels[item.type]} · {statusLabels[item.status]}</small></div><time>{formatDate(item.updatedAt)}</time></button>; })}{items.length === 0 ? <EmptyState icon={FileText} text="Материалов пока нет." action="Создать первый материал" onAction={() => onCreate()} /> : null}</div></section>
      <section className="admin-panel"><PanelHeading eyebrow="Быстрые действия" title="Что добавить?" /><div className="admin-quick-actions">{(["news", "event", "publication", "gallery"] as ContentType[]).map((type) => { const Icon = typeIcons[type]; const hints = { news: "Сообщить об актуальном", event: "Дата, формат и описание", publication: "Научный материал и PDF", gallery: "Фотографии события" }; return <button key={type} type="button" onClick={() => onCreate(type)}><Icon aria-hidden="true" /><span><strong>{typeLabels[type]}</strong><small>{hints[type]}</small></span><ChevronRight aria-hidden="true" /></button>; })}</div></section>
    </div>
  </div>;
}

function ContentList({ items, filteredItems, filter, statusFilter, query, setFilter, setStatusFilter, setQuery, onCreate, onEdit, onRemove }: {
  items: ContentItem[]; filteredItems: ContentItem[]; filter: ContentFilter; statusFilter: ContentStatus | "all"; query: string;
  setFilter: (value: ContentFilter) => void; setStatusFilter: (value: ContentStatus | "all") => void; setQuery: (value: string) => void;
  onCreate: (type?: ContentType) => void; onEdit: (item: ContentItem) => void; onRemove: (id: string) => void;
}) {
  return <div className="admin-screen">
    <ScreenHeading eyebrow="Контент сайта" title="Все материалы" description="Новости, мероприятия, публикации и фотографии в одном месте."><button className="button admin-primary-action" type="button" onClick={() => onCreate()}><Plus aria-hidden="true" /> Добавить материал</button></ScreenHeading>
    <div className="admin-content-toolbar"><div className="admin-search"><Search aria-hidden="true" /><label className="sr-only" htmlFor="admin-search">Поиск материалов</label><input id="admin-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по названию или автору" /></div><label><span>Статус</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ContentStatus | "all")}><option value="all">Все статусы</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    <div className="admin-type-tabs" role="tablist" aria-label="Тип материалов"><button type="button" className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>Все <span>{items.length}</span></button>{Object.entries(typeLabels).map(([value, label]) => <button key={value} type="button" className={filter === value ? "is-active" : ""} onClick={() => setFilter(value as ContentType)}>{label} <span>{items.filter((item) => item.type === value).length}</span></button>)}</div>
    <section className="admin-content-table" aria-label="Список материалов"><div className="admin-content-table-head"><span>Материал</span><span>Статус</span><span>Обновлён</span><span className="sr-only">Действия</span></div>{filteredItems.map((item) => { const Icon = typeIcons[item.type]; return <article key={item.id}><div className="admin-content-title"><span><Icon aria-hidden="true" /></span><div><h2>{item.title}</h2><p>{typeLabels[item.type]}{item.author ? ` · ${item.author}` : ""}</p></div></div><span className={`admin-status admin-status-${item.status}`}>{item.status === "published" ? <CheckCircle2 aria-hidden="true" /> : item.status === "draft" ? <Clock3 aria-hidden="true" /> : <Archive aria-hidden="true" />}{statusLabels[item.status]}</span><time>{formatDate(item.updatedAt)}</time><div className="admin-row-actions"><button type="button" onClick={() => onEdit(item)}><Pencil aria-hidden="true" /> Изменить</button><button className="danger" type="button" onClick={() => onRemove(item.id)} aria-label={`Удалить ${item.title}`}><Trash2 aria-hidden="true" /></button></div></article>; })}{filteredItems.length === 0 ? <EmptyState icon={Search} text="По выбранным условиям ничего не найдено." action="Сбросить фильтры" onAction={() => { setQuery(""); setFilter("all"); setStatusFilter("all"); }} /> : null}</section>
  </div>;
}

function Editor({ form, cover, attachment, altText, busy, showPreview, draftSavedAt, update, setCover, setAttachment, setAltText, setShowPreview, onSubmit, onBack, onNew }: {
  form: FormState; cover: File | null; attachment: File | null; altText: string; busy: boolean; showPreview: boolean; draftSavedAt: number | null;
  update: (field: keyof FormState, value: string | null) => void; setCover: (file: File | null) => void; setAttachment: (file: File | null) => void; setAltText: (value: string) => void; setShowPreview: (value: boolean | ((current: boolean) => boolean)) => void;
  onSubmit: (event: React.FormEvent) => void; onBack: () => void; onNew: (type?: ContentType) => void;
}) {
  return <div className="admin-screen admin-editor-screen">
    <div className="admin-screen-heading admin-editor-heading"><div><button className="admin-back-link" type="button" onClick={onBack}>← Все материалы</button><h1>{form.id ? "Редактировать материал" : "Новый материал"}</h1><p>{draftSavedAt ? `Черновик сохранён на устройстве в ${new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(draftSavedAt))}` : "Изменения можно сохранить как черновик и опубликовать позже."}</p></div><button className="admin-preview-toggle" type="button" onClick={() => setShowPreview((value) => !value)} aria-pressed={showPreview}><Eye aria-hidden="true" /> {showPreview ? "Вернуться к редактору" : "Предпросмотр"}</button></div>
    {showPreview ? <article className="admin-preview"><p className="eyebrow">{typeLabels[form.type]}</p><h1>{form.title || "Заголовок материала"}</h1><p className="admin-preview-lead">{form.excerpt || "Здесь появится краткое описание материала."}</p>{form.coverUrl ? <Image src={form.coverUrl} alt={form.coverAlt || form.title} width={1200} height={750} unoptimized /> : null}<div>{form.body.split(/\n\n+/).filter(Boolean).map((paragraph, index) => <p key={`${paragraph.slice(0, 24)}-${index}`}>{paragraph}</p>)}</div></article> : <form className="admin-editor-layout" onSubmit={onSubmit}><div className="admin-editor-main">
      <FormCard number="1" title="Основная информация" description="То, что посетитель увидит в списке материалов."><label htmlFor="admin-title">Заголовок <em>обязательно</em></label><input id="admin-title" required minLength={3} maxLength={180} value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Краткий и понятный заголовок" /><FieldCount hint="До 180 символов" value={form.title.length} limit={180} /><label htmlFor="admin-excerpt">Краткое описание <em>обязательно</em></label><textarea id="admin-excerpt" required minLength={10} maxLength={600} rows={4} value={form.excerpt} onChange={(event) => update("excerpt", event.target.value)} placeholder="В двух-трёх предложениях объясните, о чём материал" /><FieldCount hint="Показывается в карточке и поиске" value={form.excerpt.length} limit={600} /></FormCard>
      <FormCard number="2" title="Основной текст" description="Разделяйте смысловые части пустой строкой."><label htmlFor="admin-body">Текст материала</label><textarea id="admin-body" maxLength={60000} rows={18} value={form.body} onChange={(event) => update("body", event.target.value)} placeholder="Начните писать основной текст…" /><div className="admin-editor-tips"><strong>Подсказка</strong><span>Один абзац — одна мысль. Для удобного чтения используйте короткие абзацы.</span></div></FormCard>
      <FormCard number="3" title="Изображение и файлы" description="Добавьте обложку и, при необходимости, документ.">{form.coverUrl && !cover ? <div className="admin-current-cover"><Image src={form.coverUrl} alt={form.coverAlt || form.title} width={720} height={420} unoptimized /><button type="button" onClick={() => { update("coverUrl", null); update("coverAlt", ""); }}><Trash2 aria-hidden="true" /> Убрать</button></div> : null}<FileDrop id="admin-cover" file={cover} label="Выберите изображение" hint="JPG, PNG, WebP или AVIF, до 15 МБ" accept="image/jpeg,image/png,image/webp,image/avif" onChange={setCover} /><label htmlFor="admin-alt">Описание изображения {cover ? <em>обязательно</em> : null}</label><input id="admin-alt" required={Boolean(cover)} maxLength={240} value={cover ? altText : form.coverAlt} onChange={(event) => cover ? setAltText(event.target.value) : update("coverAlt", event.target.value)} placeholder="Кто или что изображено" />{form.type === "publication" ? <FileDrop id="admin-attachment" file={attachment} label={form.attachmentUrl ? "PDF уже прикреплён" : "Прикрепить научный материал"} hint="PDF до 15 МБ" accept="application/pdf" compact onChange={setAttachment} /> : null}</FormCard>
    </div><aside className="admin-publish-panel"><section><h2>Публикация</h2><label htmlFor="admin-type">Тип материала</label><select id="admin-type" value={form.type} onChange={(event) => update("type", event.target.value as ContentType)}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><label htmlFor="admin-status">Статус</label><select id="admin-status" value={form.status} onChange={(event) => update("status", event.target.value as ContentStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><label htmlFor="admin-author">Автор</label><input id="admin-author" value={form.author} onChange={(event) => update("author", event.target.value)} placeholder="Имя автора" />{form.type === "event" ? <><label htmlFor="admin-event-date">Дата события</label><input id="admin-event-date" type="date" value={form.eventDate} onChange={(event) => update("eventDate", event.target.value)} /><label htmlFor="admin-location">Место или формат</label><input id="admin-location" value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="Астана / онлайн" /></> : null}</section><button className="button admin-publish-button" type="submit" disabled={busy}><Save aria-hidden="true" /> {busy ? "Сохраняем…" : form.status === "published" ? "Опубликовать" : "Сохранить черновик"}</button>{form.id ? <button className="admin-secondary-button" type="button" onClick={() => onNew(form.type)}>Создать новый материал</button> : null}</aside></form>}
  </div>;
}

function MediaLibrary({ media, mediaUpload, mediaAlt, busy, setMediaUpload, setMediaAlt, onUpload, onUse }: {
  media: MediaFile[]; mediaUpload: File | null; mediaAlt: string; busy: boolean;
  setMediaUpload: (file: File | null) => void; setMediaAlt: (value: string) => void;
  onUpload: (event: React.FormEvent) => void; onUse: (item: MediaFile) => void;
}) {
  return <div className="admin-screen"><ScreenHeading eyebrow="Файлы сайта" title="Медиатека" description="Все загруженные изображения и PDF-документы." /><form className="admin-media-upload" onSubmit={onUpload}><FileDrop id="admin-library-file" file={mediaUpload} label="Перетащите или выберите файл" hint="Изображение или PDF, до 15 МБ" accept="image/jpeg,image/png,image/webp,image/avif,application/pdf" onChange={setMediaUpload} /><label htmlFor="admin-media-alt">Описание файла<input id="admin-media-alt" value={mediaAlt} onChange={(event) => setMediaAlt(event.target.value)} maxLength={240} placeholder="Например: участники конференции IISPC" /></label><button className="button" type="submit" disabled={busy || !mediaUpload}>{busy ? "Загружаем…" : "Добавить в медиатеку"}</button></form><div className="admin-media-grid">{media.map((item) => <article key={item.id}>{item.contentType.startsWith("image/") ? <Image src={item.url} alt={item.altText || item.filename} width={420} height={300} unoptimized /> : <div className="admin-pdf-preview"><FileText aria-hidden="true" /><span>PDF</span></div>}<div><strong title={item.filename}>{item.filename}</strong><small>{formatFileSize(item.size)} · {formatDate(item.createdAt)}</small><button type="button" onClick={() => onUse(item)}>{item.contentType === "application/pdf" ? "Прикрепить к публикации" : "Использовать как обложку"}</button></div></article>)}{media.length === 0 ? <EmptyState icon={Images} text="Медиатека пока пуста." /> : null}</div></div>;
}

function InquiryList({ inquiries, newCount, onStatus, onRemove }: { inquiries: Inquiry[]; newCount: number; onStatus: (id: string, status: InquiryStatus) => void; onRemove: (id: string) => void }) {
  return <div className="admin-screen"><ScreenHeading eyebrow="Обратная связь" title="Обращения посетителей" description="Заявки на обучение, мероприятия и сотрудничество."><span className="admin-new-count">{newCount} новых</span></ScreenHeading><div className="admin-inquiry-list">{inquiries.map((inquiry) => <article key={inquiry.id} className={`admin-inquiry admin-inquiry-${inquiry.status}`}><div className="admin-inquiry-top"><span>{inquiryTopicLabels[inquiry.topic]}</span><time>{new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(inquiry.createdAt))}</time></div><h2>{inquiry.name}</h2><p>{inquiry.message}</p><div className="admin-inquiry-contacts">{inquiry.email ? <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a> : null}{inquiry.phone ? <a href={`tel:${inquiry.phone.replace(/[^+\d]/g, "")}`}>{inquiry.phone}</a> : null}</div><div className="admin-inquiry-actions"><label>Статус<span className="sr-only"> обращения от {inquiry.name}</span><select value={inquiry.status} onChange={(event) => onStatus(inquiry.id, event.target.value as InquiryStatus)}>{Object.entries(inquiryStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="danger" type="button" onClick={() => onRemove(inquiry.id)}><Trash2 aria-hidden="true" /> Удалить</button></div></article>)}{inquiries.length === 0 ? <EmptyState icon={Inbox} text="Обращений пока нет." /> : null}</div></div>;
}
function ScreenHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: React.ReactNode }) { return <div className="admin-screen-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{children}</div>; }
function PanelHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) { return <div className="admin-panel-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{children}</div>; }
function FormCard({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) { return <section className="admin-form-card"><div className="admin-form-card-heading"><span>{number}</span><div><h2>{title}</h2><p>{description}</p></div></div>{children}</section>; }
function FieldCount({ hint, value, limit }: { hint: string; value: number; limit: number }) { return <div className="admin-field-count"><span>{hint}</span><strong>{value}/{limit}</strong></div>; }
function FileDrop({ id, file, label, hint, accept, compact = false, onChange }: { id: string; file: File | null; label: string; hint: string; accept: string; compact?: boolean; onChange: (file: File | null) => void }) { return <label className={`admin-file-drop${compact ? " is-compact" : ""}`} htmlFor={id}>{compact ? <Paperclip aria-hidden="true" /> : <UploadCloud aria-hidden="true" />}<strong>{file ? file.name : label}</strong><span>{hint}</span><input id={id} type="file" accept={accept} onChange={(event) => onChange(event.target.files?.[0] || null)} /></label>; }
function EmptyState({ icon: Icon, text, action, onAction }: { icon: typeof Search; text: string; action?: string; onAction?: () => void }) { return <div className="admin-empty"><Icon aria-hidden="true" /><p>{text}</p>{action && onAction ? <button type="button" onClick={onAction}>{action}</button> : null}</div>; }
function sectionTitle(section: AdminSection, editing: boolean) { if (section === "overview") return "Обзор"; if (section === "content") return "Все материалы"; if (section === "editor") return editing ? "Редактирование" : "Новый материал"; if (section === "media") return "Медиатека"; return "Обращения"; }
function formatDate(value: number) { return new Intl.DateTimeFormat("ru-RU").format(new Date(value)); }
function formatFileSize(size: number) { if (size < 1024) return `${size} Б`; if (size < 1024 * 1024) return `${Math.round(size / 1024)} КБ`; return `${(size / (1024 * 1024)).toFixed(1)} МБ`; }
