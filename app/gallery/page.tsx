import Image from "next/image";
import { PageHero } from "../components/PageHero";
import { archivedGallery } from "../data";
import { listPublishedContent } from "../lib/content-store";
import { pageMetadata } from "../lib/page-metadata";

export const metadata = pageMetadata({ title: "Фотогалерея", description: "Фотографии мероприятий, программ и проектов IISPC.", path: "/gallery" });
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const items = await listPublishedContent("gallery", 60);
  return <><PageHero eyebrow="Фотогалерея" title="События и проекты института" lead="Фотографии образовательных программ, конференций, экспедиций и встреч профессионального сообщества IISPC." /><nav className="content-subnav" aria-label="Материалы института"><div className="shell"><span>Материалы:</span><a href="/news">Новости</a><a aria-current="page" href="/gallery">Фотогалерея</a></div></nav><section className="section"><div className="shell">{items.length ? <div className="gallery-grid">{items.map((item) => <figure key={item.id}>{item.coverUrl ? <Image src={item.coverUrl} alt={item.coverAlt || item.title} width={1200} height={900} sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" /> : <div className="content-card-placeholder" aria-hidden="true">IISPC</div>}<figcaption><p className="card-kicker">Фотогалерея</p><h2>{item.title}</h2>{item.excerpt ? <p>{item.excerpt}</p> : null}</figcaption></figure>)}</div> : <><div className="section-heading section-heading-editorial"><div><p className="eyebrow">Фотоархив IISPC</p><h2>Фотографии событий и проектов</h2></div><p>Обучение, профессиональные встречи и международные программы института.</p></div><div className="gallery-grid gallery-archive-grid">{archivedGallery.map((src, index) => <figure key={src}><Image src={src} alt={`Событие IISPC, фотография ${index + 1}`} width={1200} height={900} sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" unoptimized /><figcaption><p className="card-kicker">Фотоархив IISPC</p><h2>События института</h2></figcaption></figure>)}</div></>}</div></section></>;
}
