import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { groupByFile, isConflict } from "../lib/locks";
import { initials, timeAgo } from "../lib/ui";
import { useToast } from "../lib/toast";

export function Board() {
  const locks = useQuery(api.fileLocks.list);
  const me = useQuery(api.users.viewer);
  const release = useMutation(api.fileLocks.release);
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);

  const doRelease = async (id: Id<"fileLocks">) => {
    try {
      await release({ id });
      toast("Archivo liberado 👋");
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo liberar", "err");
    }
  };

  const total = locks?.length ?? 0;
  const q = search.trim().toLowerCase();

  let entries = locks ? [...groupByFile(locks).entries()] : [];
  if (q) entries = entries.filter(([f]) => f.toLowerCase().includes(q));
  if (onlyMine && me)
    entries = entries.filter(([, rows]) => rows.some((r) => r.userId === me._id));

  // Conflictivos primero.
  entries.sort((a, b) => (isConflict(b[1]) ? 1 : 0) - (isConflict(a[1]) ? 1 : 0));

  return (
    <section>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          📋 Archivos en trabajo ahora mismo
          <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">
            {total}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar tablero…"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
          />
          <label className="flex items-center gap-1.5 text-sm text-slate-600 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
              className="rounded"
            />
            Solo míos
          </label>
        </div>
      </div>

      {total === 0 ? (
        <div className="text-center text-slate-400 py-12">
          <div className="text-4xl">🌱</div>
          <p className="mt-2">Nadie ha marcado archivos todavía. ¡Sé el primero!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {entries.map(([file, rows]) => {
            const conflict = isConflict(rows);
            return (
              <div
                key={file}
                className={`bg-white rounded-xl border ${
                  conflict
                    ? "border-rose-300 ring-1 ring-rose-200"
                    : "border-slate-200"
                } shadow-sm p-4 fade-in`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span title={conflict ? "Conflicto potencial" : "OK"}>
                    {conflict ? "🚨" : "✅"}
                  </span>
                  <code className="text-sm font-semibold text-slate-700 break-all">
                    {file}
                  </code>
                  <span className="ml-auto text-xs text-slate-400">
                    {rows.length} {rows.length === 1 ? "persona" : "personas"}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {rows.map((r) => {
                    const mine = me && r.userId === me._id;
                    return (
                      <div
                        key={r._id}
                        className="flex items-center justify-between gap-3 py-1.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-6 h-6 shrink-0 rounded-full grid place-items-center text-white text-[10px] font-bold"
                            style={{ background: r.color }}
                          >
                            {initials(r.userName)}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              {r.userName}{" "}
                              {mine && (
                                <span className="text-indigo-500 text-xs">(tú)</span>
                              )}
                              <span className="text-xs font-semibold text-violet-600 bg-violet-50 rounded px-1.5 py-0.5 ml-1">
                                {r.branch}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {r.note ? `${r.note} · ` : ""}
                              {timeAgo(r._creationTime)}
                            </div>
                          </div>
                        </div>
                        {mine && (
                          <button
                            onClick={() => void doRelease(r._id)}
                            className="shrink-0 text-xs font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 hover:bg-rose-50 rounded-lg px-2.5 py-1"
                          >
                            Liberar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
