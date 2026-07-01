# 🗂️ Mesa de Control — ¿Quién trabaja en qué archivo?

Sitio para **coordinar los archivos** del repo
[`AndrewHypervenom/capacitaciones`](https://github.com/AndrewHypervenom/capacitaciones)
y **evitar conflictos** al unir las ramas **main · isa · paola**.

Cada persona **inicia sesión con GitHub** y marca el archivo que va a tocar (con su
rama). Si dos personas marcan el mismo archivo —o el mismo archivo en ramas distintas—
el sitio muestra una **alerta roja** y explica qué hacer para que el merge no se dañe.

- **Con login de GitHub.** Nombre y avatar reales, sin escribir tu nombre a mano.
- **En tiempo real.** Lo que marca uno, los demás lo ven al instante (reactividad de Convex).
- **Datos en Convex.**

## Stack

- **Frontend:** React + Vite + Tailwind v4.
- **Backend / base de datos / tiempo real:** [Convex](https://convex.dev).
- **Login:** [Convex Auth](https://labs.convex.dev/auth) con proveedor **GitHub**.
- La lista de archivos del repo se trae en vivo de la API de GitHub.

```
site/
├─ index.html              ← punto de entrada de Vite
├─ src/
│  ├─ main.tsx             ← arranque + proveedores (Convex, Auth, Toasts)
│  ├─ App.tsx              ← muestra login o tablero según sesión
│  ├─ components/          ← Header, SignIn, ClaimForm, Alerts, Board, MergeGuide
│  └─ lib/                 ← config, github, ui, locks, toast
├─ convex/
│  ├─ schema.ts            ← tablas (fileLocks + tablas de Auth)
│  ├─ auth.ts              ← Convex Auth con GitHub
│  ├─ fileLocks.ts         ← list / claim / release
│  └─ users.ts             ← usuario con sesión iniciada
├─ legacy-supabase/        ← versión vieja con Supabase (solo referencia)
└─ README.md
```

---

## Puesta en marcha

### 0) Requisitos

- Node.js 18+ (tienes 24 ✅). Comprueba: `node -v`.
- Una cuenta en https://convex.dev (la del dashboard que ya tienes).

### 1) Instalar dependencias

```powershell
cd C:\code\site
npm install
```

### 2) Crear/conectar el proyecto de Convex

La **primera vez**, corre el asistente interactivo (abre el navegador para iniciar sesión):

```powershell
npx convex dev
```

Esto:
- Te pide iniciar sesión en Convex y elegir/crear un proyecto.
- Crea el archivo **`.env.local`** con `VITE_CONVEX_URL` y `CONVEX_DEPLOYMENT`.
- Genera la carpeta **`convex/_generated`** (tipos).
- Sube el `schema.ts` y las funciones.

Déjalo corriendo (vigila cambios) o ciérralo con `Ctrl+C` cuando termine de sincronizar.

### 3) Activar Convex Auth (genera las llaves)

En **otra terminal** (con el paso 2 ya hecho):

```powershell
npx @convex-dev/auth
```

Sigue el asistente. Configura en tu deployment las variables internas que necesita el
login (`JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL`). Cuando pregunte por `SITE_URL` en
desarrollo, usa:

```
http://localhost:5173
```

### 4) Crear la OAuth App en GitHub

1. Ve a GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
   (atajo: https://github.com/settings/developers).
2. Rellena:
   - **Application name:** `Mesa de Control` (lo que quieras).
   - **Homepage URL:** `http://localhost:5173`
   - **Authorization callback URL:**
     ```
     https://TU-DEPLOYMENT.convex.site/api/auth/callback/github
     ```
     ⚠️ Ojo: termina en **`.convex.site`** (no `.convex.cloud`). El nombre del
     deployment lo ves en `.env.local` (`VITE_CONVEX_URL`); reemplaza `.convex.cloud`
     por `.convex.site` y agrega `/api/auth/callback/github`.
3. **Register application** → copia el **Client ID** y genera un **Client secret**.

### 5) Darle a Convex las credenciales de GitHub

```powershell
npx convex env set AUTH_GITHUB_ID TU_CLIENT_ID
npx convex env set AUTH_GITHUB_SECRET TU_CLIENT_SECRET
```

(También puedes ponerlas en el dashboard: **Settings → Environment Variables**.)

### 6) Arrancar el sitio

```powershell
npm run dev
```

Levanta el frontend (Vite) y el backend de Convex en paralelo. Abre
**http://localhost:5173**, pulsa **“Entrar con GitHub”** y listo.

---

## Cómo se usa

1. **Inicia sesión** con GitHub.
2. Elige tu **rama** y busca el **archivo** que vas a tocar → **🔒 Marcar archivo**.
3. Mira el tablero:
   - ✅ verde = solo tú trabajas ese archivo, todo bien.
   - 🚨 rojo = alguien más lo trabaja (o en otra rama) → riesgo de conflicto.
4. Al terminar y hacer push, pulsa **Liberar** en tu tarjeta (solo puedes liberar los tuyos).

## Desplegar gratis (opcional)

```powershell
npm run deploy        # sube las funciones a Convex y compila el frontend (carpeta dist/)
```

Sube `dist/` a **Netlify**, **Vercel** o **GitHub Pages**. Recuerda:

- En el hosting, define `VITE_CONVEX_URL` con la URL de tu deployment **de producción**.
- En GitHub, agrega (o cambia) la **Authorization callback URL** a la del dominio de
  producción y actualiza `SITE_URL` en Convex (`npx convex env set SITE_URL https://tu-sitio`).

## Configuración del repo a vigilar

Por defecto vigila `AndrewHypervenom/capacitaciones` con ramas `main, isa, paola`
(ver `src/lib/config.ts`). Para cambiarlo sin tocar código, añade a `.env.local`:

```
VITE_GITHUB_OWNER=otro-owner
VITE_GITHUB_REPO=otro-repo
VITE_BRANCHES=main,dev,feature
```

## Versión anterior (Supabase)

La implementación original sin login y con Supabase quedó en `legacy-supabase/`
como referencia. Ya no se usa.
