type SectionNavItem = {
  href: string;
  label: string;
};

export function SectionNav({ items }: { items: readonly SectionNavItem[] }) {
  return (
    <nav className="section-nav" aria-label="Содержание страницы">
      <div className="shell section-nav-inner">
        <span className="section-nav-label">На этой странице</span>
        <div className="section-nav-links">
          {items.map((item, index) => (
            <a href={item.href} key={item.href}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
