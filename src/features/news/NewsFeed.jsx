import FeaturedCard from "./FeaturedCard.jsx";
import NewsCard from "./NewsCard.jsx";
import { NEWS } from "./newsData.js";

export default function NewsFeed() {
  return (
    <section>
      <style>{`
        .news-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 18px; min-height: 520px; }
        .featured-cell { grid-row: 1 / 3; }
        @media (max-width: 920px) { .news-grid { grid-template-columns: 1fr 1fr; grid-template-rows: auto; min-height: unset; } .featured-cell { grid-row: auto; grid-column: 1 / 3; min-height: 340px; } }
        @media (max-width: 580px) { .news-grid { grid-template-columns: 1fr; } .featured-cell { grid-column: auto; min-height: 280px; } }
      `}</style>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", lineHeight: 1 }}>Новости</h1>
          <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 5 }}>Актуальные события и достижения</p>
        </div>
        <button style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "#1D4ED8", padding: "8px 16px", borderRadius: 10, border: "1.5px solid #BFDBFE", background: "#EFF6FF", cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.15s" }}>
          Все новости
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="news-grid">
        <div className="featured-cell"><FeaturedCard news={NEWS[0]} /></div>
        {NEWS.slice(1).map(n => <NewsCard key={n.id} news={n} />)}
      </div>
    </section>
  );
}
