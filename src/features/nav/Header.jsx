import { useState, useEffect } from "react";
import Logo from "../../components/Logo.jsx";
import MegaMenu from "./MegaMenu.jsx";

const NAV = [
  { label: "Главная", sub: [] },
  { label: "Об организации", sub: ["История", "Руководство", "Документы", "Контакты"] },
  { label: "Подразделения", sub: [] },
  { label: "Деятельность", sub: ["Методическая работа", "Аттестация", "Конкурсы"] },
  { label: "Документы", sub: [] },
  { label: "Контакты", sub: [] },
];

export default function Header({ onGoAuth, onGoAdmin, onGoProfile, currentUser }) {
  const [scrolled, setScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState(null);
  const [catalogOpen, setCatalogOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <style>{`
        .nav-pill {
          font-size: 14px;
          font-weight: 500;
          color: #1E293B;
          padding: 8px 10px;
          border-radius: 6px;
          cursor: pointer;
          white-space: nowrap;
          transition: color 0.15s;
          user-select: none;
        }
        .nav-pill:hover, .nav-pill.open { color: #1D4ED8; }
        .dropdown { position: absolute; top: 100%; left: 0; padding-top: 6px; background: transparent; z-index: 300; }
        .dropdown-inner { background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 6px; min-width: 180px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); animation: fadeDown 0.14s ease; }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .dropdown-item { padding: 8px 12px; font-size: 13.5px; color: #475569; border-radius: 6px; cursor: pointer; transition: background 0.1s, color 0.1s; }
        .dropdown-item:hover { background: #F1F5F9; color: #1D4ED8; }

        .icon-btn-round {
          width: 38px; height: 38px; border-radius: 50%; border: 1px solid #E2E8F0;
          background: #fff; display: flex; align-items: center; justify-content: center;
          color: #64748B; cursor: pointer; transition: background 0.15s, border-color 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .icon-btn-round:hover { background: #F8FAFC; border-color: #1D4ED8; color: #1D4ED8; }

        .text-btn { font-size: 14px; font-weight: 600; color: #1E293B; background: none; border: none; cursor: pointer; padding: 8px; transition: color 0.15s; flex-shrink: 0; }
        .text-btn:hover { color: #086ED6; }

        .reg-btn2 {
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 600; color: #fff; background: #60A5FA;
          padding: 8px 18px; border-radius: 20px; border: none; cursor: pointer; transition: background 0.15s;
          flex-shrink: 0;
        }
        .reg-btn2:hover { background: #3B82F6; }

        .profile-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 5px 14px 5px 5px; border-radius: 22px;
          border: 1.5px solid #E2E8F0; background: #fff;
          cursor: pointer; font-family: inherit;
          transition: border-color 0.15s, background 0.15s;
          flex-shrink: 0;
        }
        .profile-btn:hover { border-color: #93C5FD; background: #F8FAFC; }
        .profile-avatar {
          width: 30px; height: 30px; border-radius: "50%";
          background: linear-gradient(135deg, #1D4ED8, #7C3AED);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 11px; font-weight: 800; flex-shrink: 0;
          border-radius: 50%;
        }

        .catalog-btn {
          display: flex; align-items: center; justify-content: center;
          background: transparent; color: #1E293B;
          border: none; padding: 8px; border-radius: 8px;
          cursor: pointer; transition: background 0.15s, color 0.15s;
        }
        .catalog-btn:hover { background: #F1F5F9; color: #1D4ED8; }

        @media (max-width: 1040px) { .desktop-nav { display: none !important; } }
        @media (max-width: 720px) {
          .text-btn, .reg-btn2 { display: none; }
          .profile-name { display: none; }
        }
      `}</style>

      {/* Spacer чтобы контент не уехал под фиксированный header */}
      <div style={{ height: 73 }}></div>

      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        background: "rgba(255,255,255,0.98)",
        borderBottom: "1px solid #E2E8F0",
        boxShadow: scrolled ? "0 8px 30px rgba(0, 0, 0, 0.12)" : "0 2px 8px rgba(0, 0, 0, 0.06)",
        transition: "box-shadow 0.3s",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 72, display: "flex", alignItems: "center", gap: 24, justifyContent: "space-between" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <Logo />

            <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {NAV.map(item => (
                <div key={item.label} style={{ position: "relative" }}
                  onMouseEnter={() => item.sub.length && setActiveNav(item.label)}
                  onMouseLeave={() => item.sub.length && setActiveNav(null)}
                >
                  <div className={`nav-pill${activeNav === item.label ? " open" : ""}`}>{item.label}</div>
                  {activeNav === item.label && item.sub.length > 0 && (
                    <div className="dropdown">
                      <div className="dropdown-inner">
                        {item.sub.map((s, i) => <div key={i} className="dropdown-item">{s}</div>)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="icon-btn-round" title="Версия для слабовидящих">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>

            <button className="icon-btn-round" title="Поиск">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>

            {onGoAdmin && (
              <button className="icon-btn-round" title="Панель администратора" onClick={onGoAdmin}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
                  <rect x="9" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
                  <rect x="2" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
                  <rect x="9" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
                </svg>
              </button>
            )}

            {currentUser ? (
              <button className="profile-btn" onClick={onGoProfile} title="Личный кабинет">
                <div className="profile-avatar">
                  {`${currentUser.firstName?.[0] || ""}${currentUser.lastName?.[0] || ""}`}
                </div>
                <span className="profile-name" style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                  {currentUser.firstName}
                </span>
              </button>
            ) : (
              <>
                <button className="text-btn" onClick={() => onGoAuth?.("login")}>Вход</button>
                <button className="reg-btn2" onClick={() => onGoAuth?.("register")}>Регистрация</button>
              </>
            )}

            <button className="catalog-btn" onClick={() => setCatalogOpen(!catalogOpen)} title="Меню">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {catalogOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>
      </header>

      <MegaMenu open={catalogOpen} onClose={() => setCatalogOpen(false)} />
    </>
  );
}
