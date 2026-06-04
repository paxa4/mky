import { useRef } from "react";
import "./ImcroPublicComponents.css";

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

function renderIcon(icon, className) {
  if (!icon) return null;
  return (
    <span className={className} aria-hidden="true">
      {icon}
    </span>
  );
}

function LinkedBox({ href, className, children, ...props }) {
  if (href) {
    return (
      <a className={className} href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

function normalizeContacts(contacts) {
  if (Array.isArray(contacts)) {
    return contacts
      .filter(Boolean)
      .map((item) => ({
        label: item.label || item.title || "",
        value: item.value ?? item.text ?? "",
        href: item.href || "",
      }))
      .filter((item) => item.label || item.value);
  }

  if (contacts && typeof contacts === "object") {
    return Object.entries(contacts)
      .map(([label, value]) => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          return {
            label: value.label || label,
            value: value.value ?? value.text ?? "",
            href: value.href || "",
          };
        }
        return { label, value, href: "" };
      })
      .filter((item) => item.label || item.value);
  }

  return [];
}

export function ImcroPage({ children, className = "" }) {
  return <div className={cx("imcro-public-page", className)}>{children}</div>;
}

export function ImcroContainer({ children, className = "" }) {
  return <div className={cx("imcro-container", className)}>{children}</div>;
}

export function ImcroSection({ children, className = "" }) {
  return <section className={cx("imcro-section", className)}>{children}</section>;
}

export function ImcroCard({ children, className = "", hover = false }) {
  return <div className={cx("imcro-card", hover && "imcro-card-hover", className)}>{children}</div>;
}

export function ImcroButton({
  children,
  href,
  onClick,
  className = "",
  type = "button",
  ...props
}) {
  const classes = cx("imcro-button", className);

  if (href) {
    return (
      <a className={classes} href={href} onClick={onClick} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} type={type} onClick={onClick} {...props}>
      {children}
    </button>
  );
}

export function ImcroServiceCard({
  title,
  description,
  icon,
  href,
  ctaText = "Перейти",
  className = "",
}) {
  return (
    <ImcroCard className={cx("imcro-service-card", className)} hover>
      {renderIcon(icon, "imcro-service-card__icon")}
      <h3 className="imcro-service-card__title">{title}</h3>
      {description && <p className="imcro-service-card__description">{description}</p>}
      <ImcroButton className="imcro-service-card__button" href={href}>
        {ctaText}
      </ImcroButton>
    </ImcroCard>
  );
}

export function ImcroNewsPanel({
  title = "Последние новости",
  items = [],
  allHref,
  className = "",
}) {
  const visibleItems = Array.isArray(items) ? items.slice(0, 3) : [];

  return (
    <ImcroCard className={cx("imcro-news-panel", className)}>
      <div className="imcro-news-panel__head">
        <h2 className="imcro-news-panel__title">{title}</h2>
      </div>

      <div className="imcro-news-panel__list">
        {visibleItems.map((item, index) => (
          <LinkedBox
            key={`${item.title || "news"}-${item.date || index}`}
            className="imcro-news-panel__item"
            href={item.href}
          >
            {item.date && <time className="imcro-news-panel__date">{item.date}</time>}
            <span className="imcro-news-panel__item-title">{item.title}</span>
          </LinkedBox>
        ))}
        {!visibleItems.length && (
          <div className="imcro-news-panel__empty">Материалы пока не опубликованы.</div>
        )}
      </div>

      {allHref && (
        <a className="imcro-news-panel__all" href={allHref}>
          Все новости
        </a>
      )}
    </ImcroCard>
  );
}

export function ImcroEventBanner({
  title,
  description,
  icon,
  href,
  className = "",
}) {
  return (
    <LinkedBox className={cx("imcro-event-banner", "imcro-card-hover", className)} href={href}>
      {renderIcon(icon, "imcro-event-banner__icon")}
      <span className="imcro-event-banner__content">
        <span className="imcro-event-banner__title">{title}</span>
        {description && <span className="imcro-event-banner__description">{description}</span>}
      </span>
    </LinkedBox>
  );
}

export function ImcroContactPanel({
  title,
  description,
  contacts = [],
  actionText,
  actionHref,
  className = "",
}) {
  const normalizedContacts = normalizeContacts(contacts);

  return (
    <ImcroCard className={cx("imcro-contact-panel", className)}>
      {(title || description) && (
        <div className="imcro-contact-panel__intro">
          {title && <h2 className="imcro-contact-panel__title">{title}</h2>}
          {description && <p className="imcro-contact-panel__description">{description}</p>}
        </div>
      )}

      <dl className="imcro-contact-panel__grid">
        {normalizedContacts.map((item, index) => (
          <div className="imcro-contact-panel__item" key={`${item.label}-${index}`}>
            {item.label && <dt>{item.label}</dt>}
            <dd>
              {item.href ? <a href={item.href}>{item.value}</a> : item.value}
            </dd>
          </div>
        ))}
      </dl>

      {actionText && actionHref && (
        <ImcroButton className="imcro-contact-panel__action" href={actionHref}>
          {actionText}
        </ImcroButton>
      )}
    </ImcroCard>
  );
}

export function ImcroActivityCarousel({
  title,
  items = [],
  className = "",
}) {
  const railRef = useRef(null);

  function scrollRail(direction) {
    railRef.current?.scrollBy({
      left: direction * 320,
      behavior: "smooth",
    });
  }

  return (
    <section className={cx("imcro-activity-carousel", className)}>
      <div className="imcro-activity-carousel__head">
        {title && <h2 className="imcro-activity-carousel__title">{title}</h2>}
        <div className="imcro-activity-carousel__controls" aria-label="Управление каруселью">
          <button type="button" onClick={() => scrollRail(-1)} aria-label="Предыдущие направления">
            {"<"}
          </button>
          <button type="button" onClick={() => scrollRail(1)} aria-label="Следующие направления">
            {">"}
          </button>
        </div>
      </div>

      <div className="imcro-activity-carousel__rail" ref={railRef}>
        {items.map((item, index) => (
          <LinkedBox
            key={`${item.title || "activity"}-${index}`}
            className="imcro-activity-carousel__card"
            href={item.href}
          >
            {renderIcon(item.icon, "imcro-activity-carousel__icon")}
            <span className="imcro-activity-carousel__card-title">{item.title}</span>
          </LinkedBox>
        ))}
      </div>
    </section>
  );
}
