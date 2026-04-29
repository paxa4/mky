import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import Header from "../features/nav/Header.jsx";
import {
  SVEDENIYA_NAV_ITEMS,
  SVEDENIYA_ROUTE_TO_ANCHOR,
  svedeniyaPage,
} from "./svedeniya/svedeniyaData.js";
import "./svedeniya/SvedeniyaPage.css";

const ICON_PATHS = {
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v6m0-9h.01",
  structure: "M6 4h12v5H6V4Zm0 11h5v5H6v-5Zm7 0h5v5h-5v-5Zm-1-6v3m-4 0h8",
  docs: "M7 3h7l4 4v14H7V3Zm7 0v5h5M10 12h6m-6 4h6",
  education: "M3 9l9-5 9 5-9 5-9-5Zm4 3v4c2 2 8 2 10 0v-4",
  standards: "M5 4h14v16H5V4Zm4 5h6m-6 4h6m-6 4h4",
  staff: "M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  objects: "M4 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2M3 21h18",
  support: "M12 21s-7-4.35-7-10a7 7 0 0 1 14 0c0 5.65-7 10-7 10Zm-3-9h6m-3-3v6",
  paid: "M12 2v20m5-16H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6",
  budget: "M4 5h16v14H4V5Zm0 4h16M8 13h.01M12 13h4M8 16h.01M12 16h4",
  vacant: "M12 5v14m-7-7h14M5 5h14v14H5V5Z",
  accessible: "M12 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 3v5m-5-3h10m-7 4-2 7m6-7 2 7",
  international: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-8-9h16M12 3c2.4 2.4 3.5 5.4 3.5 9S14.4 18.6 12 21c-2.4-2.4-3.5-5.4-3.5-9S9.6 5.4 12 3Z",
};

function Icon({ name }) {
  return (
    <svg className="sv-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICON_PATHS[name] || ICON_PATHS.info} />
    </svg>
  );
}

function Seo({ title, description }) {
  useEffect(() => {
    document.title = `${title} | МКУ развития образования города Иркутска`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, [title, description]);

  return null;
}

function DocumentLink({ link }) {
  return (
    <a className="sv-doc-link" href={link.href}>
      <span className="sv-doc-mark" aria-hidden="true">
        <Icon name="docs" />
      </span>
      <span>{link.title}</span>
      {link.meta && <small>{link.meta}</small>}
    </a>
  );
}

function DetailList({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="sv-detail-list">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

function CardBlock({ block }) {
  return (
    <div className="sv-block">
      {block.title && <h3 className="sv-block-title">{block.title}</h3>}
      <div className={`sv-card-grid sv-card-grid-${block.variant || "default"}`}>
        {block.items.map((item) => (
          <article className="sv-info-card" id={item.id || undefined} key={item.title}>
            <div className="sv-card-head">
              <h3>{item.title}</h3>
              {item.meta && <span>{item.meta}</span>}
            </div>
            {item.text && <p>{item.text}</p>}
            <DetailList items={item.details} />
            {item.links && (
              <div className="sv-doc-links">
                {item.links.map((link) => <DocumentLink link={link} key={link.title} />)}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function DocumentsBlock({ block }) {
  return (
    <div className="sv-doc-grid">
      {block.groups.map((group) => (
        <section className="sv-doc-card" key={group.title}>
          <h3>{group.title}</h3>
          {group.text && <p>{group.text}</p>}
          {group.links && (
            <div className="sv-doc-links">
              {group.links.map((link) => <DocumentLink link={link} key={link.title} />)}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function ProgramsBlock({ block }) {
  return (
    <div className="sv-block">
      {block.title && <h3 className="sv-block-title">{block.title}</h3>}
      <div className="sv-program-list">
        {block.items.map((program) => (
          <article className="sv-program-card" key={program.title}>
            <h3>{program.title}</h3>
            <dl>
              <div><dt>Руководитель</dt><dd>{program.leader}</dd></div>
              <div><dt>Объем</dt><dd>{program.hours}</dd></div>
              <div><dt>Группа</dt><dd>{program.capacity}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}

function StaffCard({ person }) {
  const initials = person.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <article className="sv-staff-card">
      <div className="sv-staff-avatar" aria-hidden="true">
        {person.image ? <img src={person.image} alt="" /> : initials}
      </div>
      <div className="sv-staff-info">
        <div>
          <h3>{person.name}</h3>
          <p>{person.position}</p>
        </div>
        <dl>
          {person.phone && <div><dt>Телефон</dt><dd>{person.phone}</dd></div>}
          <div><dt>Направление</dt><dd>{person.direction}</dd></div>
          <div><dt>Образование</dt><dd>{person.education}</dd></div>
          <div><dt>Квалификация</dt><dd>{person.qualification}</dd></div>
          <div><dt>Аттестация</dt><dd>{person.attestation}</dd></div>
          <div><dt>Общий стаж</dt><dd>{person.totalExperience}</dd></div>
          <div><dt>Педагогический стаж</dt><dd>{person.teachingExperience}</dd></div>
        </dl>
      </div>
    </article>
  );
}

function StaffBlock({ block }) {
  return (
    <div className="sv-block">
      {block.title && <h3 className="sv-block-title">{block.title}</h3>}
      <div className="sv-staff-grid">
        {block.items.map((person) => <StaffCard person={person} key={person.name} />)}
      </div>
    </div>
  );
}

function ListBlock({ block }) {
  return (
    <div className="sv-list-block">
      {block.title && <h3 className="sv-block-title">{block.title}</h3>}
      <ul className="sv-check-list">
        {block.items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function SectionBlock({ block }) {
  if (block.type === "cards") return <CardBlock block={block} />;
  if (block.type === "documents") return <DocumentsBlock block={block} />;
  if (block.type === "programs") return <ProgramsBlock block={block} />;
  if (block.type === "staff") return <StaffBlock block={block} />;
  if (block.type === "list") return <ListBlock block={block} />;
  if (block.type === "notice" || block.type === "empty") {
    return (
      <section className={`sv-notice sv-notice-${block.tone || "info"}`}>
        <h3>{block.title}</h3>
        <p>{block.text}</p>
      </section>
    );
  }
  return null;
}

function OverviewCard({ section }) {
  const navItem = SVEDENIYA_NAV_ITEMS.find((item) => item.anchor === section.anchor);
  return (
    <Link className="sv-overview-card" to={section.path}>
      <span className="sv-overview-icon"><Icon name={navItem?.icon} /></span>
      <span className="sv-overview-number">{section.number}</span>
      <h3>{navItem?.shortTitle || section.title}</h3>
      <p>{section.summary}</p>
      <strong>{section.status}</strong>
    </Link>
  );
}

function Section({ section }) {
  const navItem = SVEDENIYA_NAV_ITEMS.find((item) => item.anchor === section.anchor);

  return (
    <section className="sv-section" id={section.anchor}>
      <div className="sv-section-head">
        <div className="sv-section-kicker">
          <span className="sv-section-icon"><Icon name={navItem?.icon} /></span>
          <span>Раздел {section.number}</span>
          <span>{navItem?.shortTitle || navItem?.label}</span>
        </div>
        <div className="sv-section-title-row">
          <h2>{section.title}</h2>
          {section.status && <span className="sv-status">{section.status}</span>}
        </div>
        <p>{section.lead}</p>
      </div>
      <div className="sv-section-body">
        {section.blocks.map((block, index) => (
          <SectionBlock block={block} key={`${section.anchor}-${block.type}-${index}`} />
        ))}
      </div>
    </section>
  );
}

export default function SvedeniyaPage({ currentUser, onGoAuth, onGoAdmin, onGoProfile }) {
  const location = useLocation();
  const activeLinkRef = useRef(null);
  const sidebarLinksRef = useRef(null);
  const programmaticScrollTimerRef = useRef(0);
  const programmaticScrollCleanupRef = useRef(null);
  const [activeAnchor, setActiveAnchor] = useState(svedeniyaPage.sections[0].anchor);
  const normalizedPath = location.pathname.replace(/\/+$/, "") || "/";
  const isRootPage = normalizedPath === "/sveden";
  const sectionAnchors = useMemo(() => svedeniyaPage.sections.map((section) => section.anchor), []);
  const activeSection = useMemo(
    () => svedeniyaPage.sections.find((section) => section.anchor === activeAnchor) || svedeniyaPage.sections[0],
    [activeAnchor]
  );

  const scrollToIndex = (event) => {
    event.preventDefault();
    const indexElement = document.getElementById("svedeniya-index");
    if (!indexElement) return;

    window.history.pushState(null, "", `${window.location.pathname}${window.location.search}#svedeniya-index`);
    indexElement.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  useEffect(() => {
    const path = location.pathname.replace(/\/+$/, "/");
    const targetAnchor = location.hash.replace(/^#/, "") || SVEDENIYA_ROUTE_TO_ANCHOR[path];

    const timer = window.setTimeout(() => {
      if (!targetAnchor) return;
      setActiveAnchor(targetAnchor);
      if (!isRootPage) {
        if (programmaticScrollCleanupRef.current) {
          programmaticScrollCleanupRef.current();
        }

        const targetElement = document.getElementById(targetAnchor);
        if (!targetElement) return;

        const releaseScrollLock = () => {
          window.removeEventListener("scrollend", releaseScrollLock);
          if (programmaticScrollTimerRef.current) {
            window.clearTimeout(programmaticScrollTimerRef.current);
          }
          programmaticScrollTimerRef.current = 0;
          programmaticScrollCleanupRef.current = null;
          setActiveAnchor(targetAnchor);
          window.dispatchEvent(new Event("scroll"));
        };

        const distance = Math.abs(targetElement.getBoundingClientRect().top);
        const fallbackDelay = Math.min(2400, Math.max(900, distance * 0.42));

        window.addEventListener("scrollend", releaseScrollLock, { once: true });
        targetElement.scrollIntoView({ block: "start", behavior: "smooth" });
        programmaticScrollTimerRef.current = window.setTimeout(releaseScrollLock, fallbackDelay);
        programmaticScrollCleanupRef.current = () => {
          window.removeEventListener("scrollend", releaseScrollLock);
          if (programmaticScrollTimerRef.current) {
            window.clearTimeout(programmaticScrollTimerRef.current);
          }
          programmaticScrollTimerRef.current = 0;
          programmaticScrollCleanupRef.current = null;
        };
      }
    }, 80);

    return () => {
      window.clearTimeout(timer);
      if (programmaticScrollCleanupRef.current) {
        programmaticScrollCleanupRef.current();
      }
    };
  }, [isRootPage, location.hash, location.pathname]);

  useEffect(() => {
    let frame = 0;

    const updateActiveSection = () => {
      frame = 0;
      if (programmaticScrollTimerRef.current) return;

      const stickyOffset = window.matchMedia("(max-width: 1039px)").matches ? 154 : 132;
      const marker = Math.min(window.innerHeight * 0.36, stickyOffset + 90);
      let currentAnchor = sectionAnchors[0];

      sectionAnchors.forEach((anchor) => {
        const element = document.getElementById(anchor);
        if (!element) return;
        const rect = element.getBoundingClientRect();
        if (rect.top <= marker && rect.bottom > stickyOffset) {
          currentAnchor = anchor;
        }
      });

      setActiveAnchor((current) => current === currentAnchor ? current : currentAnchor);
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [sectionAnchors]);

  useEffect(() => {
    const activeLink = activeLinkRef.current;
    const linksRow = sidebarLinksRef.current;
    if (!activeLink || !linksRow || !window.matchMedia("(max-width: 1039px)").matches) return;

    const targetLeft = activeLink.offsetLeft - (linksRow.clientWidth - activeLink.clientWidth) / 2;
    linksRow.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
  }, [activeAnchor]);

  return (
    <div className="sv-page">
      <Seo title={svedeniyaPage.title} description={svedeniyaPage.meta} />
      <Header
        currentUser={currentUser}
        onGoAuth={onGoAuth}
        onGoAdmin={onGoAdmin}
        onGoProfile={onGoProfile}
      />

      <main className="sv-main">
        <div className="sv-shell">
          <nav className="sv-breadcrumb" aria-label="Хлебные крошки">
            <Link to="/">Главная</Link>
            <span aria-hidden="true">/</span>
            <span>Сведения об образовательной организации</span>
          </nav>

          <section className="sv-hero">
            <div className="sv-hero-copy">
              <span className="sv-eyebrow">{svedeniyaPage.eyebrow}</span>
              <h1>{svedeniyaPage.title}</h1>
              <p>{svedeniyaPage.description}</p>
              <div className="sv-hero-actions">
                <a className="sv-primary-action" href="#svedeniya-index" onClick={scrollToIndex}>К подразделам</a>
                <Link className="sv-secondary-action" to="/sveden/document/">Документы</Link>
              </div>
            </div>
            <div className="sv-hero-panel" aria-label="Быстрые переходы">
              {svedeniyaPage.heroHighlights.map((item) => (
                <Link className="sv-hero-highlight" to={item.path} key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="sv-overview" aria-labelledby="svedeniya-index">
            <div className="sv-overview-head">
              <div>
                <span className="sv-section-label">Навигация</span>
                <h2 id="svedeniya-index">Подразделы</h2>
              </div>
              <div className="sv-featured-links">
                {svedeniyaPage.featuredLinks.map((link) => (
                  <Link to={link.path} key={link.path}>{link.label}</Link>
                ))}
              </div>
            </div>
            <div className="sv-overview-grid">
              {svedeniyaPage.sections.map((section) => <OverviewCard section={section} key={section.anchor} />)}
            </div>
          </section>

          <div className="sv-content-layout">
            <aside className="sv-sidebar" aria-label="Меню подразделов">
              <div className="sv-sidebar-card">
                <div className="sv-sidebar-head">
                  <span className="sv-section-label">Сейчас открыт</span>
                  <strong>{activeSection.number}. {activeSection.title}</strong>
                </div>
                <div className="sv-sidebar-links" ref={sidebarLinksRef}>
                  {SVEDENIYA_NAV_ITEMS.map((item) => (
                    <Link
                      className={`sv-sidebar-link${activeAnchor === item.anchor ? " active" : ""}`}
                      key={item.path}
                      ref={activeAnchor === item.anchor ? activeLinkRef : null}
                      to={item.path}
                    >
                      <span><Icon name={item.icon} /></span>
                      <strong>{item.shortTitle || item.label}</strong>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>

            <div className="sv-sections">
              {svedeniyaPage.sections.map((section) => <Section section={section} key={section.anchor} />)}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
