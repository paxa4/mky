import { useState } from "react";
import Badge from "../../components/Badge.jsx";

export default function NewsCard({ news }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff", borderRadius: 16, overflow: "hidden", cursor: "pointer",
        border: "1px solid #F1F5F9", display: "flex", flexDirection: "column",
        boxShadow: hov ? "0 12px 36px rgba(0,0,0,0.1)" : "0 2px 8px rgba(0,0,0,0.04)",
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        transition: "box-shadow 0.25s, transform 0.25s",
      }}
    >
      <div style={{ height: 178, overflow: "hidden", flexShrink: 0 }}>
        <img src={news.image} alt={news.title} style={{
          width: "100%", height: "100%", objectFit: "cover", display: "block",
          transform: hov ? "scale(1.06)" : "scale(1)",
          transition: "transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)",
        }} />
      </div>
      <div style={{ padding: "18px 20px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Badge label={news.category} color={news.categoryColor} bg={news.categoryBg} />
          <span style={{ fontSize: 11, color: "#94A3B8" }}>{news.date}</span>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", lineHeight: 1.45, margin: "0 0 8px", flex: 1 }}>
          {news.title}
        </h3>
        <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, margin: 0 }}>{news.excerpt}</p>
      </div>
    </div>
  );
}
