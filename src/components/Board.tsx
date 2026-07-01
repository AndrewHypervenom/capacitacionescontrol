import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { groupByFile, isConflict } from "../lib/locks";
import { initials, timeAgo } from "../lib/ui";
import { useToast } from "../lib/toast";
import { STALE_HOURS } from "../lib/config";

const STALE_MS = STALE_HOURS * 60 * 60 * 1000;

export function Board() {
  const locks = useQuery(api.fileLocks.list);
  const me = useQuery(api.users.viewer);
  const mySubs = useQuery(api.subscriptions.mine);
  const release = useMutation(api.fileLocks.release);
  const releaseBranch = useMutation(api.fileLocks.releaseBranch);
  const releaseStale = useMutation(api.fileLocks.releaseStale);
  const subscribe = useMutation(api.subscriptions.subscribe);
  const unsubscribe = useMutation(api.subscriptions.unsubscribe);
  const toast = useToast();

  const watched = new Set(mySubs ?? []);

  const toggleWatch = async (file: string) => {
    try {
      if (watched.has(file)) {
        await unsubscribe({ filePath: file });
        toast("Ya no vigilas ese archivo");
      } else {
        await subscribe({ filePath: file });
        toast("Te avisaremos cuando se libere 🔔");
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo actualizar", "err");
    }
  };

  const [search, setSearch] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [branch, setBranch] = useState("all");

  const doRelease = async (id: Id<"fileLocks">) => {
    try {
      await release({ id });
      toast("Archivo liberado 👋");
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo liberar", "err");
    }
  };

  const doReleaseBranch = async (b: string) => {
    if (!confirm(`¿Liberar todos los archivos marcados en la rama "${b}"?`)) return;
    try {
      const n = await releaseBranch({ branch: b });
      toast(n > 0 ? `Liberados ${n} de la rama ${b} 👋` : "No había nada que liberar");
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo liberar", "err");
    }
  };

  const doCleanStale = async () => {
    if (!confirm(`¿Liberar los locks más viejos que ${STALE_HOURS} h (huérfanos)?`)) return;
    try {
      const n = await releaseStale({ olderThanHours: STALE_HOURS });
      toast(n > 0 ? `Limpiados ${n} huérfanos 🧹` : "No hay huérfanos que limpiar");
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo limpiar", "err");
    }
  };

  const total = locks?.length ?? 0;
  const q = search.trim().toLowerCase();
  const branchOptions = [...new Set((locks ?? []).map((l) => l.branch))].sort();

  let entries = locks ? [...groupByFile(locks).entries()] : [];
  if (q) entries = entries.filter(([f]) => f.toLowerCase().includes(q));
  if (onlyMine && me)
    entries = entries.filter(([, rows]) => rows.some((r) => r.userId === me._id));
  if (branch !== "all")
    entries = entries
      .map(([f, rows]): [string, typeof rows] => [
        f,
        rows.filter((r) => r.branch === branch),
      ])
      .filter(([, rows]) => rows.length > 0);

  // Conflictivos primero.
  entries.sort((a, b) => (isConflict(b[1]) ? 1 : 0) - (isConflict(a[1]) ? 1 : 0));

  return (
    <section>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          📋 Archivos en trabajo ahora mismo
          <span className="text-xs bg-slate-800 text-slate-300 rounded-full px-2 py-0.5">
            {total}
          </span>
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar tablero…"
            className="rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
          />
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
            title="Filtrar por rama"
          >
            <option value="all">Todas las ramas</option>
            {branchOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-slate-300 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
              className="rounded"
            />
            Solo míos
          </label>
          {branch !== "all" && (
            <button
              onClick={() => void doReleaseBranch(branch)}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 border border-rose-800 hover:bg-rose-950/40 rounded-lg px-2.5 py-1.5"
              title={`Liberar todo lo marcado en ${branch}`}
            >
              Liberar rama {branch}
            </button>
          )}
          {me?.isAdmin && (
            <button
              onClick={() => void doCleanStale()}
              className="text-xs font-semibold text-amber-300 hover:text-amber-200 border border-amber-800 hover:bg-amber-950/40 rounded-lg px-2.5 py-1.5"
              title={`Liberar locks más viejos que ${STALE_HOURS} h`}
            >
              🧹 Limpiar huérfanos
            </button>
          )}
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
                className={`bg-slate-900 rounded-xl border ${
                  conflict
                    ? "border-rose-700 ring-1 ring-rose-900"
                    : "border-slate-800"
                } shadow-sm p-4 fade-in`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span title={conflict ? "Conflicto potencial" : "OK"}>
                    {conflict ? "🚨" : "✅"}
                  </span>
                  <code className="text-sm font-semibold text-slate-200 break-all">
                    {file}
                  </code>
                  {(() => {
                    const heldByOther = rows.some(
                      (r) => !me || r.userId !== me._id,
                    );
                    if (!heldByOther) return null;
                    const watching = watched.has(file);
                    return (
                      <button
                        onClick={() => void toggleWatch(file)}
                        className={`ml-auto shrink-0 text-xs font-semibold rounded-lg px-2 py-1 border ${
                          watching
                            ? "text-emerald-300 border-emerald-800 bg-emerald-950/40"
                            : "text-slate-300 border-slate-700 hover:bg-slate-800"
                        }`}
                        title={
                          watching
                            ? "Te avisaremos cuando quede libre. Clic para dejar de vigilar."
                            : "Recibe un aviso cuando este archivo quede libre."
                        }
                      >
                        {watching ? "🔔 Vigilando" : "🔔 Avísame"}
                      </button>
                    );
                  })()}
                  <span
                    className={`${rows.some((r) => !me || r.userId !== me._id) ? "" : "ml-auto"} text-xs text-slate-400`}
                  >
                    {rows.length} {rows.length === 1 ? "persona" : "personas"}
                  </span>
                </div>
                <div className="divide-y divide-slate-800">
                  {rows.map((r) => {
                    const mine = me && r.userId === me._id;
                    const stale = Date.now() - r._creationTime > STALE_MS;
                    const canRelease = mine || me?.isAdmin;
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
                              <span className="text-xs font-semibold text-violet-300 bg-violet-950/60 rounded px-1.5 py-0.5 ml-1">
                                {r.branch}
                              </span>
                              {stale && (
                                <span
                                  title={`Lleva marcado más de ${STALE_HOURS} h. ¿Sigue en uso o se olvidó liberar?`}
                                  className="text-xs font-semibold text-amber-300 bg-amber-950/60 rounded px-1.5 py-0.5 ml-1"
                                >
                                  ⏳ ¿olvidado?
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {r.note ? `${r.note} · ` : ""}
                              {timeAgo(r._creationTime)}
                            </div>
                          </div>
                        </div>
                        {canRelease && (
                          <button
                            onClick={() => void doRelease(r._id)}
                            className="shrink-0 text-xs font-semibold text-rose-400 hover:text-rose-300 border border-rose-800 hover:bg-rose-950/40 rounded-lg px-2.5 py-1"
                          >
                            {mine ? "Liberar" : "Liberar (admin)"}
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
