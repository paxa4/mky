import { useEffect } from "react";
import Header              from "../features/nav/Header.jsx";
import NewsFeed            from "../features/news/NewsFeed.jsx";
import EventsSection       from "../features/events/EventsSection.jsx";
import DepartmentsSection  from "../features/departments/DepartmentsSection.jsx";
import MapSection          from "../components/MapSection.jsx";
import Footer              from "../components/Footer.jsx";

export default function HomePage({ onGoAuth, onGoAdmin, onGoProfile, currentUser, publishedNews, onOpenArticle }) {
  useEffect(() => {
    document.title = "МКУ развития образования города Иркутска";
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'PT Sans', system-ui, sans-serif", color: "#0F172A" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; min-height: 100vh; overflow-x: hidden; }
      `}</style>

      <Header
        onGoAuth={onGoAuth}
        onGoAdmin={onGoAdmin}
        onGoProfile={onGoProfile}
        currentUser={currentUser}
      />

      <main style={{ flex: 1 }}>
        <NewsFeed publishedNews={publishedNews} onOpenArticle={onOpenArticle} />
        <EventsSection />
        <DepartmentsSection />
        <MapSection />
      </main>

      <Footer />
    </div>
  );
}
