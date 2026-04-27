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
    <footer style={{ background: "linear-gradient(180deg, #173285 0%, #1E40AF 100%)", padding: "60px 24px 30px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 30, marginBottom: 50 }}>
          {FOOTER_COLS.map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
                {col.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(l => (
                  <a key={l} href="#" style={{ fontSize: 13, color: "#BFDBFE", textDecoration: "none", transition: "color 0.15s" }}
                    onMouseOver={e => e.currentTarget.style.color = "#fff"}
                    onMouseOut={e => e.currentTarget.style.color = "#BFDBFE"}
                  >{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.15)", paddingTop: 30, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ fontSize: 12, color: "#BFDBFE" }}>
              © 2025 МКУ развития образования города Иркутска
            </span>
            <span style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.4)" }}>|</span>
            <a href="#" style={{ fontSize: 12, color: "#BFDBFE", textDecoration: "none", transition: "color 0.15s" }}
              onMouseOver={e => e.currentTarget.style.color = "#fff"}
              onMouseOut={e => e.currentTarget.style.color = "#BFDBFE"}
            >Политика конфиденциальности</a>
          </div>

          {/* Social icons */}
          <div style={{ display: "flex", gap: 16 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <a key={i} href="#" style={{ 
                width: 32, height: 32, 
                borderRadius: "50%", 
                border: "1px solid rgba(255, 255, 255, 0.2)", 
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#BFDBFE",
                textDecoration: "none",
                transition: "all 0.15s"
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "#fff"; e.currentTarget.style.color = "#fff"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)"; e.currentTarget.style.color = "#BFDBFE"; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  {/* Generic icon shape */}
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </a>
            ))}
          </div>

        </div>
      </div>
    </footer>
  );
}
