const FOOTER_COLS = [
  { title: "Разделы",   links: ["Об организации", "Деятельность", "Мероприятия", "Проекты"] },
  { title: "Сервисы",   links: ["Аттестация", "Курсы ПК", "Конкурсы", "Мониторинг"] },
  { title: "Контакты",  links: ["664025, Иркутск, ул. Ленина, 26", "+7 (3952) 201 985", "irk_imcro@bk.ru"] },
];

export default function Footer() {
  return (
    <footer style={{ background: "#0F172A", padding: "52px 24px 28px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 40, marginBottom: 44 }}>

          {/* Logo + description */}
          <div>
            <div style={{ marginBottom: 14 }}>
              <img
                src="https://mc.eduirk.ru/images/headers/imcro2.png"
                alt="МКУ"
                style={{ height: 44, width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }}
              />
            </div>
            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
              Муниципальное казённое учреждение развития образования города Иркутска
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
                {col.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {col.links.map(l => (
                  <a key={l} style={{ fontSize: 13, color: "#64748B", cursor: "pointer", textDecoration: "none", display: "block", transition: "color 0.15s" }}
                    onMouseOver={e => e.currentTarget.style.color = "#fff"}
                    onMouseOut={e => e.currentTarget.style.color = "#64748B"}
                  >{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid #1E293B", paddingTop: 22, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#475569" }}>
            © 2025 МКУ развития образования города Иркутска. Все права защищены.
          </span>
          <div style={{ display: "flex", gap: 20 }}>
            <button style={{ fontSize: 12, color: "#64748B", background: "none", border: "none", padding: 0, cursor: "pointer", transition: "color 0.15s" }}
              onMouseOver={e => e.currentTarget.style.color = "#fff"}
              onMouseOut={e => e.currentTarget.style.color = "#64748B"}
            >Политика конфиденциальности</button>
            <button style={{ fontSize: 12, color: "#64748B", background: "none", border: "none", padding: 0, cursor: "pointer", transition: "color 0.15s" }}
              onMouseOver={e => e.currentTarget.style.color = "#fff"}
              onMouseOut={e => e.currentTarget.style.color = "#64748B"}
            >Карта сайта</button>
          </div>
        </div>

      </div>
    </footer>
  );
}
