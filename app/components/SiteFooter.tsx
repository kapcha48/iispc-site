import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { navigation } from "../data";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <a className="footer-brand-link" href="/" aria-label="IISPC — главная">
            <Logo className="footer-logo" idPrefix="footer-logo" showSubtitle={false} />
          </a>
          <p className="footer-note">
            Международный институт социальной психотерапии и консультирования.
            Образование, научная работа и профессиональное сообщество для тех,
            кто работает с человеком.
          </p>
        </div>
        <div>
          <h2>Разделы</h2>
          <div className="footer-links footer-nav-links">
            {navigation.map((item) => (
              <a key={item.href} href={item.href}>
                <span>{item.label}</span>
                <ArrowRight aria-hidden="true" />
              </a>
            ))}
            <a href="/gallery">
              <span>Фотогалерея</span>
              <ArrowRight aria-hidden="true" />
            </a>
            <a href="/archive">
              <span>Архив прежнего сайта</span>
              <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>
        <div>
          <h2>Контакты</h2>
          <div className="footer-links footer-contact-links">
            <a href="tel:+77073330372">
              <Phone aria-hidden="true" />
              <span>+7 707 333 03 72</span>
            </a>
            <a href="mailto:iispc2022@gmail.com">
              <Mail aria-hidden="true" />
              <span>iispc2022@gmail.com</span>
            </a>
            <a href="https://wa.me/77073330372" target="_blank" rel="noreferrer">
              <FaWhatsapp className="footer-whatsapp-icon" aria-hidden="true" />
              <span>WhatsApp</span>
            </a>
            <span className="footer-location">
              <MapPin aria-hidden="true" />
              <span>Казахстан</span>
            </span>
          </div>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} IISPC</span>
        <a href="/privacy">Конфиденциальность</a>
        <span>Образование · Наука · Профессиональное сообщество</span>
      </div>
    </footer>
  );
}
