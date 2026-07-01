import { useEffect, useState } from "react";
import { GITHUB_OWNER, GITHUB_REPO, BRANCHES } from "./config";

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
