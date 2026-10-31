# Gestión App

Aplicación Ionic + Angular (standalone, signals, zoneless) para la actividad individual de *Desarrollo de Interfaces (0488)*.

- **Demo en producción:** _pega aquí la URL de Vercel_
- **Credenciales de prueba:** se entregan en el PDF de la actividad (no se publican en el repositorio).

## Funcionalidades

| Fase | Implementación |
|------|----------------|
| 1 | Menú lateral (`ion-split-pane`), rutas con *lazy loading*, guards `authGuard`/`roleGuard`/`guestGuard` (roles Administrador y Usuario Estándar), formularios reactivos con validador asíncrono de correo duplicado |
| 2 | Componentes reutilizables `app-data-table` (inputs `caption`, `columns`, `rows`, `pageSize`, `selectable`; outputs `rowSelected`, `filteredChange`) y `app-stat-widget` |
| 3 | Consumo dual: API REST «SQL» (`/api/*`, simulada con un interceptor HTTP) y flujo «NoSQL» en tiempo real (`RealtimeService`). Panel de administración con Chart.js y exportación a PDF (jsPDF) y CSV |
| 4 | Mobile-First, tablas que se apilan en móvil, WCAG 2.1 AA / WAI-ARIA (enlace de salto, `aria-sort`, `role="alert"`, regiones con nombre, foco visible), navegación por teclado |
| 5 | Git flow, Compodoc, CI con GitHub Actions y despliegue en Vercel |

> Todos los datos son sintéticos. Las contraseñas del backend simulado se almacenan únicamente como hash SHA-256.

## Backend: Supabase

- **SQL / REST:** tablas `productos` y `profiles` consumidas con PostgREST (`@supabase/supabase-js`), con Row Level Security.
- **Tiempo real (NoSQL-like):** tabla `actividad` con Supabase Realtime (`postgres_changes`).
- **Autenticación:** Supabase Auth; el rol (`admin`/`user`) se lee de `profiles`.
- **Configuración:** ejecuta `supabase/schema.sql` en el SQL Editor, copia `.env.example` a `.env.local` con la URL y la clave *anon* (pública, protegida por RLS). En Vercel/GitHub define `SUPABASE_URL` y `SUPABASE_ANON_KEY`. Sin ellas la app usa un backend simulado.

## Puesta en marcha

```bash
npm install
npm start            # http://localhost:4200
npm run build        # genera /www
npm run test:unit    # Vitest
npm run test:e2e     # Playwright (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD opcionales)
npm run eslint
npm run docs         # Compodoc -> /documentation
```

## Git flow

`main` (producción) ← `develop` (integración) ← `feature/*`. Las ramas de funcionalidad se fusionan en `develop` y, tras pasar el CI, `develop` se fusiona en `main`, lo que dispara el despliegue.

## Despliegue (Vercel)

1. Importar el repositorio en Vercel (`vercel.json` ya define build y salida `www`).
2. Para el despliegue desde Actions, crear los secretos `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

## Manual de usuario

Disponible dentro de la app en **Ayuda** (`/ayuda`) y resumido aquí:

- **Acceso:** inicia sesión con correo y contraseña. Administrador: productos, usuarios y panel. Usuario Estándar: productos y ayuda. La sesión caduca a la hora.
- **Productos:** buscar, ordenar por cabecera, paginar, seleccionar fila para ver detalle y exportar CSV/PDF.
- **Usuarios (admin):** alta con comprobación en vivo de correo duplicado.
- **Panel (admin):** KPIs, gráficas (stock por categoría, actividad en tiempo real), filtro por categoría y exportación.
- **Teclado:** `Tab`/`Mayús+Tab` para moverse, `Intro`/`Espacio` para activar; el primer foco es «Saltar al contenido principal».
