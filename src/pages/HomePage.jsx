import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../features/nav/Header.jsx";
import NewsFeed from "../features/news/NewsFeed.jsx";
import EventsSection from "../features/events/EventsSection.jsx";
import DepartmentsSection from "../features/departments/DepartmentsSection.jsx";
import MapSection from "../components/MapSection.jsx";
import Footer from "../components/Footer.jsx";

export default function HomePage({
  onGoAuth,
  onGoAdmin,
  onGoProfile,
  currentUser,
  publishedNews,
  onOpenArticle,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "МКУ развития образования города Иркутска";
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header
        onGoAuth={onGoAuth || ((tab) => navigate(`/auth?tab=${tab || 'login'}`))}
        onGoAdmin={onGoAdmin || (() => navigate("/admin"))}
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
