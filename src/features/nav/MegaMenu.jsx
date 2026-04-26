import { useEffect } from "react";

export default function MegaMenu({ open, onClose }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
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
          background: #F8FAFC;
          z-index: 190;
          padding: 30px 24px;
          overflow-y: auto;
          animation: megaFadeIn 0.2s ease-out;
        }
        @keyframes megaFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mega-container {
          max-width: 1400px; /* Made wider to fit 6 columns easily */
          margin: 0 auto;
        }

        /* Search Bar */
        .mega-search-wrap {
          background: #fff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          padding: 12px 16px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          gap: 12px;
        }
        .mega-search-input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 15px;
          color: #0F172A;
        }
        .mega-search-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #64748B;
          display: flex;
          align-items: center;
        }
        .mega-search-close:hover { color: #0F172A; }

        /* Grid */
        .mega-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
          align-items: start;
        }

        @media (max-width: 1200px) { .mega-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 900px)  { .mega-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px)  { .mega-grid { grid-template-columns: 1fr; } }

        /* Cards */
        .m-card {
          background: #fff;
          border-radius: 12px;
          padding: 20px 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .m-card-blue {
          background: #1D4ED8;
          color: #fff;
          border-radius: 12px;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 4px 16px rgba(29, 78, 216, 0.2);
        }

        .m-title {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #0F172A;
        }
        .m-link {
          font-size: 12.5px;
          color: #334155;
          text-decoration: none;
          line-height: 1.4;
          transition: color 0.15s;
        }
        .m-link-blue {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          text-decoration: none;
          text-transform: uppercase;
          line-height: 1.4;
          transition: opacity 0.15s;
        }
        .m-link:hover { color: #2563EB; }
        .m-link-blue:hover { opacity: 0.8; }
        
        .m-bold-link {
          font-size: 12.5px;
          font-weight: 700;
          color: #0F172A;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 0.15s;
        }
        .m-bold-link:hover { color: #2563EB; }
      `}</style>

      <div className="mega-overlay">
        <div className="mega-container">
          
          <div className="mega-search-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input type="text" className="mega-search-input" placeholder="Поиск" autoFocus />
            <button className="mega-search-close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mega-grid">
            
            {/* Column 1 */}
            <div className="m-card">
              <div className="m-title">ОБ ОРГАНИЗАЦИИ {'>'}</div>
              <a href="#" className="m-link">Основные сведения</a>
              <a href="#" className="m-link">Структура и органы управления образовательной организацией</a>
              <a href="#" className="m-link">Документы</a>
              <a href="#" className="m-link">Образование</a>
              <a href="#" className="m-link">Образовательные стандарты</a>
              <a href="#" className="m-link">Руководство. Педагогический состав</a>
              <a href="#" className="m-link">Материально-техническое обеспечение...</a>
              <a href="#" className="m-link">Стипендии и иные виды материальной поддержки</a>
              <a href="#" className="m-link">Платные образовательные услуги</a>
              <a href="#" className="m-link">Финансово-хозяйственная деятельность</a>
              <a href="#" className="m-link">Вакантные места (прием/перевод)</a>
              <a href="#" className="m-link">Доступная среда</a>
            </div>

            {/* Column 2 */}
            <div className="m-card">
              <div className="m-title">ПОДРАЗДЕЛЕНИЯ {'>'}</div>
              <a href="#" className="m-link">ТПМПК</a>
              <a href="#" className="m-link">Профсоюз</a>
              <a href="#" className="m-link">Структурное подразделение оценки качества образования</a>
              <a href="#" className="m-link">Структурное подразделение муниципальной системы оценки качества, статистики, мониторинга...</a>
            </div>

            {/* Column 3 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="m-card">
                <a href="#" className="m-bold-link">ОЛИМПИАДЫ</a>
                <a href="#" className="m-bold-link">КОНКУРСЫ</a>
                <a href="#" className="m-bold-link">КОНФЕРЕНЦИИ</a>
                <a href="#" className="m-bold-link">ПЛАН РАБОТЫ</a>
                <a href="#" className="m-bold-link">ПРОГРАММЫ РАЗВИТИЯ</a>
              </div>
              <div className="m-card">
                <a href="#" className="m-bold-link" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  СОБЫТИЙНЫЙ КАЛЕНДАРЬ <span>{'>'}</span>
                </a>
              </div>
            </div>

            {/* Column 4 */}
            <div className="m-card">
              <div className="m-title">НОКО {'>'}</div>
              <a href="#" className="m-link">Организационно-правовые и нормативные документы</a>
              <a href="#" className="m-link">ГИА 9 класс</a>
              <a href="#" className="m-link">ГИА 11 класс</a>
              <a href="#" className="m-link">Всероссийские проверочные работы</a>
              <a href="#" className="m-link">Сборники и альманахи</a>
              <a href="#" className="m-link">Функциональная грамотность обучающихся</a>
              <a href="#" className="m-link">Российско-белорусские совместные проекты</a>
              <a href="#" className="m-link">ФИОКО</a>
            </div>

            {/* Column 5 */}
            <div className="m-card">
              <div className="m-title">НАСТАВНИЧЕСТВО {'>'}</div>
              <a href="#" className="m-link">НОРМАТИВНЫЕ ДОКУМЕНТЫ</a>
              <a href="#" className="m-link">НАЙТИ НАСТАВНИКА</a>
              <a href="#" className="m-link">СОВЕТ НАСТАВНИКОВ</a>
              <a href="#" className="m-link">ШКОЛЫ НАСТАВНИЧЕСТВА</a>
              <a href="#" className="m-link">ОБСУЖДЕНИЯ</a>
              <a href="#" className="m-link">ОПЫТ НАСТАВНИКОВ</a>
              <a href="#" className="m-link">Конкурсы</a>
            </div>

            {/* Column 6 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="m-card">
                <div className="m-title">ПРОФОРИЕНТАЦИОННАЯ ДЕЯТЕЛЬНОСТЬ {'>'}</div>
              </div>
              <div className="m-card-blue">
                <a href="#" className="m-link-blue">АВГУСТОВСКИЕ ПЕДАГОГИЧЕСКИЕ СОВЕЩАНИЯ</a>
                <a href="#" className="m-link-blue">КОМПЬЮТЕРИАДА</a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
