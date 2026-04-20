import { useState } from "react";

// ─── Mock-данные пользователя (заменить на API при интеграции бэкенда) ────────
export const MOCK_USER = {
  id: 1,
  firstName:   "Ирина",
  lastName:    "Абрамова",
  middleName:  "Владимировна",
  username:    "abramova_iv",
  email:       "abramova@mc.eduirk.ru",
  phone:       "+7 (3952) 20-19-85",
  position:    "Методист",
  organization:"МКУ развития образования города Иркутска",
  qualification:"Высшая категория",
  workExperience: 14,
  birthDate:   "1985-04-20",
  created_at:  "2024-09-01T00:00:00",
  role:        { role_name: "methodist" },
  nextAttestationDate: "2026-11-01",
  subjects:    ["Дополнительное образование", "Методическая работа"],
  certificates: [
    { id: 1, title: "Школьный театр как ресурс воспитания", issuer: "ИРО Иркутской области", hours: 36, date: "2025-11-14" },
    { id: 2, title: "Цифровые инструменты педагога", issuer: "МКУ РОИ", hours: 72, date: "2025-04-20" },
    { id: 3, title: "ФГОС: обновлённые требования", issuer: "Рос. акад. образования", hours: 108, date: "2024-12-05" },
  ],
  achievements: [
    { id: 1, title: "Победитель конкурса «Лучший методист года»", level: "Муниципальный", year: 2025 },
    { id: 2, title: "Участник конкурса «Педагог года Иркутской области»", level: "Региональный", year: 2024 },
    { id: 3, title: "Почётная грамота Министерства просвещения РФ", level: "Федеральный", year: 2023 },
  ],
};

// ─── Вспомогательные компоненты ───────────────────────────────────────────────

function Avatar({ user, size = 80 }) {
  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #1D4ED8, #7C3AED)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: size * 0.3, fontWeight: 800, flexShrink: 0,
      fontFamily: "'PT Sans', system-ui, sans-serif",
    }}>
      {initials || "?"}
    </div>
  );
}

function Card({ children, title, icon, style: s = {} }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #F1F5F9", padding: "20px 24px", ...s }}>
      {title && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #F8FAFC" }}>
          {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
          <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid #F8FAFC" }}>
      <span style={{ fontSize: 13, color: "#94A3B8", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#0F172A", fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function Tag({ children, bg = "#EFF6FF", color = "#1D4ED8" }) {
  return (
    <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 20, background: bg, color, fontSize: 12, fontWeight: 600 }}>
      {children}
    </span>
  );
}

const LEVEL_COLORS = {
  "Муниципальный": { bg: "#EFF6FF", color: "#1D4ED8" },
  "Региональный":  { bg: "#F5F3FF", color: "#7C3AED" },
  "Федеральный":   { bg: "#ECFDF5", color: "#059669" },
};

const ROLE_LABELS = {
  admin:     "Администратор",
  methodist: "Методист",
  teacher:   "Педагог",
  guest:     "Гость",
};

const TABS = [
  { id: "overview",      label: "Обзор",          icon: "👤" },
  { id: "articles",      label: "Мои статьи",     icon: "📝" },
  { id: "certificates",  label: "Курсы",           icon: "🎓" },
  { id: "achievements",  label: "Достижения",      icon: "🏆" },
  { id: "settings",      label: "Настройки",       icon: "⚙️" },
];

// ─── Главный компонент ────────────────────────────────────────────────────────
export default function ProfilePage({ user = MOCK_USER, onBack, onLogout, userArticles = [] }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode,  setEditMode]  = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [form, setForm] = useState({
    username:     user.username     || "",
    phone:        user.phone        || "",
    position:     user.position     || "",
    organization: user.organization || "",
  });

  const daysLeft = user.nextAttestationDate
    ? Math.floor((new Date(user.nextAttestationDate) - new Date()) / 86400000)
    : null;

  const roleName = typeof user.role === "object"
    ? user.role?.role_name
    : user.role_id === 1 ? "admin" : user.role_id === 2 ? "methodist" : "teacher";

  const handleSave = () => {
    setSaved(true);
    setEditMode(false);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'PT Sans', system-ui, sans-serif" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .ptab {
          padding: 9px 14px; border-radius: 10px; border: none;
          background: none; cursor: pointer; font-size: 13px; font-weight: 500;
          color: #64748B; display: flex; align-items: center; gap: 7px;
          font-family: inherit; transition: background 0.15s, color 0.15s;
          white-space: nowrap; width: 100%; text-align: left;
        }
        .ptab:hover  { background: #F1F5F9; color: #334155; }
        .ptab.active { background: #EFF6FF; color: #1D4ED8; font-weight: 700; }
        .pinput {
          width: 100%; padding: 10px 13px; font-size: 14px;
          border: 1.5px solid #E2E8F0; border-radius: 10px;
          outline: none; font-family: inherit; background: #F8FAFC;
          transition: border-color 0.2s; box-sizing: border-box;
        }
        .pinput:focus { border-color: #93C5FD; background: #fff; }
        @media (max-width: 768px) {
          .playout    { flex-direction: column !important; }
          .psidebar   { width: 100% !important; }
          .ptabs-col  { flex-direction: row !important; overflow-x: auto; gap: 4px !important; }
          .pstats     { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* ── Шапка ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #F1F5F9",
        padding: "0 24px", height: 58,
        display: "flex", alignItems: "center", gap: 12,
        boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "1px solid #E2E8F0", cursor: "pointer",
          fontSize: 13, fontWeight: 600, color: "#64748B",
          padding: "6px 14px", borderRadius: 9, fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: 5,
          transition: "all 0.15s",
        }}
          onMouseOver={e => { e.currentTarget.style.borderColor = "#93C5FD"; e.currentTarget.style.color = "#1D4ED8"; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#64748B"; }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M8 2L3 6.5 8 11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          На главную
        </button>

        <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Личный кабинет</span>

        <div style={{ flex: 1 }} />

        {/* Уведомление об успешном сохранении */}
        {saved && (
          <span style={{ fontSize: 13, fontWeight: 600, color: "#059669", background: "#ECFDF5", padding: "5px 12px", borderRadius: 8 }}>
            ✓ Сохранено
          </span>
        )}

        {onLogout && (
          <button onClick={onLogout} style={{
            background: "none", border: "1px solid #FECACA", cursor: "pointer",
            fontSize: 13, fontWeight: 600, color: "#EF4444",
            padding: "6px 14px", borderRadius: 9, fontFamily: "inherit",
            transition: "all 0.15s",
          }}
            onMouseOver={e => { e.currentTarget.style.background = "#FEF2F2"; }}
            onMouseOut={e => { e.currentTarget.style.background = "none"; }}
          >
            Выйти
          </button>
        )}
      </div>

      {/* ── Баннер профиля ─────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%)", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
          <Avatar user={user} size={88} />
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
              {user.lastName} {user.firstName} {user.middleName}
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 5 }}>
              @{form.username || user.username} · {user.email}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <Tag bg="rgba(255,255,255,0.2)" color="#fff">
                {ROLE_LABELS[roleName] || roleName}
              </Tag>
              {user.position && (
                <Tag bg="rgba(255,255,255,0.15)" color="rgba(255,255,255,0.9)">
                  {user.position}
                </Tag>
              )}
              {user.qualification && (
                <Tag bg="rgba(255,255,255,0.15)" color="rgba(255,255,255,0.9)">
                  {user.qualification}
                </Tag>
              )}
              <Tag bg="rgba(255,255,255,0.1)" color="rgba(255,255,255,0.7)">
                На сайте с {new Date(user.created_at).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
              </Tag>
            </div>
          </div>
        </div>
      </div>

      {/* ── Контент ────────────────────────────────────────────────────────── */}
      <div className="playout" style={{ maxWidth: 1100, margin: "24px auto", padding: "0 24px 40px", display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* Сайдбар */}
        <div className="psidebar" style={{ width: 220, flexShrink: 0 }}>
          <Card style={{ padding: "8px 6px" }}>
            <div className="ptabs-col" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`ptab${activeTab === tab.id ? " active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Блок аттестации */}
          {daysLeft !== null && (
            <Card style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Аттестация
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                {new Date(user.nextAttestationDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
              </div>
              <div style={{
                marginTop: 10, padding: "8px 10px", borderRadius: 9,
                background: daysLeft < 365 ? "#FFFBEB" : "#ECFDF5",
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: daysLeft < 365 ? "#D97706" : "#059669" }}>
                  {daysLeft > 0 ? `${Math.ceil(daysLeft / 30)} мес.` : "Просрочена"}
                </span>
                <span style={{ fontSize: 12, color: "#94A3B8" }}> до истечения</span>
              </div>
            </Card>
          )}
        </div>

        {/* Основная область */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── ОБЗОР ─────────────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <>
              <Card title="Данные аккаунта" icon="👤">
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                  <button
                    onClick={() => setEditMode(v => !v)}
                    style={{
                      padding: "6px 14px", borderRadius: 8,
                      border: "1.5px solid #BFDBFE", background: "#EFF6FF",
                      color: "#1D4ED8", fontSize: 13, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {editMode ? "Отмена" : "✏️ Редактировать"}
                  </button>
                </div>

                {editMode ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { label: "Имя пользователя (username)", key: "username" },
                      { label: "Телефон",                     key: "phone" },
                      { label: "Должность",                   key: "position" },
                      { label: "Организация",                 key: "organization" },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {f.label}
                        </label>
                        <input
                          className="pinput"
                          value={form[f.key]}
                          onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                        />
                      </div>
                    ))}
                    <button
                      onClick={handleSave}
                      style={{ padding: "10px", borderRadius: 10, border: "none", background: "#1D4ED8", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Сохранить изменения
                    </button>
                  </div>
                ) : (
                  <>
                    <InfoRow label="ID пользователя" value={`#${user.id}`} />
                    <InfoRow label="Email"            value={user.email} />
                    <InfoRow label="Username"         value={`@${form.username}`} />
                    <InfoRow label="Роль"             value={ROLE_LABELS[roleName] || roleName} />
                    <InfoRow label="Дата регистрации" value={new Date(user.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })} />
                    <InfoRow label="Телефон"          value={form.phone} />
                    <InfoRow label="Дата рождения"    value={user.birthDate ? new Date(user.birthDate).toLocaleDateString("ru-RU") : null} />
                    <InfoRow label="Должность"        value={form.position} />
                    <InfoRow label="Организация"      value={form.organization} />
                    <InfoRow label="Стаж работы"      value={user.workExperience ? `${user.workExperience} лет` : null} />
                    <InfoRow label="Квалификация"     value={user.qualification} />
                  </>
                )}
              </Card>

              {user.subjects?.length > 0 && (
                <Card title="Предметы и направления" icon="📚">
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {user.subjects.map(s => <Tag key={s}>{s}</Tag>)}
                  </div>
                </Card>
              )}

              {/* Статистика */}
              <div className="pstats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { label: "Курсов пройдено", value: (user.certificates || []).length, icon: "🎓", bg: "#EFF6FF", tc: "#1D4ED8" },
                  { label: "Достижений",      value: (user.achievements || []).length,  icon: "🏆", bg: "#FFFBEB", tc: "#D97706" },
                  { label: "Часов обучения",  value: (user.certificates || []).reduce((s, c) => s + (c.hours || 0), 0), icon: "⏱️", bg: "#F0FDF4", tc: "#059669" },
                ].map(st => (
                  <div key={st.label} style={{ background: st.bg, borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 28 }}>{st.icon}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: st.tc, lineHeight: 1.2, marginTop: 6 }}>{st.value}</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 5 }}>{st.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── МОИ СТАТЬИ ───────────────────────────────────────────────── */}
          {activeTab === "articles" && (
            <Card title="Мои статьи" icon="📝">
              {userArticles.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
                  <p style={{ color: "#94A3B8", fontSize: 14, margin: 0 }}>Статей пока нет</p>
                </div>
              ) : userArticles.map(a => {
                const statusMap = {
                  published: { bg: "#ECFDF5", color: "#059669", label: "Опубликована" },
                  draft:     { bg: "#FFFBEB", color: "#D97706", label: "Черновик" },
                  archive:   { bg: "#F1F5F9", color: "#64748B", label: "Архив" },
                };
                const st = statusMap[a.status?.name || a.status] || statusMap.archive;
                return (
                  <div key={a.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 0", borderBottom: "1px solid #F8FAFC" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: "#94A3B8" }}>/{a.slug} · обновлено {(a.updated_at || a.updatedAt || "").slice(0, 10)}</div>
                    </div>
                    <Tag bg={st.bg} color={st.color}>{st.label}</Tag>
                  </div>
                );
              })}
            </Card>
          )}

          {/* ── КУРСЫ ────────────────────────────────────────────────────── */}
          {activeTab === "certificates" && (
            <Card title="Курсы повышения квалификации" icon="🎓">
              {(user.certificates || []).length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🎓</div>
                  <p style={{ color: "#94A3B8", fontSize: 14, margin: 0 }}>Курсов пока нет</p>
                </div>
              ) : (user.certificates || []).map(cert => (
                <div key={cert.id} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 0", borderBottom: "1px solid #F8FAFC" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🎓</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{cert.title}</div>
                    <div style={{ fontSize: 13, color: "#64748B", marginBottom: 8 }}>{cert.issuer}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Tag>{cert.hours} часов</Tag>
                      <Tag bg="#F1F5F9" color="#475569">
                        {new Date(cert.date).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
                      </Tag>
                    </div>
                  </div>
                  <button style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#1D4ED8", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0 }}>
                    📄 Скачать
                  </button>
                </div>
              ))}
            </Card>
          )}

          {/* ── ДОСТИЖЕНИЯ ───────────────────────────────────────────────── */}
          {activeTab === "achievements" && (
            <Card title="Конкурсы и достижения" icon="🏆">
              {(user.achievements || []).length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🏆</div>
                  <p style={{ color: "#94A3B8", fontSize: 14, margin: 0 }}>Достижений пока нет</p>
                </div>
              ) : (user.achievements || []).map(ach => {
                const lc = LEVEL_COLORS[ach.level] || { bg: "#F1F5F9", color: "#475569" };
                return (
                  <div key={ach.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 0", borderBottom: "1px solid #F8FAFC" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🏆</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>{ach.title}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Tag bg={lc.bg} color={lc.color}>{ach.level}</Tag>
                        <Tag bg="#F1F5F9" color="#475569">{ach.year}</Tag>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}

          {/* ── НАСТРОЙКИ ────────────────────────────────────────────────── */}
          {activeTab === "settings" && (
            <Card title="Безопасность" icon="🔒">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {["Текущий пароль", "Новый пароль", "Повторите новый пароль"].map(l => (
                  <div key={l}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {l}
                    </label>
                    <input type="password" className="pinput" placeholder="••••••••" />
                  </div>
                ))}
                <button style={{ padding: "10px", borderRadius: 10, border: "none", background: "#1D4ED8", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                  Сохранить пароль
                </button>
                <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
                  Поле <code>password_hash</code> в таблице <code>users</code> обновляется через хэширование bcrypt на сервере.
                </p>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
