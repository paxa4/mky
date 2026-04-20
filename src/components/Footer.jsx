const FOOTER_COLS = [
  {
    title: "Об организации",
    links: ["Основные сведения", "Структура", "Все документы", "Образование", "Образовательные стандарты", "Руководство", "Стипендии", "Платные образовательные услуги", "Финансово-хозяйственная деятельность", "Общественная приёмная", "Вакантные места для приёма"],
  },
  {
    title: "Проекты",
    links: ["Муниципальный семейный клуб «ФамилиЯ»", "Федеральный проект «Формирование самосознания»", "Краеведение в образовании", "Территориальная служба примирения г. Иркутска", "Региональный проект «Я с тобой»", "Научно-методическое сопровождение педагогов", "Муниципальный проект «Я сдам ЕГЭ»", "Социальный проект «Помощь рядом»"],
  },
  {
    title: "Мероприятия",
    links: ["Событийный календарь", "Конкурсы", "Олимпиады", "Конференции"],
  },
  {
    title: "Программы",
    links: ["Муниципальные проекты", "Муниципальные площадки", "Программы развития", "Программы"],
  },
  {
    title: "Педагогам",
    links: ["Молодым педагогам", "Наставничество", "Материалы для управленческих команд", "Профориентационная деятельность"],
  },
  {
    title: "НOKO",
    links: ["Оперативная информация", "ГИА 9 класс", "ГИА 11 класс", "Всероссийские проверочные работы", "Сборники и альманахи"],
  },
];

export default function Footer() {
  return (
    <footer style={{ background: "#0F172A", color: "#94A3B8" }}>
      <style>{`
        .footer-cols {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 32px;
          padding: 48px 24px 40px;
          max-width: 1400px;
          margin: 0 auto;
        }
        @media (max-width: 1100px) { .footer-cols { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 660px)  { .footer-cols { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 400px)  { .footer-cols { grid-template-columns: 1fr; } }

        .footer-col-title {
          font-size: 11px; font-weight: 800; color: #fff;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 14px;
        }
        .footer-link {
          display: block; font-size: 12px; color: #64748B;
          text-decoration: none; margin-bottom: 7px;
          line-height: 1.4; cursor: pointer;
          transition: color 0.15s;
        }
        .footer-link:hover { color: #fff; }

        .footer-bottom {
          border-top: 1px solid #1E293B;
          padding: 20px 24px;
          max-width: 1400px;
          margin: 0 auto;
          display: flex; align-items: flex-start; justify-content: space-between;
          flex-wrap: wrap; gap: 16px;
        }
        .footer-contacts {
          display: flex; flex-direction: column; gap: 4px;
        }
        .footer-contact-line {
          font-size: 12px; color: "#64748B";
          display: flex; align-items: center; gap: 6px;
        }
        .footer-schedule {
          font-size: 12px; color: #64748B; line-height: 1.6;
        }
        .footer-social {
          display: flex; gap: 10px; align-items: center;
        }
        .social-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(255,255,255,0.08); border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #94A3B8;
          transition: background 0.15s, color 0.15s;
        }
        .social-icon:hover { background: #1D4ED8; color: #fff; }
      `}</style>

      {/* Columns */}
      <div className="footer-cols">
        {FOOTER_COLS.map(col => (
          <div key={col.title}>
            <div className="footer-col-title">{col.title}</div>
            {col.links.map(l => (
              <a key={l} className="footer-link">{l}</a>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div>
          <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 6 }}>
            МКУ развития образования города Иркутска
          </div>
          <div className="footer-contacts">
            <span style={{ fontSize: 12, color: "#64748B" }}>664025, Иркутск, ул. Ленина, 26</span>
            <span style={{ fontSize: 12, color: "#64748B" }}>+7 (3952) 201 985, 343 705</span>
            <span style={{ fontSize: 12, color: "#64748B" }}>irk_imcro@bk.ru</span>
          </div>
        </div>

        <div className="footer-schedule">
          <div style={{ color: "#fff", fontWeight: 600, marginBottom: 4, fontSize: 12 }}>Режим работы:</div>
          <div>Понедельник–пятница: 09:00–18:00</div>
          <div>Обеденный перерыв: 13:00–14:00</div>
          <div>Выходные: суббота, воскресенье</div>
        </div>

        <div className="footer-social">
          {["VK", "OK", "TG", "YT", "RS"].map(s => (
            <button key={s} className="social-icon" title={s}>
              <span style={{ fontSize: 10, fontWeight: 700 }}>{s}</span>
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}