import { useState } from "react";
import HomePage from "./pages/HomePage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import AdminPage from "./pages/admin/AdminPage.jsx";
import ChatBot from "./components/ChatBot.jsx";

export default function App() {
  const [page, setPage] = useState("home");
  const [isAdmin] = useState(true);

  return (
    <>
      {page === "home"  && <HomePage onGoAuth={() => setPage("auth")} onGoAdmin={isAdmin ? () => setPage("admin") : null} />}
      {page === "auth"  && <AuthPage onBack={() => setPage("home")} />}
      {page === "admin" && <AdminPage onBack={() => setPage("home")} />}
      {page !== "admin" && <ChatBot />}
    </>
  );
}