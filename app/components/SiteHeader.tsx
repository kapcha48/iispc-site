"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { navigation } from "../data";
import { Logo } from "./Logo";

const primaryNavigation = navigation.filter((item) => item.group === "primary");
const secondaryNavigation = [
  ...navigation.filter((item) => item.group === "secondary"),
  {
    href: "/gallery",
    label: "Фотогалерея",
    description: "События и проекты института",
    group: "secondary" as const,
    index: "07",
  },
];

export function SiteHeader() {
  const pathname = usePathname();
  const mobileDetailsRef = useRef<HTMLDetailsElement>(null);
  const mobilePanelRef = useRef<HTMLElement>(null);
  const moreDetailsRef = useRef<HTMLDetailsElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isMoreCurrent = secondaryNavigation.some((item) => isCurrent(item.href));
  const closeMenus = useCallback(() => {
    mobileDetailsRef.current?.removeAttribute("open");
    moreDetailsRef.current?.removeAttribute("open");
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    const closeFromOutside = (event: PointerEvent) => {
      const target = event.target;
      const mobileMenu = mobileDetailsRef.current;
      const moreMenu = moreDetailsRef.current;
      if (!(target instanceof Node)) return;

      const clickedOutsideMobile = mobileMenu?.open && !mobileMenu.contains(target);
      const clickedOutsideMore = moreMenu?.open && !moreMenu.contains(target);
      if (clickedOutsideMobile || clickedOutsideMore) closeMenus();
    };

    const closeFromKeyboard = (event: KeyboardEvent) => {
      const activeMenu = mobileDetailsRef.current?.open ? mobileDetailsRef.current : moreDetailsRef.current;
      if (event.key === "Escape" && activeMenu?.open) {
        closeMenus();
        activeMenu.querySelector("summary")?.focus();
        return;
      }

      if (event.key === "Tab" && mobileDetailsRef.current?.open && mobilePanelRef.current) {
        const focusable = Array.from(mobilePanelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), summary, input, select, textarea, [tabindex]:not([tabindex='-1'])"))
          .filter((element) => !element.hasAttribute("hidden"));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const closeFromViewportChange = () => {
      if (mobileDetailsRef.current?.open || moreDetailsRef.current?.open) closeMenus();
    };

    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromKeyboard);
    window.addEventListener("resize", closeFromViewportChange, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromKeyboard);
      window.removeEventListener("resize", closeFromViewportChange);
    };
  }, [closeMenus]);

  useEffect(() => {
    document.documentElement.classList.toggle("menu-is-open", menuOpen);
    const main = document.getElementById("main-content");
    const footer = document.querySelector<HTMLElement>(".site-footer");
    if (main) main.inert = menuOpen;
    if (footer) footer.inert = menuOpen;
    return () => {
      document.documentElement.classList.remove("menu-is-open");
      if (main) main.inert = false;
      if (footer) footer.inert = false;
    };
  }, [menuOpen]);

  const handleMobileToggle = (open: boolean) => {
    setMenuOpen(open);
    if (open) requestAnimationFrame(() => mobilePanelRef.current?.querySelector<HTMLElement>("button")?.focus());
  };

  const closeMobileAndRestoreFocus = () => {
    closeMenus();
    mobileDetailsRef.current?.querySelector("summary")?.focus();
  };

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a className="brand" href="/" aria-label="IISPC — главная">
          <Logo className="brand-logo" idPrefix="header-logo" showSubtitle={false} />
          <span className="brand-caption">Международный<br />институт</span>
        </a>

        <nav className="desktop-nav" aria-label="Основные разделы">
          {primaryNavigation.map((item) => (
            <a key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
              {item.label}
            </a>
          ))}
          <details className={`desktop-more${isMoreCurrent ? " is-current" : ""}`} ref={moreDetailsRef} suppressHydrationWarning>
            <summary role="button" aria-label="Открыть дополнительные разделы">Ещё <span aria-hidden="true">⌄</span></summary>
            <div className="desktop-more-panel">
              {secondaryNavigation.map((item) => (
                <a key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </a>
              ))}
            </div>
          </details>
        </nav>

        <a className="button button-small header-cta" href="/contacts" aria-current={isCurrent("/contacts") ? "page" : undefined}>Контакты</a>

        <details className="mobile-nav" ref={mobileDetailsRef} onToggle={(event) => handleMobileToggle(event.currentTarget.open)} suppressHydrationWarning>
          <summary role="button" aria-expanded={menuOpen} aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}>
            <span>Меню</span>
            <span className="menu-icon" aria-hidden="true"><i /><i /></span>
          </summary>
          <div className="mobile-nav-popover" role="dialog" aria-modal="true" aria-label="Меню сайта">
            <button className="mobile-nav-backdrop" type="button" tabIndex={-1} aria-label="Закрыть меню" onClick={closeMobileAndRestoreFocus} />
            <nav aria-label="Мобильная навигация" ref={mobilePanelRef}>
              <div className="mobile-nav-head">
                <div><span>IISPC</span><strong>Разделы сайта</strong></div>
                <button type="button" onClick={closeMobileAndRestoreFocus} aria-label="Закрыть меню"><span aria-hidden="true">×</span></button>
              </div>

              <p className="mobile-nav-group-label">Основные направления</p>
              <div className="mobile-nav-primary">
                {primaryNavigation.map((item) => (
                  <a key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
                    <span className="mobile-nav-index">{item.index}</span>
                    <span><strong>{item.label}</strong><small>{item.description}</small></span>
                    <span className="mobile-nav-arrow" aria-hidden="true">→</span>
                  </a>
                ))}
              </div>

              <p className="mobile-nav-group-label">Информация</p>
              <div className="mobile-nav-secondary">
                {secondaryNavigation.map((item) => (
                  <a key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
                    <span>{item.label}</span><span aria-hidden="true">→</span>
                  </a>
                ))}
              </div>

              <a className="mobile-nav-contact" href="/contacts" aria-current={isCurrent("/contacts") ? "page" : undefined}>
                <span><strong>Связаться с институтом</strong><small>Поступление, мероприятия и сотрудничество</small></span>
                <span aria-hidden="true">→</span>
              </a>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
