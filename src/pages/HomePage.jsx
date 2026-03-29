import { useEffect } from "react";
import Header from "../features/nav/Header.jsx";
import NewsFeed from "../features/news/NewsFeed.jsx";
import EventCalendar from "../features/calendar/EventCalendar.jsx";
import Projects from "../features/projects/Projects.jsx";
import Partners from "../features/projects/Partners.jsx";
import Footer from "../components/Footer.jsx";

export default function HomePage({ onGoAuth, onGoAdmin }) {
  useEffect(() => {
    document.title = "МКУ развития образования города Иркутска";
  }, []);

  return (
    <div style={{ fontFamily: "'PT Sans', system-ui, sans-serif", background: "#F8FAFC", minHeight: "100vh", width: "100%", color: "#0F172A" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; min-height: 100vh; overflow-x: hidden; }
      `}</style>

      <Header onGoAuth={onGoAuth} onGoAdmin={onGoAdmin} />

      <main>
        {/* News section */}
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "36px 24px 0" }}>
          <NewsFeed />
        </div>

        {/* Calendar */}
        <EventCalendar />

        {/* Projects */}
        <Projects />

        {/* Partners */}
        <Partners />
      </main>

      <Footer />
    </div>
  );
}