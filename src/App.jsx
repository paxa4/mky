import { useState } from "react";
import HomePage from "./pages/HomePage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import ChatBot from "./components/ChatBot.jsx";

export default function App() {
  const [page, setPage] = useState("home"); // "home" | "auth" | "admin"

  return (
    <>
      {page === "home" && <HomePage 
        onGoAuth={() => setPage("auth")} 
        onGoAdmin={() => setPage("admin")}
      />}
      {page === "auth" && <AuthPage onBack={() => setPage("home")} />}
      {page === "admin" && <AdminPage onBack={() => setPage("home")} />} 
      <ChatBot />
    </>
  );
}