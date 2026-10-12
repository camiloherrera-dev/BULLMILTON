# BULLMILTON — reglas permanentes del proyecto

## Fuente de verdad

- La especificación es `SHAREDFIN_ESPECIFICACION_COMPLETA_CLAUDE_COLORES.md`. El documento llama
  al producto "SharedFin"; el nombre real es **BULLMILTON** (código, UI, package.json, docs).
  Todo lo demás del documento sigue vigente.
- Respeta las reglas de la sección 70: incremental, verificar antes de cambiar arquitectura,
  seguridad primero, no sobreingeniería, lógica financiera separada, database-first para reglas
  críticas, tests para dinero, cambios explicables.
- Si la spec choca con la documentación actual de Supabase / Vite / Tailwind / Vercel, señala el
  conflicto y propón la solución actual más sencilla (Regla 2). No cambies la arquitectura en
  silencio.

## Forma de trabajar

- **Una fase a la vez** (sección 49+). Al terminar cada fase: dar comandos para probarla,
  detenerse y esperar validación explícita antes de empezar la siguiente.
- Para cada tarea indicar: qué se hará, qué archivos cambian, por qué, cómo probarlo y el
  resultado esperado.
- Commits pequeños con prefijos `feat:` / `fix:` / `test:` / `ui:` / `chore:` (sección 48).

## Seguridad (P0)

- RLS habilitado en **todas** las tablas expuestas. Acceso siempre derivado de
  `auth.uid()` → `household_members` → `household_id`.
- Ninguna service key / secret key / password de Postgres en el frontend ni en variables
  `VITE_*`. En el cliente solo va la publishable (anon) key.
- Tests de RLS con pgTAP (`supabase test db`). Si RLS falla, no se construyen más features hasta
  arreglarlo.
- Operaciones con varios cambios relacionados (gasto + splits) van en una función/RPC atómica.
- Nunca mostrar errores técnicos al usuario; mensajes humanos en la UI, detalle en logs.

## Dinero y fechas

- Dinero siempre en enteros (`bigint` en Postgres, `number` entero en TS; COP sin decimales).
  **Nunca float.** Siempre guardar `currency`.
- El motor de balance (`src/lib/calculations/`) es TypeScript puro, sin React, determinista y con
  tests unitarios. Toda modificación al motor incluye o actualiza tests. Nada de cálculos
  financieros dentro de JSX.
- Zona horaria **America/Bogota** explícita para fechas financieras (no depender del navegador).
  Las fechas financieras se guardan como `date`, no como timestamp.

## Diseño (la especificación manda sobre las skills)

- La paleta de la sección 40.1 es obligatoria. Vive como tokens en **un solo lugar**:
  `src/styles/tokens.css` (variables CSS + `@theme` de Tailwind v4). **Nunca HEX sueltos** en
  componentes; usar las utilidades generadas (`bg-surface`, `text-primary`, ...).
- Si Impeccable o design-taste-frontend sugieren otra paleta, fuente o estilo que contradiga la
  spec, gana la spec: señalar el conflicto al usuario en vez de cambiarla.
- Mobile-first, botones grandes (objetivo táctil ≥ 44px), acciones rápidas
  (+ Gasto / + Ingreso / + Transferencia) siempre a mano. Contraste accesible (WCAG AA mínimo).
  El color nunca es el único indicador de estado: acompañar con texto, signo o icono.
- Uso de skills:
  - Antes de la primera pantalla real (FASE 2): `/impeccable init` → `PRODUCT.md`; luego crear
    `DESIGN.md` con los tokens de la sección 40.1.
  - Al construir UI: aplicar design-taste-frontend (diales 3 / 3 / 6) y la guía de Impeccable.
  - Al cerrar cada fase con UI (2, 3, 4, 8, 10, 12): `/impeccable audit` y `/impeccable critique`
    sobre las pantallas nuevas; corregir lo relevante con `/impeccable polish` o
    `/impeccable adapt`, y resumir hallazgos.
  - FASE 12: revisión completa con audit + critique + harden.
- No añadir dependencias de UI ni de animación sin justificarlo (sección 34). Stack permitido
  de base: react, react-dom, react-router, tailwindcss, @supabase/supabase-js, recharts, zod,
  react-hook-form.

## Comandos

- `npm run dev` — servidor de desarrollo
- `npm run build` — typecheck + build de producción
- `npm run lint` — ESLint
- `npm run format` / `npm run format:check` — Prettier
