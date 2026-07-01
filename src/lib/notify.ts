import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { groupByFile, isConflict } from "./locks";
import { useToast } from "./toast";

// Avisa activamente cuando aparece un conflicto NUEVO que te involucra a ti:
// alguien marca un archivo que tú tienes, o lo marca en otra rama. Muestra un
// toast y, si diste permiso, una notificación del navegador (aunque no estés
// mirando la pestaña). Es reactivo gracias a la suscripción de Convex.
export function useCollisionAlerts() {
  const locks = useQuery(api.fileLocks.list);
  const me = useQuery(api.users.viewer);
  const toast = useToast();
  const known = useRef<Set<string> | null>(null);

  // Pide permiso de notificaciones una sola vez.
  useEffect(() => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!locks || !me) return;

    const mineInConflict = new Set<string>();
    for (const [file, rows] of groupByFile(locks)) {
      if (isConflict(rows) && rows.some((r) => r.userId === me._id)) {
        mineInConflict.add(file);
      }
    }

    // Primera carga: guarda el estado actual sin avisar (evita spam al entrar).
    if (known.current === null) {
      known.current = mineInConflict;
      return;
    }

    for (const file of mineInConflict) {
      if (!known.current.has(file)) {
        toast(`🚨 Choque en ${file} — alguien más lo está tocando`, "err");
        if (
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          new Notification("Mesa de Control — conflicto", {
            body: `${file}: otra persona está trabajando ese archivo.`,
          });
        }
      }
    }

    known.current = mineInConflict;
  }, [locks, me, toast]);
}
