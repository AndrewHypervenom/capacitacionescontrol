import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { initials } from "../lib/ui";
import { useToast } from "../lib/toast";

// Panel visible SOLO para admins: lista de personas que han iniciado sesión,
// con su correo, para armar fácilmente la lista blanca / de admins.
export function AdminUsers() {
  const me = useQuery(api.users.viewer);
  const users = useQuery(api.users.listAll);
  const toast = useToast();

  if (!me?.isAdmin) return null;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Correo copiado 📋");
    } catch {
      toast("No se pudo copiar", "err");
    }
  };

  const copyAll = () => {
    const emails = (users ?? [])
      .map((u) => u.email)
      .filter((e): e is string => !!e)
      .join(",");
    if (emails) void copy(emails);
  };

  return (
    <section>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          👥 Usuarios registrados
          <span className="text-xs bg-slate-800 text-slate-300 rounded-full px-2 py-0.5">
            {users?.length ?? 0}
          </span>
          <span className="text-xs font-normal text-slate-400">(solo admins)</span>
        </h2>
        {(users?.length ?? 0) > 0 && (
          <button
            onClick={copyAll}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 border border-indigo-800 hover:bg-indigo-950/40 rounded-lg px-2.5 py-1"
          >
            Copiar todos los correos
          </button>
        )}
      </div>

      {!users || users.length === 0 ? (
        <p className="text-sm text-slate-400">
          Aún nadie ha iniciado sesión (aparte de ti). Cuando tus aprendices
          entren una vez, verás aquí sus correos.
        </p>
      ) : (
        <div className="grid gap-2">
          {users.map((u) => (
            <div
              key={u._id}
              className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm px-4 py-2.5 flex items-center gap-3"
            >
              <span className="w-7 h-7 shrink-0 rounded-full grid place-items-center bg-slate-700 text-slate-200 text-[11px] font-bold">
                {initials(u.name ?? u.email ?? "?")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">
                  {u.name ?? "Sin nombre"}
                  {u.isAdmin && (
                    <span className="text-xs font-semibold text-amber-300 bg-amber-950/60 rounded px-1.5 py-0.5 ml-1.5">
                      admin
                    </span>
                  )}
                  {!u.allowed && (
                    <span className="text-xs font-semibold text-rose-300 bg-rose-950/60 rounded px-1.5 py-0.5 ml-1.5">
                      sin acceso
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {u.email ?? "sin correo"}
                </div>
              </div>
              {u.email && (
                <button
                  onClick={() => void copy(u.email!)}
                  className="shrink-0 text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-700 hover:bg-slate-800 rounded-lg px-2.5 py-1"
                >
                  Copiar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
