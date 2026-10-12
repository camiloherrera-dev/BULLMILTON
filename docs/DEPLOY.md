# Despliegue: GitHub → Vercel (FASE 13)

La app es un frontend estático (Vite) que habla directo con Supabase. `vercel.json` ya trae:

- redirección de SPA (cualquier ruta sirve `index.html`, menos `/assets/`);
- cabeceras de seguridad: CSP que solo permite conectar con `*.supabase.co`, `X-Frame-Options: DENY`,
  `nosniff`, `Referrer-Policy` y `Permissions-Policy`;
- caché larga para `/assets/*` (archivos con hash) y `no-cache` para `index.html`.

## 1. Subir el repo a GitHub

Crea un repositorio **privado** vacío en <https://github.com/new> (sin README) y luego:

```bash
git remote add origin https://github.com/<tu-usuario>/bullmilton.git
git push -u origin main
```

Con el repo en GitHub, el CI (`.github/workflows/ci.yml`) corre lint, tipos, build, detector de
secretos y los tests pgTAP contra un Supabase real en cada push.

## 2. Crear el proyecto en Vercel

1. <https://vercel.com/new> → _Import Git Repository_ → elige `bullmilton`.
2. Framework: Vite (lo detecta solo). Build: `npm run build`. Output: `dist`.
3. _Environment Variables_ (para **Production** y **Preview**):
   - `VITE_SUPABASE_URL` = `https://<REF>.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = la `sb_publishable_…`
   - **Nunca** la secret key: el build falla si detecta una (`check:secrets`).
4. _Deploy_. Cada push a `main` despliega producción; cada rama o PR, un preview.

## 3. Ajustar Supabase a la URL de producción

En el dashboard de Supabase → _Authentication → URL Configuration_:

- **Site URL**: `https://<tu-app>.vercel.app`
- **Redirect URLs**: añade `https://<tu-app>.vercel.app/**` y, para previews,
  `https://*-<tu-usuario>.vercel.app/**`. Deja `http://localhost:5173/**` para desarrollo.

## 4. Comprobar

- Abre la URL, entra con tu cuenta y registra un gasto de prueba (luego anúlalo).
- Recarga en una ruta interna (p. ej. `/movimientos`): debe cargar, no dar 404.
- En el navegador, _DevTools → Network_: las peticiones van solo a tu proyecto de Supabase.
- <https://securityheaders.com> con tu URL: CSP y demás cabeceras presentes.

## Dominio propio (opcional)

_Vercel → Project → Settings → Domains_. Si lo añades, actualiza Site URL y Redirect URLs en
Supabase con el nuevo dominio.
