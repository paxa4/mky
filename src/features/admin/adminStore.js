// Центральное хранилище данных администратора
// В реальном проекте заменяется на API-запросы к бэкенду

import { useState, useCallback } from "react";

const INITIAL_CATEGORIES = [
  { id: 1, name: "Мероприятия" },
  { id: 2, name: "Курсы" },
  { id: 3, name: "Достижения" },
  { id: 4, name: "Новости" },
  { id: 5, name: "Проекты" },
  { id: 6, name: "Семинары" },
];

const INITIAL_TAGS = [
  { id: 1, name: "педагоги" },
  { id: 2, name: "олимпиада" },
  { id: 3, name: "аттестация" },
  { id: 4, name: "конкурс" },
  { id: 5, name: "ФГОС" },
];

const INITIAL_ARTICLES = [
  {
    id: 1,
    title: "Городской «Семейный университет»",
    slug: "gorodskoy-semeynyy-universitet",
    status: "published",
    categories: [1],
    tags: [1],
    author: "Администратор",
    createdAt: "2025-11-12",
    updatedAt: "2025-11-12",
    blocks: [
      { id: "b1", type: "hero",      data: { title: "Городской «Семейный университет»", intro: "Методисты МКУ Елена Абрамова и Зоя Попова выступили с подробными докладами о развитии семейного образования в Иркутске." } },
      { id: "b2", type: "paragraph", data: { text: "В ходе встречи были рассмотрены актуальные вопросы семейного образования. Участники обсудили методические подходы и поделились опытом работы." } },
    ],
  },
  {
    id: 2,
    title: "Курсы ПК «Школьный театр как ресурс воспитания»",
    slug: "kursy-pk-shkolnyy-teatr",
    status: "draft",
    categories: [2],
    tags: [1, 5],
    author: "Администратор",
    createdAt: "2025-11-11",
    updatedAt: "2025-11-14",
    blocks: [
      { id: "b1", type: "hero",      data: { title: "Курсы ПК «Школьный театр как ресурс воспитания»", intro: "Педагогические работники города прошли обучение под руководством ведущего режиссёра областного центра." } },
    ],
  },
];

// Генерация slug из заголовка
export function generateSlug(title) {
  const map = { "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"sch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya" };
  return title.toLowerCase()
    .split("").map(c => map[c] ?? c).join("")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// Генерация уникального ID блока
export function genId() {
  return "b" + Math.random().toString(36).slice(2, 9);
}

// Хук для работы с данными
export function useAdminStore() {
  const [articles,   setArticles]   = useState(INITIAL_ARTICLES);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [tags,       setTags]       = useState(INITIAL_TAGS);

  // --- Статьи ---
  const saveArticle = useCallback((article) => {
    setArticles(prev => {
      const exists = prev.find(a => a.id === article.id);
      const now = new Date().toISOString().slice(0, 10);
      if (exists) {
        return prev.map(a => a.id === article.id ? { ...article, updatedAt: now } : a);
      }
      return [...prev, { ...article, id: Date.now(), createdAt: now, updatedAt: now, author: "Администратор" }];
    });
  }, []);

  const deleteArticle = useCallback((id) => {
    setArticles(prev => prev.filter(a => a.id !== id));
  }, []);

  const changeArticleStatus = useCallback((id, status) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }, []);

  // --- Категории ---
  const addCategory = useCallback((name) => {
    const id = Date.now();
    setCategories(prev => [...prev, { id, name }]);
    return id;
  }, []);

  const renameCategory = useCallback((id, name) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  }, []);

  const deleteCategory = useCallback((id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  // --- Теги ---
  const addTag = useCallback((name) => {
    const existing = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;
    const id = Date.now();
    setTags(prev => [...prev, { id, name }]);
    return id;
  }, [tags]);

  const renameTag = useCallback((id, name) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, name } : t));
  }, []);

  const deleteTag = useCallback((id) => {
    setTags(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    articles, categories, tags,
    saveArticle, deleteArticle, changeArticleStatus,
    addCategory, renameCategory, deleteCategory,
    addTag, renameTag, deleteTag,
  };
}
