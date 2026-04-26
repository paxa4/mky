export default function Partners() {
  const partners = [
    { name: "1", img: "/mky/images/partners.jpg"  },
    { name: "Российская академия образования", img: "/mky/images/pao.jpg"  },
    { name: "Партнёр", img: "/mky/images/spo.jpg"  },
    { name: "ИРГУПС", img: "/mky/images/Irgups.jpg"  },
    { name: "ИРНИТУ", img: "/mky/images/irnitu.jpg"  },
  ];

  return (
    <section style={{ padding: "48px 24px", background: "#F8FAFC", borderTop: "1px solid #F1F5F9" }}>
      <style>{`
        .partners-row {
          display: flex; align-items: center; justify-content: center;
          gap: 32px; flex-wrap: wrap;
          position: relative;
        }
        .partner-item {
          width: 120px; height: 80px; border-radius: 12px;
          background: #fff; border: 1px solid #E2E8F0;
          display: flex; align-items: center; justify-content: center;
          padding: 12px; cursor: pointer;
          transition: box-shadow 0.2s, border-color 0.2s;
          flex-shrink: 0;
        }
        .partner-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-color: #BFDBFE; }
        .partner-abbr {
          font-size: 15px; font-weight: 800; color: #334155;
          text-align: center; line-height: 1.2;
        }
        .partner-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 32px; height: 32px; border-radius: 50%;
          background: #fff; border: 1px solid #E2E8F0;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.15s;
        }
        .partner-nav:hover { background: #EFF6FF; border-color: #93C5FD; }
        .partner-nav.left { left: 0; }
        .partner-nav.right { right: 0; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", textTransform: "uppercase", textAlign: "center", marginBottom: 32 }}>
          Наши партнёры
        </h2>

        <div style={{ position: "relative", padding: "0 48px" }}>
          <button className="partner-nav left">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7l4 4" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="partners-row">
            {partners.map((p, i) => (
              <div key={i} className="partner-item">
                {p.img ? (
                  <img src={p.img} alt={p.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                ) : (
                  <div className="partner-abbr">{p.abbr}</div>
                )}
              </div>
            ))}
          </div>

          <button className="partner-nav right">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
