# Проект MKY - EduIrk (Frontend)

Фронтенд-часть информационной системы для образовательных организаций г. Иркутска. Построен на React и Vite.

## Предварительные требования

Перед запуском убедитесь, что у вас установлены:
- **Node.js** (версия 18 или выше)
- **Docker Desktop** (для БД)
- **Python 3.10+** (для бэкенда)

## Пошаговая инструкция запуска

Для полноценной работы системы необходимо запустить все компоненты в следующем порядке:

### 1. Фронтенд
```bash
cd frontend
npm run dev
```

### 2. База данных
```bash
cd backend
docker compose up -d db
```

### 3. Бэкенд
```bash
cd backend
set DATABASE_URL=postgresql://postgres:admin@localhost:5433/eduirk_db
set ENABLE_RAG=false
venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

## Как запускать всё одновременно
Рекомендуется открыть три отдельных окна терминала для каждого компонента.

## Как остановить
- Для фронтенда и бэкенда: нажмите `Ctrl+C` в терминале.
- Для базы данных:
```bash
cd backend
docker compose down
```

## Структура проекта
- `src/` — Исходный код приложения
- `src/components/` — Переиспользуемые UI-компоненты
- `src/features/` — Основные функциональные модули (включая фильтры статей)
- `src/pages/` — Страницы приложения

## Как внести изменения и запушить
1. Переключитесь на ветку:
   ```bash
   git checkout rudak-frontend
   ```
2. Внесите изменения.
3. Закоммитьте:
   ```bash
   git add .
   git commit -m "feat: articles filter redesign + UI improvements (2026-05-01)"
   ```
4. Запушьте:
   ```bash
   git push origin HEAD
   ```

---
© 2026 MKY Team
