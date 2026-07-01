import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { GITHUB_OWNER, GITHUB_REPO } from "../lib/config";
import { useBranchConflicts } from "../lib/github";

// Detección REAL de conflictos: compara las ramas en GitHub y muestra los
// archivos que ya cambiaron en 2+ ramas (chocarán al unir), aunque nadie los
// haya marcado en la Mesa de Control.
export function GitConflicts() {
  const { conflicts, loading, error, base } = useBranchConflicts();
  const locks = useQuery(api.fileLocks.list);

  const claimed = new Set((locks ?? []).map((l) => l.filePath));

  return (
    <section className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6">
      <h2 className="font-bold text-lg flex items-center gap-2">
        🔍 Conflictos reales detectados en GitHub
      </h2>
      <p className="text-slate-400 text-sm mt-1">
        Comparado automáticamente contra{" "}
        <code className="bg-slate-800 px-1 rounded">{base}</code>. Estos archivos
        ya cambiaron en varias ramas y <b>chocarán al hacer el merge</b>, los haya
        marcado alguien o no.
      </p>

      {loading ? (
        <p className="text-sm text-slate-500 mt-4">Comparando ramas en GitHub…</p>
      ) : conflicts.length === 0 ? (
        <div className="mt-4 text-sm text-emerald-400 flex items-center gap-2">
          <span>✅</span>
          Ninguna rama pisa el mismo archivo. Todo limpio para unir.
        </div>
      ) : (
        <div className="grid gap-2 mt-4">
          {conflicts.map((c) => {
            const url = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/compare/${base}...${c.branches[c.branches.length - 1]}`;
            return (
              <div
                key={c.file}
                className="bg-rose-950/30 border border-rose-800 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span>🔥</span>
                  <code className="text-sm font-semibold text-slate-100 break-all">
                    {c.file}
                  </code>
                  <span className="text-xs text-slate-400">cambiado en</span>
                  {[base, ...c.branches].map((b) => (
                    <span
                      key={b}
                      className="text-xs font-semibold text-violet-300 bg-violet-950/60 rounded px-1.5 py-0.5"
                    >
                      {b}
                    </span>
                  ))}
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
                  >
                    ver diff ↗
                  </a>
                </div>
                <p className="text-xs mt-1.5">
                  {claimed.has(c.file) ? (
                    <span className="text-slate-400">
                      Alguien ya lo marcó en el tablero 👍
                    </span>
                  ) : (
                    <span className="text-amber-300">
                      ⚠️ Nadie lo ha marcado aquí todavía — pónganse de acuerdo antes de unir.
                    </span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-xs text-slate-500 mt-3">
          {error} (Sin token, la API pública de GitHub limita a ~60 consultas por hora.)
        </p>
      )}
    </section>
  );
}
