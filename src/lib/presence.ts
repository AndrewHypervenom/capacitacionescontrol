import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

// Envía un "latido" al entrar y luego cada 30 s mientras la pestaña esté abierta
// y visible. Así el resto del equipo ve quién está conectado en vivo. Al cerrar
// la pestaña simplemente deja de latir y la persona cae de la lista al minuto.
export function usePresenceHeartbeat() {
  const heartbeat = useMutation(api.presence.heartbeat);

  useEffect(() => {
    let stopped = false;
    const beat = () => {
      if (!stopped && document.visibilityState === "visible") {
        void heartbeat({});
      }
    };
    beat();
    const id = setInterval(beat, 30_000);
    document.addEventListener("visibilitychange", beat);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [heartbeat]);
}
