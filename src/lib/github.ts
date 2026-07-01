import { useEffect, useState } from "react";
import { GITHUB_OWNER, GITHUB_REPO, BRANCHES } from "./config";

// Token opcional de GitHub (fine-grained, solo lectura). Si lo defines en
// .env.local como VITE_GITHUB_TOKEN, las consultas suben de ~60 a 5.000 req/h.
// Sin él todo sigue funcionando, solo con el límite de la API pública.
const GITHUB_TOKEN = (import.meta.env.VITE_GITHUB_TOKEN as string | undefined)?.trim();

function ghHeaders(): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (GITHUB_TOKEN) h.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return h;
}

export interface RepoFilesState {
  files: string[];
  loaded: boolean;
  hint: string;
}

// Trae la lista de archivos del repo (de todas las ramas) desde la API de GitHub.
// Es de solo lectura y pública; no necesita token (sujeto al límite de la API).
export function useRepoFiles(): RepoFilesState {
  const [files, setFiles] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [hint, setHint] = useState("Cargando lista de archivos del repo…");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const set = new Set<string>();
      for (const b of BRANCHES) {
        try {
          const r = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/${b}?recursive=1`,
            { headers: ghHeaders() },
          );
          if (!r.ok) continue;
          const data = await r.json();
          (data.tree || []).forEach((n: { type: string; path: string }) => {
            if (n.type === "blob") set.add(n.path);
          });
        } catch {
          /* ignora ramas que fallen */
        }
      }
      if (cancelled) return;

      const sorted = [...set].sort();
      setFiles(sorted);
      setLoaded(true);
      setHint(
        sorted.length
          ? `${sorted.length} archivos disponibles del repo. Escribe para buscar.`
          : "No se pudo leer GitHub (¿límite de la API?). Puedes escribir la ruta a mano.",
      );
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { files, loaded, hint };
}

// --- Detección REAL de conflictos (no depende de que alguien marque a mano) ---

export interface RealConflict {
  file: string;
  branches: string[]; // ramas (además de la base) que tocaron ese archivo
}

export interface BranchConflictsState {
  conflicts: RealConflict[];
  loading: boolean;
  error: string | null;
  base: string;
}

// Compara cada rama contra la base (la primera de BRANCHES, normalmente `main`)
// usando la API `compare` de GitHub y detecta los archivos que cambiaron en
// 2+ ramas: esos son los que darán conflicto real al unir. No hace falta que
// nadie los haya marcado en la Mesa de Control.
export function useBranchConflicts(): BranchConflictsState {
  const base = BRANCHES[0] ?? "main";
  const [state, setState] = useState<BranchConflictsState>({
    conflicts: [],
    loading: true,
    error: null,
    base,
  });

  useEffect(() => {
    let cancelled = false;
    const heads = BRANCHES.slice(1);

    (async () => {
      const byFile = new Map<string, Set<string>>();
      let error: string | null = null;

      for (const head of heads) {
        try {
          const r = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/compare/${base}...${head}`,
            { headers: ghHeaders() },
          );
          if (!r.ok) {
            if (r.status === 403 || r.status === 429) {
              error = GITHUB_TOKEN
                ? "Límite de la API de GitHub alcanzado. Intenta más tarde."
                : "Límite de la API pública de GitHub. Configura VITE_GITHUB_TOKEN para subirlo a 5.000/h.";
            } else if (r.status === 404) {
              error = `No se encontró la rama "${head}" (o el repo es privado y falta token).`;
            }
            continue;
          }
          const data = await r.json();
          for (const f of (data.files ?? []) as { filename: string }[]) {
            if (!byFile.has(f.filename)) byFile.set(f.filename, new Set());
            byFile.get(f.filename)!.add(head);
          }
        } catch {
          error = "No se pudo leer GitHub.";
        }
      }
      if (cancelled) return;

      const conflicts = [...byFile.entries()]
        .filter(([, br]) => br.size >= 2)
        .map(([file, br]) => ({ file, branches: [...br].sort() }))
        .sort((a, b) => a.file.localeCompare(b.file));

      setState({ conflicts, loading: false, error, base });
    })();

    return () => {
      cancelled = true;
    };
  }, [base]);

  return state;
}
