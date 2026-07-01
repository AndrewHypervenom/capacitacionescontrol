import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { groupByFile, type Lock } from "../lib/locks";

export function Alerts() {
  const locks = useQuery(api.fileLocks.list);
  if (!locks) return null;

  const alerts: { file: string; rows: Lock[]; crossBranch: boolean }[] = [];
  for (const [file, rows] of groupByFile(locks)) {
    const people = new Set(rows.map((r) => r.userId)).size;
    const branches = new Set(rows.map((r) => r.branch)).size;
    if (people > 1 || branches > 1) {
      alerts.push({ file, rows, crossBranch: branches > 1 });
    }
  }

  if (alerts.length === 0) return null;

  return (
    <section className="space-y-3">
      {alerts.map((a) => (
        <div
          key={a.file}
          className="bg-rose-50 border border-rose-300 rounded-xl p-4 fade-in"
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">🚨</div>
            <div className="flex-1">
              <p className="font-bold text-rose-800">
                Conflicto potencial en{" "}
                <code className="bg-rose-100 px-1 rounded">{a.file}</code>
              </p>
              <p className="text-sm text-rose-700 mt-0.5">
                {a.crossBranch
                  ? "Este archivo se está tocando en ramas distintas: al hacer el merge habrá conflicto."
                  : "Más de una persona está trabajando este archivo."}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {a.rows.map((r) => (
                  <span
                    key={r._id}
                    className="inline-flex items-center gap-1 bg-white/70 rounded-full px-2 py-0.5 text-xs font-medium"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: r.color }}
                    />
                    {r.userName}
                    <span className="text-rose-500">· {r.branch}</span>
                  </span>
                ))}
              </div>
              <p className="text-sm text-rose-800 mt-2">
                👉 <b>Qué hacer:</b> pónganse de acuerdo en quién edita ahora. La otra
                persona espera, hace{" "}
                <code className="bg-rose-100 px-1 rounded">git pull</code> y luego edita.
                Liberen el archivo al terminar.
              </p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
