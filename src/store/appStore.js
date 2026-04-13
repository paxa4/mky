// Центральное хранилище — структура точно соответствует диаграмме БД
// В реальном проекте каждый раздел заменяется на fetch/axios к API

import { useState } from "react";
import { NEWS } from "../features/news/newsData.js";

// ─── Справочники (в БД — отдельные таблицы) ──────────────────────────────────

export const USER_ROLES = [
  { id: 1, role_name: "admin"     },
  { id: 2, role_name: "methodist" },
  { id: 3, role_name: "teacher"   },
  { id: 4, role_name: "guest"     },
];

export const ARTICLE_STATUSES = [
  { id: 1, name: "published" },
  { id: 2, name: "draft"     },
  { id: 3, name: "archive"   },
];

export const INITIAL_CATEGORIES = [
  { id: 1, name: "Мероприятия", slug: "meropriyatiya" },
  { id: 2, name: "Курсы",       slug: "kursy"          },
  { id: 3, name: "Достижения",  slug: "dostizheniya"   },
  { id: 4, name: "Новости",     slug: "novosti"        },
  { id: 5, name: "Проекты",     slug: "proekty"        },
  { id: 6, name: "Семинары",    slug: "seminary"       },
];

export const INITIAL_TAGS = [
  { id: 1, name: "педагоги",   slug: "pedagogi"    },
  { id: 2, name: "олимпиада",  slug: "olimpiada"   },
  { id: 3, name: "аттестация", slug: "attestaciya" },
  { id: 4, name: "конкурс",    slug: "konkurs"     },
  { id: 5, name: "ФГОС",       slug: "fgos"        },
];

// ─── Мок пользователя — строго по таблице users + user_role ──────────────────
export const MOCK_USER = {
  // users (точные поля из БД)
  id:           123,
  email:        "ivanova@eduirk.ru",
  username:     "e.ivanova",
  role_id:      3,
  created_at:   "2023-09-01T09:00:00Z",

  // user_role (joined)
  role: { id: 3, role_name: "teacher" },

  // user_profile (расширение — в реальном проекте отдельная таблица)
  firstName:    "Елена",
  lastName:     "Иванова",
  middleName:   "Сергеевна",
  phone:        "+7 (3952) 55-44-33",
  birthDate:    "1985-03-15",
  position:     "Учитель математики",
  organization: "МБОУ СОШ №30 г. Иркутска",
  workExperience:      12,
  qualification:       "Первая категория",
  attestationDate:     "2022-11-20",
  nextAttestationDate: "2027-11-20",
  subjects:     ["Математика", "Алгебра", "Геометрия"],

  certificates: [
    { id: 1, title: "Цифровые технологии в образовании", date: "2024-04-10", hours: 72,  issuer: "МКУ развития образования" },
    { id: 2, title: "ФГОС-3.0: практика применения",     date: "2023-10-05", hours: 36,  issuer: "МКУ развития образования" },
    { id: 3, title: "Работа с детьми с ОВЗ",             date: "2022-05-20", hours: 108, issuer: "ИППКРО" },
  ],

  achievements: [
    { id: 1, title: "Победитель конкурса «Урок в формате ФГОС-3.0»", year: 2024, level: "Муниципальный" },
    { id: 2, title: "Участник конкурса «Молодой педагог»",           year: 2023, level: "Региональный"  },
  ],

  notifications: [
    { id: 1, text: "Ваша аттестация истекает через 2 года",         date: "2025-11-10", read: false, type: "warning" },
    { id: 2, text: "Доступна запись на курс «ИИ в образовании»",    date: "2025-11-08", read: false, type: "info"    },
    { id: 3, text: "Сертификат о прохождении курса готов к выдаче", date: "2025-10-30", read: true,  type: "success"  },
  ],
};

// ─── Преобразование newsData → article (поля таблицы article из БД) ──────────
const CATEGORY_MAP   = { "Мероприятия": 1, "Курсы": 2, "Достижения": 3, "Новости": 4, "Проекты": 5, "Семинары": 6 };
const CATEGORY_STYLE = {
  1: { color: "#fff",    bg: "rgba(255,255,255,0.18)" },
  2: { color: "#7C3AED", bg: "#F5F3FF" },
  3: { color: "#059669", bg: "#ECFDF5" },
  4: { color: "#D97706", bg: "#FFFBEB" },
  5: { color: "#2563EB", bg: "#EFF6FF" },
  6: { color: "#0891B2", bg: "#ECFEFF" },
};

function newsToArticle(news) {
  const catId = CATEGORY_MAP[news.category] || 4;
  const style = CATEGORY_STYLE[catId] || {};
  return {
    // Точные поля таблицы article
    id:         news.id,
    title:      news.title,
    slug:       `article-${news.id}`,
    content:    news.excerpt,
    status_id:  1,
    author_id:  1,
    created_at: news.date,
    updated_at: news.date,

    // Joined из article_status
    status: { id: 1, name: "published" },
    // Joined из users
    author: { id: 1, email: "admin@eduirk.ru", username: "admin" },

    // Joined из article_category → category
    category_ids: [catId],
    // Joined из article_tag → tag
    tag_ids: [],

    // Визуальные поля для карточки (не в БД, вычисляются на фронте)
    excerpt:       news.excerpt,
    image:         news.image,
    categoryColor: style.color,
    categoryBg:    style.bg,
  };
}

// ─── Главный хук ──────────────────────────────────────────────────────────────
export function useAppStore() {
  const [currentUser, setCurrentUser] = useState(null);
  const [categories,  setCategories]  = useState(INITIAL_CATEGORIES);
  const [tags,        setTags]        = useState(INITIAL_TAGS);
  const [articles,    setArticles]    = useState(NEWS.map(newsToArticle));

  // Auth
  const login  = (creds) => setCurrentUser({ ...MOCK_USER, email: creds.email });
  const logout = ()      => setCurrentUser(null);

  // Articles — CRUD (соответствует INSERT/UPDATE/DELETE в таблице article)
  const saveArticle = (article) => {
    const now = new Date().toISOString();
    setArticles(prev => {
      const exists = prev.find(a => a.id === article.id);
      if (exists) return prev.map(a => a.id === article.id ? { ...article, updated_at: now } : a);
      return [{ ...article, id: Date.now(), created_at: now, updated_at: now }, ...prev];
    });
  };
  const deleteArticle = (id) => setArticles(prev => prev.filter(a => a.id !== id));
  const changeStatus  = (id, status_id) => {
    const status = ARTICLE_STATUSES.find(s => s.id === status_id || s.name === status_id);
    setArticles(prev => prev.map(a =>
      a.id === id ? { ...a, status_id: status?.id ?? status_id, status } : a
    ));
  };

  // Categories — CRUD (таблица category)
  const addCategory    = (name) => { const id = Date.now(); setCategories(p => [...p, { id, name, slug: name.toLowerCase().replace(/\s+/g, "-") }]); return id; };
  const renameCategory = (id, name) => setCategories(p => p.map(c => c.id === id ? { ...c, name } : c));
  const deleteCategory = (id)       => setCategories(p => p.filter(c => c.id !== id));

  // Tags — CRUD (таблица tag)
  const addTag    = (name) => { const ex = tags.find(t => t.name.toLowerCase() === name.toLowerCase()); if (ex) return ex.id; const id = Date.now(); setTags(p => [...p, { id, name, slug: name.toLowerCase() }]); return id; };
  const renameTag = (id, name) => setTags(p => p.map(t => t.id === id ? { ...t, name } : t));
  const deleteTag = (id)       => setTags(p => p.filter(t => t.id !== id));

  // Только published для ленты (WHERE status_id = 1)
  const publishedArticles = articles.filter(a => a.status_id === 1 || a.status?.name === "published");

  return {
    currentUser, login, logout,
    articles, publishedArticles, saveArticle, deleteArticle, changeStatus,
    categories, tags,
    addCategory, renameCategory, deleteCategory,
    addTag, renameTag, deleteTag,
  };
}