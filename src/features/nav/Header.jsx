import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../../components/Logo.jsx";
import MegaMenu from "./MegaMenu.jsx";

const MAIN_NAV_ITEMS = [
  { label: "Главная", href: "/" },
  { label: "Сведения", href: "/sveden/" },
  { label: "ТПМПК", href: "/tpmpk/" },
  { label: "Дом учителя", href: "/dom-uchitelya/" },
  { label: "Методика", href: "/metodika/" },
  { label: "ГИА", href: "/noko/" },
  { label: "Конкурсы", href: "/konkursy/" },
  { label: "Новости", href: "/novosti/" },
  { label: "Безопасность", href: "/sveden/document/" },
  { label: "Музей", href: "/deyatelnost/muzey/" },
];

function normalizePath(pathname) {
  if (!pathname) return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function Header({ onGoAuth, onGoAdmin, onGoProfile, currentUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [a11yMode, setA11yMode] = useState(() => localStorage.getItem("mky-a11y-mode") === "on");

  const currentPath = normalizePath(location.pathname);
  const userInitials = currentUser
    ? `${currentUser.firstName?.[0] || ""}${currentUser.lastName?.[0] || ""}` || "П"
    : "П";
  const currentRole = typeof currentUser?.role === "object" ? currentUser.role?.role_name : currentUser?.role;
  const canShowAdminButton = Boolean(currentUser && onGoAdmin && (currentRole === "admin" || currentRole === "methodist" || currentRole === "domu_editor"));
  const canShowTpmpkCabinetButton = currentRole === "operator" || currentRole === "admin";

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

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navSearchIndex = useMemo(
    () => MAIN_NAV_ITEMS.map((item) => ({ ...item, search: item.label.toLowerCase() })),
    [],
  );

  function goPath(path) {
    if (!path) return;
    const target = normalizePath(path);
    if (target === currentPath) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate(path);
  }

  function onSearchSubmit(event) {
    event.preventDefault();
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return;

    if (normalized.startsWith("/")) {
      navigate(normalized);
      setSearchOpen(false);
      return;
    }

    const byPrefix = navSearchIndex.find((item) => item.search.startsWith(normalized));
    const byContains = navSearchIndex.find((item) => item.search.includes(normalized));
    const target = byPrefix || byContains;
    if (target) {
      goPath(target.href);
      setSearchOpen(false);
    }
  }

  return (
    <>
      <style>{`
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

        .site-header-shell {
          position: fixed;
          inset: 0 0 auto;
          z-index: 240;
          border-bottom: 1px solid #dbe5f1;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(14px);
          box-shadow: var(--header-shadow);
          transition: box-shadow 0.2s ease;
        }

        .site-header-shell *:focus-visible {
          outline: 3px solid #1e3a8a;
          outline-offset: 2px;
        }

        .site-header-inner {
          max-width: 1500px;
          margin: 0 auto;
          height: 74px;
          min-width: 0;
          padding: 0 12px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          column-gap: 12px;
        }

        .header-logo-slot {
          min-width: 0;
          display: flex;
          align-items: center;
        }

        .header-main-area {
          min-width: 0;
          position: relative;
          height: 74px;
          display: flex;
          align-items: center;
        }

        .header-nav {
          width: 100%;
          height: 74px;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          overflow: hidden;
          transition: opacity 0.16s ease, transform 0.2s ease, visibility 0.16s ease;
        }

        .header-main-area.search-mode .header-nav {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateX(-18px);
        }

        .header-nav-link {
          flex: 0 0 auto;
          height: 38px;
          border: 1px solid transparent;
          border-radius: 10px;
          background: transparent;
          color: #1f3043;
          padding: 0 9px;
          font: 760 11.8px/1 inherit;
          white-space: nowrap;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: color 0.16s ease, background 0.16s ease, border-color 0.16s ease;
        }

        .header-nav-link:hover {
          color: #19789C;
          background: #EAF7FA;
          border-color: #A9D9E7;
        }

        .header-nav-link.is-active {
          color: #19789C;
          background: #EAF7FA;
          border-color: #A9D9E7;
        }

        .header-search-panel {
          position: absolute;
          inset: 14px 0;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 10px 0 14px;
          border: 1px solid #78C2D8;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 10px 24px rgba(25, 120, 156, 0.14);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateX(24px) scaleX(0.95);
          transform-origin: right center;
          transition: opacity 0.18s ease, visibility 0.18s ease, transform 0.2s ease;
        }

        .header-main-area.search-mode .header-search-panel {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateX(0) scaleX(1);
        }

        .header-search-panel svg {
          color: #19789C;
          flex: 0 0 auto;
        }

        .header-search-input {
          width: 100%;
          min-width: 0;
          height: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #1f3043;
          font: 700 14px/1 inherit;
        }

        .header-search-input::placeholder {
          color: #7b8ca0;
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
          background: #EAF7FA;
        }

        .header-icon-btn:hover,
        .header-search-btn:hover,
        .header-icon-btn.active,
        .header-search-btn.active,
        .header-menu-btn:hover,
        .header-search-close:hover {
          border-color: #78C2D8;
          background: #EAF7FA;
          color: #19789C;
        }

        .header-search-btn.active {
          box-shadow: 0 0 0 3px rgba(25, 120, 156, 0.14);
        }

        .header-actions {
          min-width: 0;
          height: 74px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .header-admin-btn,
        .header-tpmpk-btn,
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
          border-color: #19789C;
          background: #19789C;
          color: #fff;
        }

        .header-admin-btn:hover,
        .header-tpmpk-btn:hover,
        .header-profile-btn:hover,
        .header-auth-btn:hover {
          border-color: #78C2D8;
          background: #EAF7FA;
          color: #19789C;
        }

        .header-register-btn:hover {
          background: #145F7D;
          border-color: #145F7D;
        }

        .header-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #19789C, #7c3aed);
          color: #fff;
          font-size: 11px;
          font-weight: 900;
        }

        .header-spacer {
          height: 75px;
        }

        @media (max-width: 1620px) {
          .header-auth-text,
          .header-register-text,
          .header-admin-label,
          .header-tpmpk-label,
          .header-action-label {
            display: none;
          }

          .header-auth-btn,
          .header-register-btn,
          .header-admin-btn,
          .header-tpmpk-btn,
          .header-profile-btn {
            width: 40px;
            padding: 0;
          }

          .header-nav-link {
            font-size: 11.2px;
            padding: 0 8px;
          }
        }

        @media (max-width: 1480px) {
          .header-nav {
            gap: 8px;
          }

          .header-nav-link {
            font-size: 10.9px;
            padding: 0 6px;
          }
        }

        @media (max-width: 1320px) {
          .header-nav {
            gap: 6px;
          }

          .header-nav-link {
            font-size: 10.5px;
            padding: 0 5px;
          }
        }

        @media (max-width: 1180px) {
          .header-nav {
            display: none;
          }

          .header-main-area {
            height: 0;
            position: absolute;
            left: 12px;
            right: 12px;
            top: 74px;
            z-index: 1;
            display: block;
          }

          .header-search-panel {
            inset: 0;
            height: 48px;
            transform: translateY(-8px);
            transform-origin: top center;
          }

          .header-main-area.search-mode .header-search-panel {
            transform: translateY(0);
          }

          .site-header-shell:has(.header-main-area.search-mode) {
            padding-bottom: 60px;
          }
        }

        @media (max-width: 720px) {
          .site-header-inner,
          .header-actions {
            height: 66px;
          }

          .site-header-inner {
            padding: 0 10px;
            column-gap: 8px;
          }

          .header-main-area {
            top: 66px;
          }

          .header-spacer {
            height: 67px;
          }

          .header-admin-btn,
          .header-tpmpk-btn {
            display: none;
          }

          .header-icon-btn,
          .header-menu-btn,
          .header-search-btn,
          .header-auth-btn,
          .header-register-btn,
          .header-profile-btn {
            width: 38px;
            height: 38px;
            flex-basis: 38px;
          }
        }

        @media (max-width: 420px) {
          .site-header-inner {
            padding: 0 8px;
            column-gap: 6px;
          }

          .header-actions {
            gap: 4px;
          }

          .header-avatar {
            width: 24px;
            height: 24px;
            font-size: 10px;
          }

          .header-icon-btn,
          .header-menu-btn,
          .header-search-btn,
          .header-auth-btn,
          .header-register-btn,
          .header-profile-btn {
            width: 34px;
            height: 34px;
          }

          .header-icon-btn {
            display: none;
          }
        }
      `}</style>

      <div className="header-spacer" />

      <header
        className="site-header-shell"
        style={{ "--header-shadow": scrolled ? "0 10px 28px rgba(15, 23, 42, 0.12)" : "0 2px 12px rgba(15, 23, 42, 0.06)" }}
      >
        <div className="site-header-inner">
          <div className="header-logo-slot">
            <Logo />
          </div>

          <div className={`header-main-area${searchOpen ? " search-mode" : ""}`}>
            <nav className="header-nav" aria-label="Главная навигация">
              {MAIN_NAV_ITEMS.map((item) => {
                const isActive = item.href === "/" ? currentPath === "/" : currentPath.startsWith(item.href);
                return (
                  <button
                    key={item.href}
                    type="button"
                    className={`header-nav-link${isActive ? " is-active" : ""}`}
                    onClick={() => goPath(item.href)}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <form className="header-search-panel" role="search" onSubmit={onSearchSubmit}>
              <SearchIcon />
              <input
                ref={searchInputRef}
                className="header-search-input"
                type="search"
                value={searchQuery}
                placeholder="Поиск по сайту"
                aria-label="Поиск по сайту"
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <button
                className="header-search-close"
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Закрыть поиск"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
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
              <SearchIcon />
            </button>

            <button
              className={`header-icon-btn${a11yMode ? " active" : ""}`}
              type="button"
              title="Версия для слабовидящих"
              aria-label="Версия для слабовидящих"
              aria-pressed={a11yMode}
              onClick={() => setA11yMode((value) => !value)}
            >
              <EyeIcon />
            </button>

            {canShowAdminButton && (
              <button className="header-admin-btn" type="button" onClick={onGoAdmin} title="Админ-панель">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="2" y="2" width="5" height="5" rx="1.3" />
                  <rect x="9" y="2" width="5" height="5" rx="1.3" />
                  <rect x="2" y="9" width="5" height="5" rx="1.3" />
                  <rect x="9" y="9" width="5" height="5" rx="1.3" />
                </svg>
                <span className="header-admin-label">Админ-панель</span>
              </button>
            )}

            {canShowTpmpkCabinetButton && (
              <button className="header-tpmpk-btn" type="button" onClick={() => goPath("/admin/tpmpk/")} title="Кабинет ТПМПК">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 21s7-4.4 7-10V5l-7-3-7 3v6c0 5.6 7 10 7 10Z" />
                  <path d="M9 12h6" />
                  <path d="M12 9v6" />
                </svg>
                <span className="header-tpmpk-label">Кабинет ТПМПК</span>
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
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
