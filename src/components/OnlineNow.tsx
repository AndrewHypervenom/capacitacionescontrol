import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { initials } from "../lib/ui";

// Barra de "conectados ahora mismo": avatares de quienes tienen la Mesa abierta.
// Se alimenta de los latidos de presencia y se actualiza en vivo.
export function OnlineNow() {
  const online = useQuery(api.presence.online);
  if (!online || online.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap text-sm">
      <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        En línea ahora
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {online.map((u) => (
          <span
            key={u.userId}
            title={u.userName}
            className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-full pl-1 pr-2.5 py-0.5"
          >
            <span className="w-5 h-5 rounded-full grid place-items-center bg-emerald-600 text-white text-[9px] font-bold">
              {initials(u.userName)}
            </span>
            <span className="text-slate-200 text-xs font-medium max-w-[8rem] truncate">
              {u.userName}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
