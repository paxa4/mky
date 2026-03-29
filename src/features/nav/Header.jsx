import { useState, useEffect } from "react";
import Logo from "../../components/Logo.jsx";
import MobileDrawer from "./MobileDrawer.jsx";
import { NAV } from "../../constants/index.js";

export default function Header({ onGoAuth, onGoAdmin }) {
  const [scrolled,  setScrolled]  = useState(false);
  const [activeNav, setActiveNav] = useState(null);
  const [menuOpen,  setMenuOpen]  = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <style>{`
        .nav-pill {
          font-size: 14px; font-weight: 500; color: #334155;
          padding: 7px 14px; border-radius: 9px; cursor: pointer;
          white-space: nowrap; transition: color 0.15s, background 0.15s;
          position: relative; user-select: none;
        }
        .nav-pill:hover, .nav-pill.open { color: #1D4ED8; background: #EFF6FF; }

        .dropdown {
          position: absolute; top: 100%; left: 0;
          padding-top: 6px; background: transparent; z-index: 300;
          min-width: 240px;
        }
        .dropdown-inner {
          background: #fff; border: 1px solid #E2E8F0; border-radius: 12px;
          padding: 6px; box-shadow: 0 8px 30px rgba(0,0,0,0.1);
          animation: fadeDown 0.14s ease;
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dropdown-item {
          padding: 9px 13px; font-size: 13px; color: #475569;
          border-radius: 8px; cursor: pointer; transition: background 0.1s, color 0.1s;
          line-height: 1.4;
        }
        .dropdown-item:hover { background: #F1F5F9; color: #1D4ED8; }

        .search-wrap {
          display: flex; align-items: center; gap: 8px;
          background: #F1F5F9; border: 1.5px solid #E2E8F0;
          border-radius: 10px; padding: 7px 13px;
          transition: border-color 0.2s, background 0.2s;
        }
        .search-wrap:focus-within { border-color: #93C5FD; background: #fff; }
        .search-input {
          border: none; background: transparent; outline: none;
          font-size: 14px; color: #0F172A; width: 160px; font-family: inherit;
        }
        .search-input::placeholder { color: #94A3B8; }

        .reg-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; color: #fff;
          padding: 8px 16px; border-radius: 10px;
          background: #1D4ED8; border: none; cursor: pointer;
          white-space: nowrap; flex-shrink: 0; font-family: inherit;
          transition: background 0.15s, transform 0.1s;
        }
        .reg-btn:hover { background: #1E40AF; transform: translateY(-1px); }
        .icon-btn {
          border: 1px solid #E2E8F0; background: none; cursor: pointer;
          width: 36px; height: 36px; border-radius: 10px; display: flex;
          align-items: center; justify-content: center; color: #64748B;
          flex-shrink: 0; transition: background 0.15s;
        }
        .icon-btn:hover { background: #F1F5F9; }

        @media (max-width: 900px) {
          .search-wrap { display: none; }
          .desktop-nav { display: none !important; }
          .reg-btn span { display: none; }
        }
        @media (min-width: 901px) { .burger { display: none !important; } }
      `}</style>

      <header style={{
        position: "sticky", top: 0, zIndex: 200,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #F1F5F9",
        boxShadow: scrolled ? "0 2px 18px rgba(0,0,0,0.07)" : "none",
        transition: "box-shadow 0.3s",
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 16 }}>
          <Logo />

          {/* Desktop nav */}
          <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
            {NAV.map(item => (
              <div key={item.label} style={{ position: "relative" }}
                onMouseEnter={() => setActiveNav(item.label)}
                onMouseLeave={() => setActiveNav(null)}
              >
                <div className={`nav-pill${activeNav === item.label ? " open" : ""}`}>{item.label}</div>
                {activeNav === item.label && (
                  <div className="dropdown"
                    onMouseEnter={() => setActiveNav(item.label)}
                    onMouseLeave={() => setActiveNav(null)}
                  >
                    <div className="dropdown-inner">
                    
                      {item.sub.map((s, i) => (
                        <div
                          key={i}
                          className="dropdown-item"
                          onClick={() => {
                            if (s === "Событийный календарь") {
                              document
                                .getElementById("calendar")
                                ?.scrollIntoView({ behavior: "smooth" });
                            }
                          }}
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Search */}
          <div className="search-wrap">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="5.5" cy="5.5" r="4" stroke="#94A3B8" strokeWidth="1.5"/>
              <path d="M9 9l3 3" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input className="search-input" placeholder="Поиск по сайту…" />
          </div>

          {/* Admin button */}
          {onGoAdmin && (
            <button onClick={onGoAdmin} className="icon-btn" title="Панель администратора">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="9" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="2" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="9" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
            </button>
          )}

          {/* Register */}
          <button className="reg-btn" onClick={onGoAuth}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
              <path d="M7 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM1.5 13c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>Регистрация</span>
          </button>


          {/* Burger */}
          <button className="icon-btn burger" onClick={() => setMenuOpen(true)}>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M0 1h16M0 6h16M0 11h16" stroke="#334155" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </header>
      

      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} setCurrentPage={() => {}} />
    </>
  );
}