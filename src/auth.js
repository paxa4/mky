export const AUTH_STORAGE_KEY = "mky_current_user";
export const AUTH_TOKEN_STORAGE_KEYS = ["access_token", "mky_access_token"];

export const ROLE_LABELS = {
  user: "Пользователь",
  methodist: "Методист",
  operator: "Психолог",
  domu_editor: "Редактор Дома учителя",
  admin: "Администратор",
};

export const TEST_USERS = {
  user: {
    id: 101,
    firstName: "Алексей",
    lastName: "Смирнов",
    middleName: "Петрович",
    username: "smirnov_ap",
    email: "user@mky.test",
    password: "user123",
    phone: "+7 (3952) 20-10-11",
    position: "Пользователь платформы",
    organization: "Образовательное сообщество МКУ ИМЦРО",
    qualification: "Участник",
    workExperience: 3,
    birthDate: "1992-03-15",
    created_at: "2025-02-10T00:00:00",
    role: "user",
    subjects: ["Образовательные события", "Повышение квалификации"],
    certificates: [
      { id: 1, title: "Цифровая грамотность педагога", issuer: "МКУ ИМЦРО", hours: 18, date: "2025-03-18" },
    ],
    achievements: [
      { id: 1, title: "Участник муниципального семинара", level: "Муниципальный", year: 2025 },
    ],
  },
  methodist: {
    id: 1,
    firstName: "Ирина",
    lastName: "Абрамова",
    middleName: "Владимировна",
    username: "abramova_iv",
    email: "methodist@mky.test",
    password: "methodist123",
    phone: "+7 (3952) 20-19-85",
    position: "Методист",
    organization: "МКУ развития образования города Иркутска",
    qualification: "Высшая категория",
    workExperience: 14,
    birthDate: "1985-04-20",
    created_at: "2024-09-01T00:00:00",
    role: "methodist",
    nextAttestationDate: "2026-11-01",
    subjects: ["Дополнительное образование", "Методическая работа"],
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
  },
  admin: {
    id: 900,
    firstName: "Марина",
    lastName: "Кузнецова",
    middleName: "Андреевна",
    username: "admin_mky",
    email: "admin@mky.test",
    password: "admin123",
    phone: "+7 (3952) 20-00-01",
    position: "Администратор платформы",
    organization: "МКУ ИМЦРО",
    qualification: "Системный администратор",
    workExperience: 9,
    birthDate: "1988-10-08",
    created_at: "2024-01-15T00:00:00",
    role: "admin",
    subjects: ["Администрирование", "Контент", "Пользователи"],
    certificates: [],
    achievements: [
      { id: 1, title: "Запуск обновлённой платформы МКУ ИМЦРО", level: "Муниципальный", year: 2026 },
    ],
  },
  operator: {
    id: 901,
    firstName: "Ольга",
    lastName: "Петрова",
    middleName: "Сергеевна",
    username: "tpmpk_operator",
    email: "operator@mky.test",
    password: "operator123",
    phone: "+7 (3952) 48-12-56",
    position: "Психолог ТПМПК",
    organization: "ТПМПК г. Иркутска",
    qualification: "Специалист",
    workExperience: 6,
    birthDate: "1989-06-02",
    created_at: "2026-01-10T00:00:00",
    role: "operator",
    subjects: ["ТПМПК"],
    certificates: [],
    achievements: [],
  },
  domu_editor: {
    id: 902,
    firstName: "Елена",
    lastName: "Соколова",
    middleName: "Павловна",
    username: "domu_editor",
    email: "domu@mky.test",
    password: "domu123",
    phone: "+7 (3952) 48-12-56",
    position: "Редактор Дома учителя",
    organization: "Дом учителя",
    qualification: "Контент-редактор",
    workExperience: 8,
    birthDate: "1987-09-12",
    created_at: "2026-04-29T00:00:00",
    role: "domu_editor",
    subjects: ["Дом учителя", "Новости", "Мероприятия"],
    certificates: [],
    achievements: [],
  },
};

export const TEST_CREDENTIALS = [
  { role: "user", label: "Пользователь", email: "user@mky.test", password: "user123" },
  { role: "methodist", label: "Методист", email: "methodist@mky.test", password: "methodist123" },
  { role: "operator", label: "Психолог", email: "operator@mky.test", password: "operator123" },
  { role: "admin", label: "Администратор", email: "admin@mky.test", password: "admin123" },
  { role: "domu_editor", label: "Редактор Дома учителя", email: "domu@mky.test", password: "domu123" },
];

function withoutPassword(user) {
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

export function authenticate(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = Object.values(TEST_USERS).find((item) => item.email.toLowerCase() === normalizedEmail);
  if (!user || user.password !== password) return null;
  return withoutPassword(user);
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role || "Пользователь";
}

export function canAccessAdmin(user) {
  const role = typeof user?.role === "object" ? user.role?.role_name : user?.role;
  return role === "methodist" || role === "admin";
}

export function canAccessTpmpkAdmin(user) {
  const role = typeof user?.role === "object" ? user.role?.role_name : user?.role;
  return role === "operator" || role === "admin";
}

export function canAccessDomuAdmin(user) {
  const role = typeof user?.role === "object" ? user.role?.role_name : user?.role;
  return role === "domu_editor" || role === "methodist" || role === "admin";
}

export function getStoredUser() {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(withoutPassword(user)));
  if (user?.access_token) {
    AUTH_TOKEN_STORAGE_KEYS.forEach((key) => window.localStorage.setItem(key, user.access_token));
  }
}

export function clearStoredUser() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  AUTH_TOKEN_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
}
