# BULLMILTON

Libreta financiera compartida para dos personas: registra gastos, ingresos y transferencias y
calcula automáticamente quién le debe cuánto a quién.

Especificación: [`SHAREDFIN_ESPECIFICACION_COMPLETA_CLAUDE_COLORES.md`](./SHAREDFIN_ESPECIFICACION_COMPLETA_CLAUDE_COLORES.md)
(el documento usa el nombre provisional "SharedFin").

## Stack

React 19 · Vite 8 · TypeScript · Tailwind CSS v4 · Supabase (Postgres + Auth + RLS) · Vercel

## Desarrollo local

Requiere Node.js ≥ 22.12.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck + build de producción
npm run lint         # ESLint
npm run format:check # Prettier
```

## Supabase

- Puesta en marcha (nube sin Docker, o local con Docker): [`docs/SUPABASE.md`](./docs/SUPABASE.md)
- Modelo de datos, RLS, convención de saldo y claves de error: [`docs/DATABASE.md`](./docs/DATABASE.md)

```bash
cp .env.example .env.local   # URL + publishable key (nunca la secret key)
npm run test:db              # migraciones + tests de RLS sin Docker
npm run db:push              # aplica las migraciones al proyecto enlazado
npm run check:secrets        # verifica que no hay claves privilegiadas en el frontend
```

## Estructura

```text
src/
├── components/   ui, forms, expenses, dashboard, charts
├── pages/        una carpeta por pantalla
├── hooks/
├── lib/
│   ├── supabase/      client.ts — cliente Supabase (solo publishable key)
│   ├── calculations/  motor de balance — TS puro, sin React, con tests
│   └── validation/    esquemas Zod
├── services/     acceso a datos
├── styles/       tokens.css — única fuente de los colores
├── types/  utils/  routes/
└── App.tsx
supabase/         config.toml, migrations/, seed.sql, tests/database/ (pgTAP)
scripts/          check-secrets.mjs, test-db/ (pgTAP sin Docker)
docs/             SUPABASE.md, DATABASE.md
```

## Colores

Los colores de la spec §40.1 viven solo en `src/styles/tokens.css` (`@theme` de Tailwind v4) y
se usan como utilidades: `bg-canvas`, `bg-surface`, `bg-surface-2`, `text-fg`, `text-fg-muted`,
`bg-primary`, `text-on-primary`, `bg-primary-soft`, `text-positive`, `bg-positive-bg`,
`text-negative`. La paleta por defecto de Tailwind está desactivada y ESLint bloquea HEX sueltos
en `src/`.
