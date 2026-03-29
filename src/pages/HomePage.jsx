import { useEffect } from "react";
import Header from "../features/nav/Header.jsx";
import NewsFeed from "../features/news/NewsFeed.jsx";
import Stats from "../features/stats/Stats.jsx";
import QuickAccess from "../features/quick/QuickAccess.jsx";
import Footer from "../components/Footer.jsx";

export default function HomePage({ onGoAuth, onGoAdmin }) {  

  useEffect(() => {
    document.title = "МКУ развития образования города Иркутска";
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header onGoAuth={onGoAuth} onGoAdmin={onGoAdmin} /> 

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 24px 56px", width: "100%", flex: 1 }}>
        <NewsFeed />
        <Stats />
        <QuickAccess />
      </main>

      <Footer />
    </div>
  );
}