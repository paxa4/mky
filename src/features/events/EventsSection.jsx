import { EVENTS } from "./eventsData.js";

export default function EventsSection() {
  return (
    <section style={{ 
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(145deg, #1E40AF 0%, #0284C7 100%)", 
      padding: "80px 24px" 
    }}>
      {/* Background glow effects */}
      <div style={{ position: "absolute", top: "-30%", left: "-10%", width: "60%", height: "120%", background: "radial-gradient(circle, rgba(125, 211, 252, 0.3) 0%, rgba(37, 99, 235, 0) 70%)", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "50%", height: "80%", background: "radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, rgba(2, 132, 199, 0) 70%)", zIndex: 0, pointerEvents: "none" }} />

      <style>{`
        .events-container { max-width: 1200px; margin: 0 auto; width: 100%; }
        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }
        .event-card {
          background: #FFFFFF; /* lower half */
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          border: 1px solid rgba(255, 255, 255, 0.4);
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .event-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 32px rgba(0,0,0,0.15);
        }
        .event-card-top {
          background-color: #F8FAFC; /* top half fallback */
          background-size: cover;
          background-position: center;
          height: 180px;
          border-bottom: 1px solid #E2E8F0;
        }
        .event-card-bottom {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }
        .event-btn {
          align-self: flex-start;
          background: #F1F5F9;
          color: #0F172A;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .event-btn:hover { background: #1D4ED8; color: #fff; }

        .all-projects-wrapper {
          display: flex;
          justify-content: center;
        }
        .all-projects-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          padding: 12px 32px;
          border-radius: 24px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .all-projects-btn:hover { 
          background: #fff; 
          color: #1D4ED8; 
          transform: translateY(-2px);
        }
      `}</style>
      
      <div className="events-container" style={{ position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: "40px" }}>
          Мероприятия / События
        </h2>
        
        <div className="events-grid">
          {EVENTS.map(event => (
            <div key={event.id} className="event-card">
              <div 
                className="event-card-top" 
                style={{ backgroundImage: `url(${event.image})` }}
              >
              </div>
              <div className="event-card-bottom">
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", background: "#EFF6FF", padding: "4px 10px", borderRadius: 12, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                    {event.category}
                  </span>
                  <span style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>
                    {event.date}
                  </span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", lineHeight: 1.4, margin: 0 }}>
                  {event.title}
                </h3>
                <div style={{ flex: 1 }}></div>
                <button className="event-btn">Подробнее</button>
              </div>
            </div>
          ))}
        </div>

        <div className="all-projects-wrapper">
          <button className="all-projects-btn">
            Все события
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
