# Control Financiero

PWA personal de Christian para apuntar gastos al vuelo desde el iPhone, separar personal vs negocio (deducible), y entender dónde se va el dinero. Backend en Supabase. Recordatorio push diario a las 22:00 para no olvidar apuntar.

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind v4 + TypeScript
- Supabase (Postgres + Auth magic link + RLS)
- Web Push (VAPID) + Vercel Cron para el recordatorio diario
- Deploy en Vercel

## Setup (una sola vez)

### 1. Crear proyecto Supabase

1. Ve a https://supabase.com → New Project.
2. Nombre: `control-financiero`. Región: Europe West (Frankfurt).
3. Cuando esté listo, copia:
   - `Project URL` → será `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` (Settings → API) → será `SUPABASE_SERVICE_ROLE_KEY` (sólo backend, nunca en cliente)

### 2. Aplicar el schema

En Supabase → SQL Editor → New Query, pega el contenido de `supabase/schema.sql` y ejecuta.

### 3. Activar magic link auth

En Supabase → Authentication → Providers → Email: activa "Enable email provider". En Authentication → URL Configuration:
- Site URL: la URL de Vercel (después del deploy, ej. `https://control-financiero.vercel.app`).
- Redirect URLs: añade `https://control-financiero.vercel.app/auth/callback` y `http://localhost:3000/auth/callback`.

### 4. Generar VAPID keys (para push)

```bash
cd ~/proyectos/control-financiero
npm install
npx web-push generate-vapid-keys
```

Copia las dos claves resultantes.

### 5. Variables de entorno

Copia `.env.example` a `.env.local` y rellena:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=B...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:chrislogz0@gmail.com
CRON_SECRET=algo_random_largo
```

`CRON_SECRET` puede ser cualquier string random largo, p.ej. `openssl rand -hex 32`.

### 6. Dev local

```bash
npm run dev
```

Abre http://localhost:3000, login con magic link, prueba apuntar un gasto.

### 7. Deploy en Vercel

1. `git init && git add . && git commit -m "init"`
2. Crea repo en GitHub y `git push`.
3. Vercel → Import Project → conecta el repo.
4. En Vercel → Project → Settings → Environment Variables: pega las mismas que en `.env.local` (todas, las `NEXT_PUBLIC_*` y las privadas).
5. Deploy.

### 8. Configurar cron (recordatorio)

`vercel.json` ya define el cron diario:

```json
{
  "crons": [{ "path": "/api/notify", "schedule": "0 20 * * *" }]
}
```

`0 20 * * *` = 20:00 UTC diario, que es **22:00 hora España en verano (CEST)** y 21:00 en invierno (CET). Vercel cron no soporta zona horaria, así que en invierno la notificación llegará a las 21:00. Si lo quieres siempre a las 22:00, cámbialo a `0 21 * * *` en invierno.

El cron solo funciona en cuentas Vercel Pro o si actualizas a Hobby con cron habilitado (los crons diarios entran en el free tier).

### 9. Instalar PWA en iPhone

1. Abre la URL de Vercel desde **Safari** (no Chrome, iOS sólo permite PWA desde Safari).
2. Login con magic link.
3. Botón compartir (cuadradito con flecha) → **Añadir a pantalla de inicio**.
4. Abre la app desde el icono (no desde Safari) → ve a Ajustes → **Activar recordatorio diario**.
5. iOS pedirá permiso de notificaciones, acepta.

> Importante: las notificaciones push web en iOS sólo funcionan con la app **instalada en pantalla de inicio**, no desde Safari directamente. Requiere iOS 16.4+.

## Estructura

```
app/
  page.tsx              # captura rápida (gasto / ingreso)
  login/                # magic link
  auth/callback/        # OAuth callback
  mes/                  # totales del mes en curso
  historial/            # últimas 100 transacciones
  ajustes/              # logout + toggle push
  api/
    push-subscribe/     # registrar / borrar suscripción push
    notify/             # endpoint del cron diario
components/
  CaptureForm.tsx       # form principal
  TabBar.tsx            # nav inferior
  PushToggle.tsx        # activar/desactivar recordatorio
lib/
  supabase.ts           # cliente browser + server
  categories.ts         # taxonomía + auto-tag rules
  types.ts              # tipos compartidos
supabase/
  schema.sql            # apply once en SQL editor
public/
  manifest.json
  sw.js                 # service worker (push listener)
  icon-*.png
```

## Cómo se usa día a día

1. Abres la app desde el icono del iPhone.
2. Tap en importe → numpad nativo.
3. Escribes el comercio (autocompletado con frecuentes y recientes).
4. Si el comercio es conocido (Mercadona, Glovo, Thomann...), la categoría y scope se auto-rellenan. Si no, eliges manualmente.
5. Si es **negocio**, eliges qué negocio (Savage / Fierce / ELEVN / Mochito / Compartido).
6. Tap "Apuntar gasto". Listo.

A las 22:00 te llega la notificación "Hora de apuntar los gastos". Tap → abre la app directamente en el form.

A final de mes, el agente Mac `control-financiero` (Fase 3, próxima sesión) lee Supabase y genera el PDF para la gestoría.

## Fases pendientes

- **Fase 3**: Agente Claude Code en Mac (`~/.claude/agents/control-financiero.md`) que lee Supabase y genera PDF mensual con el mismo sistema visual que el contrato y la hoja de ruta. Útil para análisis ad-hoc y cierre mensual.
- **Fase 4**: Editar/borrar transacciones desde la app, recurring reconciliation, gestión de quick buttons configurables.
