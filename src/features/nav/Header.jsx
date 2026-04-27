import { useEffect, useRef, useState } from "react";
import Logo from "../../components/Logo.jsx";
import MegaMenu from "./MegaMenu.jsx";

const NAV_ITEMS = [
  { label: "Главная", href: "/", items: [] },
  { label: "Сведения об ОО", items: ["Основные сведения", "Структура", "Руководство", "Документы"] },
  { label: "ТПМПК", href: "/tpmpk/", items: [] },
  { label: "Подразделения", items: ["Оценка качества", "Профсоюз"] },
  { label: "Мероприятия", items: ["Событийный календарь", "Олимпиады", "Конференции", "Архив"] },
  { label: "Программы", items: ["Муниципальные проекты", "Программы развития", "Партнеры"] },
  { label: "Контакты", items: ["Адрес", "Телефоны", "Обратная связь"] },
];

function goPath(path) {
  window.location.href = `/mky${path === "/" ? "/" : path}`;
}

function scrollToCalendar() {
  document.getElementById("calendar")?.scrollIntoView({ behavior: "smooth" });
}

function ChevronDownIcon() {
  return (
    <svg className="header-caret" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Header({ onGoAuth, onGoAdmin, onGoProfile, currentUser }) {
  const [scrolled, setScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [a11yMode, setA11yMode] = useState(() => localStorage.getItem("mky-a11y-mode") === "on");
  const searchInputRef = useRef(null);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!searchOpen) return undefined;
    searchInputRef.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [searchOpen]);

  useEffect(() => {
    document.body.classList.toggle("mky-a11y-mode", a11yMode);
    localStorage.setItem("mky-a11y-mode", a11yMode ? "on" : "off");
  }, [a11yMode]);

  const userInitials = currentUser
    ? `${currentUser.firstName?.[0] || ""}${currentUser.lastName?.[0] || ""}` || "П"
    : "П";
  const currentRole = typeof currentUser?.role === "object" ? currentUser.role?.role_name : currentUser?.role;
  const canShowAdminButton = Boolean(currentUser && onGoAdmin && (currentRole === "admin" || currentRole === "methodist"));

  function handleSubItem(subItem) {
    if (subItem === "Событийный календарь") scrollToCalendar();
    setActiveNav(null);
  }

  return (
    <>
      <style>{`
        .site-header-shell {
          position: fixed;
          inset: 0 0 auto;
          z-index: 220;
          background: rgba(255, 255, 255, 0.97);
          border-bottom: 1px solid #dbe5f1;
          backdrop-filter: blur(16px);
          box-shadow: var(--header-shadow);
          transition: box-shadow 0.2s ease;
        }

        .mky-a11y-mode {
          background: #ffffff !important;
          color: #0f172a !important;
          font-size: 18px;
          line-height: 1.55;
        }

        .mky-a11y-mode a,
        .mky-a11y-mode button,
        .mky-a11y-mode input,
        .mky-a11y-mode select,
        .mky-a11y-mode textarea {
          font-size: 1rem;
        }

        .mky-a11y-mode *:focus-visible,
        .site-header-shell *:focus-visible {
          outline: 3px solid #1e3a8a;
          outline-offset: 3px;
        }

        .mky-a11y-mode .site-header-shell {
          border-bottom-color: #0f172a;
          box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.08);
        }

        .site-header-inner {
          max-width: 1360px;
          min-width: 0;
          height: 72px;
          margin: 0 auto;
          padding: 0 20px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          column-gap: 14px;
        }

        .header-logo-slot {
          min-width: 0;
          display: flex;
          align-items: center;
        }

        .header-main-area {
          min-width: 0;
          height: 72px;
          position: relative;
          display: flex;
          align-items: center;
        }

        .header-nav {
          min-width: 0;
          width: 100%;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
          overflow: visible;
          transition: opacity 0.18s ease, transform 0.2s ease, visibility 0.18s ease;
        }

        .header-main-area.search-mode .header-nav {
          opacity: 0;
          visibility: hidden;
          transform: translateX(-18px);
          pointer-events: none;
        }

        .header-nav-item {
          position: relative;
          height: 72px;
          display: flex;
          align-items: center;
          flex: 1 1 auto;
          min-width: 0;
        }

        .header-nav-button {
          width: 100%;
          height: 40px;
          padding: 0 8px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #223044;
          font: 800 12.5px/1 inherit;
          white-space: nowrap;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .header-nav-button:hover,
        .header-nav-button.open {
          background: #edf5ff;
          color: #0b63ce;
        }

        .header-caret {
          flex: 0 0 14px;
          transition: transform 0.15s ease;
        }

        .header-nav-button.open .header-caret {
          transform: rotate(180deg);
        }

        .header-dropdown {
          position: absolute;
          top: 62px;
          left: 50%;
          width: 238px;
          padding: 8px;
          border: 1px solid #dbe5f1;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.14);
          transform: translateX(-50%);
          animation: headerDrop 0.14s ease-out;
        }

        @keyframes headerDrop {
          from { opacity: 0; transform: translate(-50%, -5px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        .header-dropdown-item {
          width: 100%;
          min-height: 36px;
          padding: 9px 10px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: #405166;
          font: 700 13px/1.25 inherit;
          text-align: left;
          cursor: pointer;
        }

        .header-dropdown-item:hover {
          background: #f3f7fb;
          color: #0b63ce;
        }

        .header-search-panel {
          position: absolute;
          inset: 16px 0;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 10px 0 14px;
          border: 1px solid #9dc5f4;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 12px 28px rgba(11, 99, 206, 0.11);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateX(34px) scaleX(0.94);
          transform-origin: right center;
          transition: opacity 0.18s ease, visibility 0.18s ease, transform 0.22s ease;
        }

        .header-main-area.search-mode .header-search-panel {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateX(0) scaleX(1);
        }

        .header-search-panel svg {
          flex: 0 0 auto;
          color: #0b63ce;
        }

        .header-search-input {
          min-width: 0;
          width: 100%;
          height: 100%;
          border: 0;
          outline: 0;
          color: #223044;
          font: 700 14px/1 inherit;
          background: transparent;
        }

        .header-search-input::placeholder {
          color: #738295;
          font-weight: 600;
        }

        .header-search-close,
        .header-icon-btn,
        .header-search-btn,
        .header-menu-btn {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          border: 1px solid #dbe5f1;
          border-radius: 10px;
          background: #fff;
          color: #405166;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
        }

        .header-search-close {
          width: 30px;
          height: 30px;
          flex-basis: 30px;
          background: #eef5ff;
        }

        .header-icon-btn:hover,
        .header-search-btn:hover,
        .header-icon-btn.active,
        .header-search-btn.active,
        .header-menu-btn:hover,
        .header-search-close:hover {
          border-color: #9dc5f4;
          background: #f5f9ff;
          color: #0b63ce;
        }

        .header-search-btn.active {
          box-shadow: 0 0 0 3px rgba(11, 99, 206, 0.12);
        }

        .header-actions {
          min-width: 0;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .header-admin-btn,
        .header-profile-btn,
        .header-auth-btn,
        .header-register-btn {
          height: 40px;
          border: 1px solid #dbe5f1;
          border-radius: 10px;
          background: #fff;
          color: #26364a;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 12px;
          font: 800 13px/1 inherit;
          white-space: nowrap;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
        }

        .header-register-btn {
          border-color: #0b63ce;
          background: #0b63ce;
          color: #fff;
        }

        .header-admin-btn:hover,
        .header-profile-btn:hover,
        .header-auth-btn:hover {
          border-color: #9dc5f4;
          background: #f5f9ff;
          color: #0b63ce;
        }

        .header-register-btn:hover {
          background: #084fa7;
          border-color: #084fa7;
        }

        .header-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0b63ce, #7c3aed);
          color: #fff;
          font-size: 11px;
          font-weight: 900;
        }

        .header-spacer { height: 73px; }

        @media (max-width: 1280px) {
          .header-action-label,
          .header-admin-label {
            display: none;
          }
          .header-admin-btn,
          .header-profile-btn {
            width: 40px;
            padding: 0;
          }
        }

        @media (max-width: 1080px) {
          .site-header-inner {
            grid-template-columns: auto 1fr auto;
          }

          .header-main-area {
            height: 0;
            position: absolute;
            left: 14px;
            right: 14px;
            top: 72px;
            z-index: 1;
            display: block;
          }

          .header-nav {
            display: none;
          }

          .header-search-panel {
            inset: 0;
            height: 46px;
            transform: translateY(-10px);
            transform-origin: top center;
          }

          .header-main-area.search-mode .header-search-panel {
            transform: translateY(0);
          }

          .site-header-shell:has(.header-main-area.search-mode) {
            padding-bottom: 58px;
          }
        }

        @media (max-width: 720px) {
          .site-header-inner,
          .header-actions {
            height: 64px;
          }
          .site-header-inner {
            padding: 0 14px;
            column-gap: 10px;
          }
          .header-main-area {
            top: 64px;
          }
          .header-spacer { height: 65px; }
          .header-auth-text,
          .header-register-text {
            display: none;
          }
          .header-auth-btn,
          .header-register-btn {
            width: 40px;
            padding: 0;
          }
          .header-avatar {
            width: 26px;
            height: 26px;
          }
        }

        @media (max-width: 520px) {
          .header-admin-btn {
            display: none;
          }
          .header-actions {
            gap: 6px;
          }
          .header-icon-btn,
          .header-search-btn,
          .header-menu-btn,
          .header-auth-btn,
          .header-register-btn,
          .header-profile-btn {
            width: 38px;
            height: 38px;
            flex-basis: 38px;
          }
        }

        @media (max-width: 390px) {
          .header-icon-btn {
            display: none;
          }
        }
      `}</style>

      <div className="header-spacer" />

      <header
        className="site-header-shell"
        style={{ "--header-shadow": scrolled ? "0 10px 30px rgba(15, 23, 42, 0.12)" : "0 3px 14px rgba(15, 23, 42, 0.06)" }}
      >
        <div className="site-header-inner">
          <div className="header-logo-slot">
            <Logo />
          </div>

          <div className={`header-main-area${searchOpen ? " search-mode" : ""}`}>
            <nav className="header-nav" aria-label="Основная навигация">
              {NAV_ITEMS.map((item) => (
                <div
                  className="header-nav-item"
                  key={item.label}
                  onMouseEnter={() => item.items.length && setActiveNav(item.label)}
                  onMouseLeave={() => item.items.length && setActiveNav(null)}
                >
                  <button
                    className={`header-nav-button${activeNav === item.label ? " open" : ""}`}
                    type="button"
                    onClick={() => item.href && goPath(item.href)}
                  >
                    {item.label}
                    {item.items.length > 0 && <ChevronDownIcon />}
                  </button>
                  {activeNav === item.label && item.items.length > 0 && (
                    <div className="header-dropdown">
                      {item.items.map((subItem) => (
                        <button
                          className="header-dropdown-item"
                          key={subItem}
                          type="button"
                          onClick={() => handleSubItem(subItem)}
                        >
                          {subItem}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <form className="header-search-panel" role="search" onSubmit={(event) => event.preventDefault()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.8-3.8" />
              </svg>
              <input ref={searchInputRef} className="header-search-input" type="search" placeholder="Поиск по сайту" aria-label="Поиск по сайту" />
              <button className="header-search-close" type="button" onClick={() => setSearchOpen(false)} aria-label="Закрыть поиск">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </form>
          </div>

          <div className="header-actions">
            <button
              className={`header-search-btn${searchOpen ? " active" : ""}`}
              type="button"
              title="Поиск"
              aria-label="Поиск"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((value) => !value)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.8-3.8" />
              </svg>
            </button>

            <button
              className={`header-icon-btn${a11yMode ? " active" : ""}`}
              type="button"
              title="Версия для слабовидящих"
              aria-label="Версия для слабовидящих"
              aria-pressed={a11yMode}
              onClick={() => setA11yMode((value) => !value)}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>

            {canShowAdminButton && (
              <button className="header-admin-btn" type="button" onClick={onGoAdmin} title="Админ-панель">
                <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="5" height="5" rx="1.3" />
                  <rect x="9" y="2" width="5" height="5" rx="1.3" />
                  <rect x="2" y="9" width="5" height="5" rx="1.3" />
                  <rect x="9" y="9" width="5" height="5" rx="1.3" />
                </svg>
                <span className="header-admin-label">Админ</span>
              </button>
            )}

            {currentUser ? (
              <button className="header-profile-btn" type="button" onClick={onGoProfile} title="Профиль">
                <span className="header-avatar">{userInitials}</span>
                <span className="header-action-label">{currentUser.firstName || "Профиль"}</span>
              </button>
            ) : (
              <>
                <button className="header-auth-btn" type="button" onClick={() => onGoAuth?.("login")} title="Вход">
                  <span className="header-auth-text">Вход</span>
                  <svg className="header-auth-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <path d="m10 17 5-5-5-5" />
                    <path d="M15 12H3" />
                  </svg>
                </button>
                <button className="header-register-btn" type="button" onClick={() => onGoAuth?.("register")} title="Регистрация">
                  <span className="header-register-text">Регистрация</span>
                  <svg className="header-auth-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M19 8v6" />
                    <path d="M22 11h-6" />
                  </svg>
                </button>
              </>
            )}

            <button
              className="header-menu-btn"
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              title="Открыть меню"
              aria-label="Открыть меню"
              aria-expanded={menuOpen}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                {menuOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MegaMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
