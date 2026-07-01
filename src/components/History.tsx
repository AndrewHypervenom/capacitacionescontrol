import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { timeAgo } from "../lib/ui";

// Bitácora: los últimos movimientos (quién marcó o liberó qué y cuándo).
// Colapsable para no ocupar espacio si no la necesitas.
export function History() {
  const events = useQuery(api.fileLocks.recentEvents);
  const [open, setOpen] = useState(false);

  const count = events?.length ?? 0;

  return (
    <section className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 text-left"
      >
        <h2 className="font-bold text-lg flex items-center gap-2">
          🕑 Actividad reciente
          <span className="text-xs bg-slate-800 text-slate-300 rounded-full px-2 py-0.5">
            {count}
          </span>
        </h2>
        <span className="ml-auto text-slate-400 text-sm">
          {open ? "Ocultar ▲" : "Mostrar ▼"}
        </span>
      </button>

      {open &&
        (count === 0 ? (
          <p className="text-sm text-slate-400 mt-3">
            Todavía no hay movimientos registrados.
          </p>
        ) : (
          <ul className="mt-4 space-y-1.5">
            {events!.map((e) => {
              const claim = e.action === "claim";
              const reasonLabel =
                e.reason === "stale"
                  ? " (limpieza de huérfanos)"
                  : e.reason === "branch"
                    ? " (liberó la rama)"
                    : "";
              return (
                <li
                  key={e._id}
                  className="flex items-center gap-2 text-sm border-b border-slate-800/60 last:border-0 pb-1.5"
                >
                  <span>{claim ? "🔒" : "👋"}</span>
                  <span className="font-medium text-slate-200">{e.userName}</span>
                  <span className="text-slate-400">
                    {claim ? "marcó" : "liberó"}
                  </span>
                  <code className="text-slate-300 break-all">{e.filePath}</code>
                  <span className="text-xs font-semibold text-violet-300 bg-violet-950/60 rounded px-1.5 py-0.5">
                    {e.branch}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-slate-500">
                    {reasonLabel}
                    {timeAgo(e._creationTime)}
                  </span>
                </li>
              );
            })}
          </ul>
        ))}
    </section>
  );
}
