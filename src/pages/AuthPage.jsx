import { useState } from "react";
import { API_BASE } from "../constants/index.js";

// FastAPI на 422 возвращает detail в виде массива объектов {loc, msg, type}.
// Приводим к читабельной строке, чтобы не получить "[object Object]".
function formatApiError(err, fallback) {
  const d = err?.detail ?? err?.message;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    return d
      .map(e => (typeof e === "string" ? e : e?.msg || JSON.stringify(e)))
      .join("; ");
  }
  if (d && typeof d === "object") return d.msg || JSON.stringify(d);
  return fallback;
}

// Бэк может отдавать роль в куче разных форматов. Поддерживаем все типичные:
// role / role_name / roles[] / is_admin / is_superuser / is_staff / scope.
// Источник — объединённый объект из /auth/me и payload JWT.
function detectRole(...sources) {
  for (const src of sources) {
    if (!src || typeof src !== "object") continue;

    if (src.is_admin || src.is_superuser || src.is_staff) return "admin";

    const direct = src.role || src.role_name || src.user_role;
    if (typeof direct === "string" && direct.toLowerCase() === "admin") return "admin";

    if (Array.isArray(src.roles)) {
      const has = src.roles.some(r => {
        const v = typeof r === "string" ? r : r?.name || r?.role;
        return String(v || "").toLowerCase() === "admin";
      });
      if (has) return "admin";
    }

    const scope = src.scope || src.scopes;
    if (typeof scope === "string" && /\badmin\b/i.test(scope)) return "admin";
    if (Array.isArray(scope) && scope.some(s => String(s).toLowerCase() === "admin")) return "admin";

    // Фолбэк: бэк не отдаёт роль, но логин/email/sub === "admin".
    // Снять, как только в /auth/me появится явное поле роли.
    const ident = String(src.username || src.login || src.email || src.sub || "").toLowerCase();
    if (ident === "admin") return "admin";
  }
  return "user";
}

// Декодируем payload JWT-токена (без проверки подписи — это делает бэк).
// Нужен только для извлечения email из поля `sub`.
function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch { return null; }
}

// Пробуем получить данные пользователя (роль и т.п.) по токену.
// Если эндпоинта /auth/me нет — вернём null и обойдёмся email из JWT.
async function fetchMe(token) {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// Собираем структуру пользователя для UI.
// email — реальный (из JWT или /auth/me), роль — admin/user.
// Остальные поля — заглушки, пока на бэке нет соответствующих данных.
function buildUser({ email = "", username = "", role, name = "" }) {
  const safeRole = String(role || "user").toLowerCase() === "admin" ? "admin" : "user";
  const baseForName = name || username || (email ? email.split("@")[0] : "");
  const [firstName = "", lastName = ""] = baseForName.trim().split(/\s+/);

  return {
    email,
    role: safeRole,
    firstName,
    lastName,
    middleName:    "",
    username:      username || email,
    phone:         "",
    position:      safeRole === "admin" ? "Администратор" : "Пользователь",
    organization:  "МКУ развития образования города Иркутска",
    qualification: "",
    workExperience: 0,
    birthDate:     "",
    created_at:    new Date().toISOString(),
    subjects:      [],
    certificates:  [],
    achievements:  [],
  };
}

export default function AuthPage({ onBack, onLogin }) {
  const [tab, setTab] = useState("login"); // "login" | "register"
  const [loginForm, setLoginForm]   = useState({ login: "", password: "" });
  const [regForm,   setRegForm]     = useState({ login: "", email: "", password: "" });
  const [showPass,  setShowPass]    = useState(false);
  const [done,      setDone]        = useState(false);
  const [loggedIn,  setLoggedIn]    = useState(false);
  const [loading,   setLoading]     = useState(false);
  const [error,     setError]       = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.login || !loginForm.password) return;
    setError("");
    setLoading(true);
    try {
      // Бэк ожидает OAuth2 form-urlencoded с полями username/password.
      // В username отправляем введённый логин — на бэке он матчится по полю username/login.
      const body = new URLSearchParams();
      body.append("username", loginForm.login);
      body.append("password", loginForm.password);

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(formatApiError(err, `Ошибка входа (${res.status})`));
      }

      const data = await res.json();
      const token = data.access_token;
      if (!token) throw new Error("Сервер не вернул access_token");

      // Сохраняем токен — пригодится для всех будущих авторизованных запросов
      localStorage.setItem("access_token", token);

      // Email достаём из JWT (поле sub), как фолбэк — введённый логин (если он был email-видный)
      const decoded = decodeJWT(token);
      const sub = decoded?.sub || loginForm.login;

      // Пытаемся получить роль и имя через /auth/me; если эндпоинта нет — обойдёмся
      const me = await fetchMe(token);

      // Диагностика: видно в DevTools, какие поля реально пришли (поможет настроить роль)
      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-console
        console.debug("[auth] /me:", me, "jwt:", decoded);
      }

      const user = buildUser({
        email:    me?.email    || (String(sub).includes("@") ? sub : ""),
        username: me?.username || me?.login || loginForm.login,
        role:     detectRole(me, decoded),
        name:     me?.name     || "",
      });

      setLoggedIn(true);
      onLogin?.(user);
    } catch (err) {
      setError(err.message || "Не удалось войти");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.login || !regForm.email || regForm.password.length < 8) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // На бэке поле может называться login или username — отправляем оба
          login:    regForm.login,
          username: regForm.login,
          email:    regForm.email,
          password: regForm.password,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(formatApiError(err, `Ошибка регистрации (${res.status})`));
      }
      // После успешной регистрации бэк может либо сразу логинить, либо нет.
      // В обоих случаях показываем экран успеха — войдёт пользователь через вкладку «Вход».
      setDone(true);
    } catch (err) {
      setError(err.message || "Не удалось зарегистрироваться");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column" }}>
      <style>{`
        .auth-input {
          width: 100%; padding: 12px 14px; font-size: 14px;
          border: 1.5px solid #E2E8F0; border-radius: 10px;
          outline: none; color: #0F172A; background: #F8FAFC;
          transition: border-color 0.2s, background 0.2s;
          font-family: inherit; box-sizing: border-box;
        }
        .auth-input:focus { border-color: #93C5FD; background: #fff; }
        .auth-input::placeholder { color: #94A3B8; }
        .auth-btn {
          width: 100%; padding: 13px; font-size: 15px; font-weight: 700;
          color: #fff; background: #1D4ED8; border: none; border-radius: 10px;
          cursor: pointer; font-family: inherit;
          transition: background 0.15s, transform 0.1s;
        }
        .auth-btn:hover  { background: #1E40AF; transform: translateY(-1px); }
        .auth-btn:active { transform: translateY(0); }
        .auth-btn:disabled { background: #93C5FD; cursor: default; transform: none; }
        .tab-btn {
          flex: 1; padding: 11px; font-size: 14px; font-weight: 600;
          border: none; background: none; cursor: pointer; border-radius: 9px;
          transition: background 0.15s, color 0.15s; font-family: inherit;
        }
        .tab-btn.active { background: #fff; color: #1D4ED8; box-shadow: 0 1px 6px rgba(0,0,0,0.08); }
        .tab-btn:not(.active) { color: #64748B; }
        .tab-btn:not(.active):hover { color: #334155; }
        .divider { display: flex; align-items: center; gap: 12px; margin: 4px 0; }
        .divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: #E2E8F0; }
        .social-btn {
          width: 100%; padding: 11px; font-size: 14px; font-weight: 500;
          color: #334155; background: #fff; border: 1.5px solid #E2E8F0;
          border-radius: 10px; cursor: pointer; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: border-color 0.15s, background 0.15s;
        }
        .social-btn:hover { border-color: #93C5FD; background: #F8FAFC; }
      `}</style>

      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F1F5F9", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
        <img src="https://mc.eduirk.ru/images/headers/imcro2.png" alt="МКУ" style={{ height: 42, objectFit: "contain" }} />
        {onBack && (
          <button onClick={onBack} style={{ background: "none", border: "1px solid #E2E8F0", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748B", padding: "7px 14px", borderRadius: 9, fontFamily: "inherit", transition: "all 0.15s" }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "#93C5FD"; e.currentTarget.style.color = "#1D4ED8"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#64748B"; }}
          >← На главную</button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>

          {/* Logo & title */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM4 20c0-3.866 3.582-7 8-7s8 3.134 8 7" stroke="#1D4ED8" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", margin: "0 0 6px" }}>
              {tab === "login" ? "Добро пожаловать" : "Создать аккаунт"}
            </h1>
            <p style={{ fontSize: 14, color: "#94A3B8" }}>
              {tab === "login" ? "Войдите в личный кабинет" : "Зарегистрируйтесь для доступа к сервисам"}
            </p>
          </div>

          {/* Card */}
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #F1F5F9", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", padding: "28px 32px 32px" }}>

            {/* Tabs */}
            <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 11, padding: 4, marginBottom: 28 }}>
              <button className={`tab-btn${tab === "login" ? " active" : ""}`} onClick={() => { setTab("login"); setDone(false); setError(""); }}>Вход</button>
              <button className={`tab-btn${tab === "register" ? " active" : ""}`} onClick={() => { setTab("register"); setLoggedIn(false); setError(""); }}>Регистрация</button>
            </div>

            {/* LOGIN */}
            {tab === "login" && (
              <>
                {loggedIn ? (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                        <path d="M5 13l6 6L21 7" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Вы вошли!</h3>
                    <p style={{ fontSize: 14, color: "#64748B", marginBottom: 20 }}>Добро пожаловать, {loginForm.login}</p>
                    {onBack && <button className="auth-btn" onClick={onBack}>Перейти на главную</button>}
                  </div>
                ) : (
                  <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {error && (
                      <div style={{ padding: "10px 12px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", fontSize: 13, fontWeight: 500 }}>
                        {error}
                      </div>
                    )}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Логин или Email</label>
                      <input className="auth-input" type="text" placeholder="Логин или email" autoComplete="username"
                        value={loginForm.login} onChange={e => setLoginForm(f => ({ ...f, login: e.target.value }))} required />
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Пароль</label>
                        <span style={{ fontSize: 12, color: "#1D4ED8", cursor: "pointer", fontWeight: 500 }}>Забыли пароль?</span>
                      </div>
                      <div style={{ position: "relative" }}>
                        <input className="auth-input" type={showPass ? "text" : "password"} placeholder="Введите пароль"
                          value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                          style={{ paddingRight: 42 }} required />
                        <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 0, display: "flex" }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M1.5 8C2.3 5 5 3 8 3s5.7 2 6.5 5c-.8 3-3.5 5-6.5 5S2.3 11 1.5 8Z" stroke="currentColor" strokeWidth="1.4"/>
                            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="auth-btn" style={{ marginTop: 4 }}
                      disabled={!loginForm.login || !loginForm.password || loading}>
                      {loading ? "Вход…" : "Войти"}
                    </button>

                  </form>
                )}
              </>
            )}

            {/* REGISTER */}
            {tab === "register" && (
              <>
                {done ? (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                        <path d="M5 13l6 6L21 7" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Готово!</h3>
                    <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, marginBottom: 20 }}>
                      На почту <strong>{regForm.email}</strong><br/>отправлено письмо с подтверждением.
                    </p>
                    <button className="auth-btn" onClick={() => { setTab("login"); setDone(false); }}>Войти в аккаунт</button>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {error && (
                      <div style={{ padding: "10px 12px", borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", fontSize: 13, fontWeight: 500 }}>
                        {error}
                      </div>
                    )}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Логин</label>
                      <input className="auth-input" type="text" placeholder="Например, ivanov_ii" autoComplete="username"
                        value={regForm.login} onChange={e => setRegForm(f => ({ ...f, login: e.target.value }))} required />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Email</label>
                      <input className="auth-input" type="email" placeholder="example@mail.ru"
                        value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Пароль</label>
                      <div style={{ position: "relative" }}>
                        <input className="auth-input" type={showPass ? "text" : "password"} placeholder="Минимум 8 символов"
                          value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                          style={{ paddingRight: 42 }} minLength={8} required />
                        <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 0, display: "flex" }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M1.5 8C2.3 5 5 3 8 3s5.7 2 6.5 5c-.8 3-3.5 5-6.5 5S2.3 11 1.5 8Z" stroke="currentColor" strokeWidth="1.4"/>
                            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/>
                          </svg>
                        </button>
                      </div>
                      {regForm.password.length > 0 && (
                        <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
                          {[1,2,3,4].map(i => (
                            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: regForm.password.length >= i * 2 + 2 ? (regForm.password.length >= 10 ? "#059669" : "#F59E0B") : "#E2E8F0", transition: "background 0.2s" }} />
                          ))}
                        </div>
                      )}
                    </div>
                    <button type="submit" className="auth-btn" style={{ marginTop: 4 }}
                      disabled={!regForm.login || !regForm.email || regForm.password.length < 8 || loading}>
                      {loading ? "Регистрация…" : "Зарегистрироваться"}
                    </button>
                    <p style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", lineHeight: 1.5, margin: 0 }}>
                      Нажимая кнопку, вы соглашаетесь с{" "}
                      <span style={{ color: "#1D4ED8", cursor: "pointer" }}>политикой конфиденциальности</span>
                    </p>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}