import FeaturedCard from "./FeaturedCard.jsx";
import NewsCard from "./NewsCard.jsx";
import { NEWS } from "./newsData.js";

export default function NewsFeed({ publishedNews, onOpenArticle }) {
  const newsItems = publishedNews?.length ? publishedNews : NEWS;

  return (
    <section style={{ 
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)", 
      padding: "60px 24px" 
    }}>
      {/* Subtle background glow effects */}
      <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "50%", height: "80%", background: "radial-gradient(circle, rgba(147, 197, 253, 0.15) 0%, rgba(255, 255, 255, 0) 70%)", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-30%", left: "-10%", width: "60%", height: "100%", background: "radial-gradient(circle, rgba(199, 210, 254, 0.2) 0%, rgba(255, 255, 255, 0) 70%)", zIndex: 0, pointerEvents: "none" }} />

      <style>{`
        .news-container { max-width: 1200px; margin: 0 auto; width: 100%; }
        .news-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          grid-template-rows: auto auto; 
          gap: 20px; 
        }
        .featured-cell { grid-row: 1 / 3; grid-column: 1 / 2; }
        .right-top-cells {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .right-bottom-cell {
          grid-column: 2 / 3;
        }
        
        @media (max-width: 900px) { 
          .news-grid { grid-template-columns: 1fr; }
          .featured-cell { grid-column: 1; grid-row: auto; min-height: 400px; }
          .right-bottom-cell { grid-column: 1; }
        }
        @media (max-width: 580px) { 
          .right-top-cells { grid-template-columns: 1fr; }
        }
        
        .page-btn {
          width: 36px; height: 36px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          background: #fff;
          color: #64748B;
          font-size: 14px;
          font-weight: 600;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        .page-btn:hover:not(:disabled) {
          border-color: #1D4ED8;
          color: #1D4ED8;
        }
        .page-btn.active {
          background: #1D4ED8;
          color: #fff;
          border-color: #1D4ED8;
        }
        .page-btn:disabled {
          opacity: 0.5;
          cursor: default;
          background: #F8FAFC;
        }
      `}</style>

      <div className="news-container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 30, gap: 16 }}>
          <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1 }}>
            Новости
          </h2>
          <a href="#" style={{ fontSize: 14, fontWeight: 600, color: "#94A3B8", textDecoration: "none" }}>
            Все новости
          </a>
        </div>

        <div className="news-grid">
          {/* Main big card on the left */}
          <div className="featured-cell">
            <FeaturedCard news={newsItems[0]} onClick={() => onOpenArticle?.(newsItems[0])} />
          </div>

          {/* Right column: top row 2 cards */}
          <div className="right-top-cells">
            {newsItems.slice(1, 3).map((news) => (
              <NewsCard key={news.id} news={news} onClick={() => onOpenArticle?.(news)} />
            ))}
          </div>

          {/* Right column: bottom row 1 wide horizontal card */}
          <div className="right-bottom-cell">
            {newsItems[3] && <NewsCard news={newsItems[3]} horizontal={true} onClick={() => onOpenArticle?.(newsItems[3])} />}
          </div>
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 40 }}>
          <button className="page-btn" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          
          <button className="page-btn active">1</button>
          <button className="page-btn">2</button>
          <button className="page-btn">3</button>
          <span style={{ color: "#94A3B8", margin: "0 4px", fontSize: 14, fontWeight: 700 }}>...</span>
          <button className="page-btn">14</button>

          <button className="page-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
