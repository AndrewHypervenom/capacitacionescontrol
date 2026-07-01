import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useToast } from "../lib/toast";

export function SignIn() {
  const { signIn } = useAuthActions();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await signIn("github");
    } catch (e) {
      console.error(e);
      toast("No se pudo iniciar sesión con GitHub.", "err");
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-5 py-16">
      <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-8 text-center fade-in">
        <div className="text-5xl">🔐</div>
        <h2 className="text-xl font-bold mt-3">Inicia sesión para entrar</h2>
        <p className="text-slate-400 text-sm mt-2">
          Usa tu cuenta de GitHub. Así el equipo sabe quién marca cada archivo, con tu
          nombre y avatar reales.
        </p>
        <button
          onClick={() => void handle()}
          disabled={loading}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-white active:scale-95 transition text-slate-900 font-semibold rounded-lg px-4 py-3 disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
          {loading ? "Abriendo GitHub…" : "Entrar con GitHub"}
        </button>
      </div>
    </main>
  );
}
