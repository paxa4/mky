// Хранилище данных администратора.
// useAdminStore — локальный хук (используется ТОЛЬКО внутри AdminPage).
// Глобальное состояние статей живёт в App.jsx и передаётся пропсами.

import { useState, useCallback } from "react";

export const INITIAL_CATEGORIES = [
  { id: 1, name: "Мероприятия" },
  { id: 2, name: "Курсы"       },
  { id: 3, name: "Достижения"  },
  { id: 4, name: "Новости"     },
  { id: 5, name: "Проекты"     },
  { id: 6, name: "Семинары"    },
];

export const INITIAL_TAGS = [
  { id: 1, name: "педагоги"   },
  { id: 2, name: "олимпиада"  },
  { id: 3, name: "аттестация" },
  { id: 4, name: "конкурс"    },
  { id: 5, name: "ФГОС"       },
];

// Начальные статьи — одинаковы и в adminStore, и в App.jsx через INITIAL_ARTICLES
export const INITIAL_ARTICLES = [
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
      { id: "b1", type: "hero", data: { title: "Курсы ПК «Школьный театр как ресурс воспитания»", intro: "Педагогические работники города прошли обучение под руководством ведущего режиссёра областного центра." } },
    ],
  },
];

// ── Slug ──────────────────────────────────────────────────────────────────────
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

export function genId() {
  return "b" + Math.random().toString(36).slice(2, 9);
}

// ── Хук для категорий и тегов (ArticlesAdmin использует его внутри) ────────────
export function useAdminMeta() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [tags,       setTags]       = useState(INITIAL_TAGS);

  const addCategory    = useCallback((name) => { const id = Date.now(); setCategories(p => [...p, { id, name }]); return id; }, []);
  const renameCategory = useCallback((id, name) => setCategories(p => p.map(c => c.id === id ? { ...c, name } : c)), []);
  const deleteCategory = useCallback((id) => setCategories(p => p.filter(c => c.id !== id)), []);

  const addTag    = useCallback((name) => {
    let found;
    setTags(p => { found = p.find(t => t.name.toLowerCase() === name.toLowerCase()); return found ? p : [...p, { id: Date.now(), name }]; });
    return found?.id ?? Date.now();
  }, []);
  const renameTag = useCallback((id, name) => setTags(p => p.map(t => t.id === id ? { ...t, name } : t)), []);
  const deleteTag = useCallback((id) => setTags(p => p.filter(t => t.id !== id)), []);

  return { categories, tags, addCategory, renameCategory, deleteCategory, addTag, renameTag, deleteTag };
}