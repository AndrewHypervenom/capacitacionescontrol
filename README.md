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
- **Detección real de conflictos.** Compara las ramas en GitHub y avisa qué archivos
  chocarán al unir, los haya marcado alguien o no.
- **Notificaciones de choque.** Toast + notificación del navegador cuando alguien pisa
  un archivo que tú tienes marcado.
- **Modo oscuro** y **control de acceso** por lista blanca (ver más abajo).
- **Admins** que limpian locks huérfanos y ven el correo de cada usuario.

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
VITE_STALE_HOURS=24        # a las cuántas horas un lock se marca como "¿olvidado?" (def. 24)
```

## Administradores (limpiar locks huérfanos)

Normalmente cada persona solo puede liberar **sus** archivos. Si alguien marca
un archivo y se olvida de liberarlo, un **admin** puede liberarlo por él.

Los admins se definen por correo en el deployment de Convex (no en el código):

```powershell
npx convex env set ADMIN_EMAILS "tu@correo.com,isa@correo.com"
```

Un admin ve el botón **“Liberar (admin)”** en las tarjetas de cualquier persona,
y un panel **“Usuarios registrados”** con el correo de cada quien (útil para armar
las listas). Los locks con más de `VITE_STALE_HOURS` horas se resaltan con
**⏳ ¿olvidado?**.

## Control de acceso (solo el equipo)

Por defecto entra **cualquiera con cuenta de GitHub**. Para restringirlo a tu
equipo, define la lista blanca de correos en el deployment de Convex:

```powershell
npx convex env set ALLOWED_EMAILS "pachonandres721@gmail.com,isa@correo.com,pao@correo.com"
```

- Si **no** defines `ALLOWED_EMAILS`, el sitio queda abierto (no te bloqueas sin querer).
- Si la defines, quien no esté en la lista inicia sesión pero ve **“Acceso restringido”**.
- Los admins (`ADMIN_EMAILS`) siempre tienen acceso, aunque no estén en la lista blanca.

¿No sabes los correos de tu equipo? Que inicien sesión una vez y míralos en el
panel **“Usuarios registrados”** (o en el dashboard de Convex → Data → `users`).

## Versión anterior (Supabase)

La implementación original sin login y con Supabase quedó en `legacy-supabase/`
como referencia. Ya no se usa.
