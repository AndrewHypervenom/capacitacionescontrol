import { useQuery } from "convex/react";
import { Authenticated, useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { GITHUB_OWNER, GITHUB_REPO } from "../lib/config";
import { initials } from "../lib/ui";

function ConnDot() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const state = isLoading ? "loading" : isAuthenticated ? "ok" : "idle";
  const led =
    state === "ok"
      ? "bg-emerald-400"
      : state === "idle"
        ? "bg-amber-300 animate-pulse"
        : "bg-amber-300 animate-pulse";
  const text = state === "ok" ? "En vivo" : state === "loading" ? "Conectando…" : "Sin sesión";
  return (
    <div className="flex items-center gap-2 text-xs bg-white/15 rounded-full px-3 py-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${led}`} />
      <span>{text}</span>
    </div>
  );
}

function UserChip() {
  const me = useQuery(api.users.viewer);
  const { signOut } = useAuthActions();
  if (!me) return null;
  const name = me.name ?? me.email ?? "Yo";
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 bg-white/15 rounded-full pl-1.5 pr-3 py-1.5 text-sm font-semibold">
        {me.image ? (
          <img src={me.image} alt="" className="w-7 h-7 rounded-full" />
        ) : (
          <span className="w-7 h-7 rounded-full grid place-items-center bg-white/20 text-white text-xs font-bold">
            {initials(name)}
          </span>
        )}
        <span className="max-w-[10rem] truncate">{name}</span>
      </div>
      <button
        onClick={() => void signOut()}
        className="text-xs font-semibold bg-white/15 hover:bg-white/25 transition rounded-full px-3 py-2"
        title="Cerrar sesión"
      >
        Salir
      </button>
    </div>
  );
}

export function Header() {
  return (
    <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white">
      <div className="max-w-6xl mx-auto px-5 py-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
            🗂️ Mesa de Control
          </h1>
          <p className="text-indigo-100 text-sm mt-1">
            Coordina los archivos del repo{" "}
            <span className="font-semibold underline decoration-indigo-300">
              {GITHUB_OWNER}/{GITHUB_REPO}
            </span>{" "}
            para unir <b>main · isa · paola</b> sin conflictos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ConnDot />
          <Authenticated>
            <UserChip />
          </Authenticated>
        </div>
      </div>
    </header>
  );
}
