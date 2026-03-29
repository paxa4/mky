import { useState } from "react";
import Badge from "../../components/Badge.jsx";

export default function FeaturedCard({ news }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative", borderRadius: 18, overflow: "hidden", cursor: "pointer",
        height: "100%", minHeight: 400,
        boxShadow: hov ? "0 24px 56px rgba(0,0,0,0.18)" : "0 4px 20px rgba(0,0,0,0.08)",
        transition: "box-shadow 0.3s",
      }}
    >
      <img src={news.image} alt={news.title} style={{
        position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
        transform: hov ? "scale(1.04)" : "scale(1)",
        transition: "transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94)",
      }} />

      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,20,50,0.92) 0%, rgba(10,20,50,0.25) 55%, transparent 100%)" }} />

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Badge label={news.category} color={news.categoryColor} bg={news.categoryBg} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{news.date}</span>
        </div>
        <h3 style={{ fontSize: 21, fontWeight: 800, color: "#fff", lineHeight: 1.35, margin: "0 0 10px", letterSpacing: "-0.02em" }}>
          {news.title}
        </h3>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: "0 0 16px" }}>
          {news.excerpt}
        </p>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "#93C5FD" }}>
          Читать далее
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2.5 6.5h8M7.5 3.5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
    </div>
  );
}
