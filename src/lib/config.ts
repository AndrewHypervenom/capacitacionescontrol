// Repositorio a vigilar. Se puede sobreescribir con variables VITE_* en .env.local.
const env = import.meta.env;

export const GITHUB_OWNER: string =
  (env.VITE_GITHUB_OWNER as string) || "AndrewHypervenom";

export const GITHUB_REPO: string =
  (env.VITE_GITHUB_REPO as string) || "capacitaciones";

// Ramas que se van a unir, en orden de prioridad de merge.
export const BRANCHES: string[] = (
  (env.VITE_BRANCHES as string) || "main,isa,paola"
)
  .split(",")
  .map((b) => b.trim())
  .filter(Boolean);

// A partir de cuántas horas un lock se considera "viejo" (posiblemente olvidado).
// Se resalta en el tablero para que alguien lo revise o lo libere.
export const STALE_HOURS: number =
  Number(env.VITE_STALE_HOURS) > 0 ? Number(env.VITE_STALE_HOURS) : 24;
