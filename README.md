# Frontend MKY / EduIrk

React + Vite frontend for the municipal education portal.

## Features

- Public pages, news, events, TPMPK, Dom Uchitelya, methodical sections, NОКО, contests, archive, and profile.
- Role-aware admin navigation for articles, certificates, templates, Dom Uchitelya, and TPMPK.
- Accessibility mode with larger fonts, contrast schemes, spacing, underlined links, and stronger focus states.
- Lightweight demo chatbot UI.

## Demo Chatbot

The chatbot is frontend-only in this branch. It opens as a floating widget, keeps local message history while the page is open, shows quick prompts, and returns static navigation hints.

It does not call `/assistant`, `/api/assistant`, `/rag`, `/api/rag`, `/search/rag`, Chroma, vector, or GigaChat endpoints. Backend RAG/assistant is not used in this protected project version.

## Local Run

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Set `VITE_API_URL` only if backend runs on a non-default address:

```bash
VITE_API_URL=http://localhost:8000
```

## Build And Checks

```bash
npm run build
npx eslint src
node scripts/auth.test.mjs
```

There is no separate type-check script in the current `package.json`.
