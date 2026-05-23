const FOOTER_COLS = [
  { 
    title: "О НАС", 
    links: ["Об организации", "Руководство", "Структура", "Документы", "Вакансии"] 
  },
  { 
    title: "РАЗДЕЛЫ", 
    links: ["Деятельность", "Подразделения", "Аттестация", "Повышение квалификации"] 
  },
  { 
    title: "ПРОЕКТЫ", 
    links: ["ФГОС 2.0", "Эврика", "ВСОШ", "Конкурсы и гранты"] 
  },
  { 
    title: "ССЫЛКИ", 
    links: ["Министерство просвещения РФ", "Портал Госуслуг", "Администрация г. Иркутска"] 
  },
];

export default function Footer() {
  return (
    <footer style={{ background: "linear-gradient(180deg, #12536E 0%, #145F7D 100%)", padding: "60px 24px 30px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 30, marginBottom: 50 }}>
          {FOOTER_COLS.map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
                {col.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(l => (
                  <a key={l} href="#" style={{ fontSize: 13, color: "#A9D9E7", textDecoration: "none", transition: "color 0.15s" }}
                    onMouseOver={e => e.currentTarget.style.color = "#fff"}
                    onMouseOut={e => e.currentTarget.style.color = "#A9D9E7"}
                  >{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.15)", paddingTop: 30, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ fontSize: 12, color: "#A9D9E7" }}>
              © 2025 МКУ развития образования города Иркутска
            </span>
            <span style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.4)" }}>|</span>
            <a href="#" style={{ fontSize: 12, color: "#A9D9E7", textDecoration: "none", transition: "color 0.15s" }}
              onMouseOver={e => e.currentTarget.style.color = "#fff"}
              onMouseOut={e => e.currentTarget.style.color = "#A9D9E7"}
            >Политика конфиденциальности</a>
          </div>

        </div>
      </div>
    </footer>
  );
}
