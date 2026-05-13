# Frontend MKY / EduIrk

React/Vite frontend проекта MKY / EduIrk: публичные страницы, административные интерфейсы, редактор статей, генератор грамот и demo-чат.

## Docker
Запустите Docker
Из корня frontend-репозитория:

```bash
docker build --build-arg VITE_API_URL=http://localhost:8000 -t mky-frontend .
docker run --rm -p 5173:80 mky-frontend
```

После запуска frontend доступен на http://localhost:5173.

## Локальный Запуск

```bash
npm install
npm run dev
```

Frontend будет доступен на http://localhost:5173.

По умолчанию API-адрес: http://localhost:8000. Для другого адреса задайте:

```bash
VITE_API_URL=http://localhost:8000 npm run dev
```

## Проверки

```bash
npm run build
npx eslint src
node scripts/auth.test.mjs
```

Demo-чат остаётся только frontend UI: ответы статические, сетевые запросы к backend assistant/RAG API не выполняются.
