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
