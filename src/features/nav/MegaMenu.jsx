import { useEffect } from "react";
import { SVEDENIYA_QUICK_LINKS } from "../../pages/svedeniya/svedeniyaData.js";

const COLUMNS = [
  {
    title: "Об организации",
    links: [
      "Основные сведения",
      "Структура и органы управления",
      "Документы",
      "Образование",
      "Руководство",
      "Материально-техническое обеспечение",
      "Платные образовательные услуги",
      "Доступная среда",
    ],
  },
  {
    title: "Подразделения",
    links: [
      "ТПМПК",
      "Профсоюз",
      "Оценка качества образования",
      "Мониторинг и статистика",
      "Методические объединения",
    ],
  },
  {
    title: "Мероприятия",
    links: [
      "Олимпиады",
      "Конкурсы",
      "Конференции",
      "План работы",
      "Программы развития",
      "Событийный календарь",
    ],
  },
  {
    title: "НОКО",
    links: [
      "Организационно-правовые документы",
      "ГИА 9 класс",
      "ГИА 11 класс",
      "Всероссийские проверочные работы",
      "Функциональная грамотность",
      "ФИОКО",
    ],
  },
  {
    title: "Наставничество",
    links: [
      "Нормативные документы",
      "Найти наставника",
      "Совет наставников",
      "Школы наставничества",
      "Опыт наставников",
      "Конкурсы",
    ],
  },
];

function handleLinkClick(label, onClose) {
  if (label === "Событийный календарь") {
    document.getElementById("calendar")?.scrollIntoView({ behavior: "smooth" });
    onClose();
  }
}

function goPath(path) {
  window.location.href = path;
}

export default function MegaMenu({ open, onClose }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <style>{`
        .mega-overlay {
          position: fixed;
          top: 73px;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 210;
          background: #f8fafc;
          overflow-y: auto;
          padding: 30px 24px;
          animation: megaFadeIn 0.18s ease-out;
        }

        @keyframes megaFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mega-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .mega-search-wrap {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
        }

        .mega-sveden-band {
          display: grid;
          grid-template-columns: minmax(0, 330px) minmax(0, 1fr);
          gap: 16px;
          margin-bottom: 18px;
        }

        .mega-sveden-card {
          background: #fff;
          border: 1px solid #dbe5f1;
          border-radius: 12px;
          padding: 18px;
          display: grid;
          gap: 10px;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
        }

        .mega-sveden-card p {
          color: #475569;
          font-size: 13px;
          line-height: 1.5;
          font-weight: 650;
        }

        .mega-sveden-open {
          min-height: 40px;
          width: fit-content;
          border: 1px solid #dbe5f1;
          border-radius: 10px;
          background: #1e3a8a;
          color: #fff;
          padding: 0 14px;
          font: 900 13px/1 inherit;
          cursor: pointer;
        }

        .mega-sveden-links {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .mega-sveden-link {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fbff;
          padding: 11px 12px;
          color: #334155;
          text-align: left;
          font: 850 12.5px/1.35 inherit;
          cursor: pointer;
        }

        .mega-sveden-link:hover,
        .mega-sveden-open:hover {
          background: #0f2f78;
          color: #fff;
        }

        .mega-search-input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          font: 700 15px/1 inherit;
          color: #0f172a;
        }

        .mega-search-close {
          width: 34px;
          height: 34px;
          border: none;
          border-radius: 8px;
          background: #f1f5f9;
          color: #64748b;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .mega-search-close:hover {
          color: #0f172a;
          background: #e2e8f0;
        }

        .mega-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 16px;
          align-items: start;
        }

        .m-card,
        .m-card-blue {
          border-radius: 12px;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 11px;
          box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
        }

        .m-card {
          background: #fff;
          border: 1px solid #eef2f7;
        }

        .m-card-blue {
          background: #19789C;
          color: #fff;
          box-shadow: 0 10px 26px rgba(29, 78, 216, 0.24);
        }

        .m-title {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #0f172a;
        }

        .m-link,
        .m-bold-link,
        .m-link-blue {
          border: 0;
          background: transparent;
          padding: 0;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
          line-height: 1.38;
        }

        .m-link {
          font-size: 12.5px;
          font-weight: 600;
          color: #334155;
        }

        .m-bold-link {
          font-size: 12.5px;
          font-weight: 900;
          color: #0f172a;
          text-transform: uppercase;
        }

        .m-link-blue {
          font-size: 12px;
          font-weight: 900;
          color: #fff;
          text-transform: uppercase;
        }

        .m-link:hover,
        .m-bold-link:hover {
          color: #2563eb;
        }

        .m-link-blue:hover {
          opacity: 0.82;
        }

        @media (max-width: 1200px) {
          .mega-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }

        @media (max-width: 900px) {
          .mega-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 600px) {
          .mega-overlay {
            top: 65px;
            padding: 18px 14px;
          }
          .mega-sveden-band {
            grid-template-columns: 1fr;
          }
          .mega-sveden-links {
            grid-template-columns: 1fr;
          }
          .mega-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="mega-overlay">
        <div className="mega-container">
          <div className="mega-search-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input type="text" className="mega-search-input" placeholder="Поиск" autoFocus />
            <button className="mega-search-close" onClick={onClose} type="button" title="Закрыть меню" aria-label="Закрыть меню">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mega-sveden-band">
            <div className="mega-sveden-card">
              <div className="m-title">Сведения об ОО &gt;</div>
              <p>Официальный раздел с 13 обязательными подразделами, встроенный в общий сайт и доступный по маршруту /sveden/.</p>
              <button className="mega-sveden-open" type="button" onClick={() => goPath("/sveden/")}>
                Открыть раздел
              </button>
            </div>

            <div className="mega-sveden-links">
              {SVEDENIYA_QUICK_LINKS.map((item) => (
                <button
                  className="mega-sveden-link"
                  type="button"
                  key={item.path}
                  onClick={() => goPath(item.path)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mega-grid">
            {COLUMNS.slice(0, 2).map((column) => (
              <div className="m-card" key={column.title}>
                <div className="m-title">{column.title} &gt;</div>
                {column.links.map((link) => (
                  <button className="m-link" type="button" key={link} onClick={() => handleLinkClick(link, onClose)}>
                    {link}
                  </button>
                ))}
              </div>
            ))}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="m-card">
                {COLUMNS[2].links.slice(0, 5).map((link) => (
                  <button className="m-bold-link" type="button" key={link} onClick={() => handleLinkClick(link, onClose)}>
                    {link}
                  </button>
                ))}
              </div>
              <div className="m-card">
                <button className="m-bold-link" type="button" onClick={() => handleLinkClick("Событийный календарь", onClose)}>
                  Событийный календарь &gt;
                </button>
              </div>
            </div>

            {COLUMNS.slice(3).map((column) => (
              <div className="m-card" key={column.title}>
                <div className="m-title">{column.title} &gt;</div>
                {column.links.map((link) => (
                  <button className="m-link" type="button" key={link} onClick={() => handleLinkClick(link, onClose)}>
                    {link}
                  </button>
                ))}
              </div>
            ))}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="m-card">
                <div className="m-title">Профориентационная деятельность &gt;</div>
              </div>
              <div className="m-card-blue">
                <button className="m-link-blue" type="button">Августовские педагогические совещания</button>
                <button className="m-link-blue" type="button">Компьютериада</button>
                <button className="m-link-blue" type="button">Генератор грамот</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
