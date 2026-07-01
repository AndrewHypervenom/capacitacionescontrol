import { useQuery } from "convex/react";
import { Authenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { GITHUB_OWNER, GITHUB_REPO } from "../lib/config";
import { initials } from "../lib/ui";

function UserChip() {
  const me = useQuery(api.users.viewer);
  const { signOut } = useAuthActions();
  if (!me) return null;
  const name = me.name ?? me.email ?? "Yo";
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-full pl-1.5 pr-3 py-1.5 text-sm font-semibold">
        {me.image ? (
          <img src={me.image} alt="" className="w-7 h-7 rounded-full" />
        ) : (
          <span className="w-7 h-7 rounded-full grid place-items-center bg-slate-700 text-slate-100 text-xs font-bold">
            {initials(name)}
          </span>
        )}
        <span className="max-w-[10rem] truncate">{name}</span>
      </div>
      <button
        onClick={() => void signOut()}
        className="text-xs font-semibold bg-slate-800/80 border border-slate-700 hover:bg-slate-700 transition rounded-full px-3 py-2"
        title="Cerrar sesión"
      >
        Salir
      </button>
    </div>
  );
}

export function Header() {
  return (
    <header className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-5 py-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            🗂️ Mesa de Control
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Coordina los archivos del repo{" "}
            <span className="font-semibold text-sky-300/90 underline decoration-slate-600 underline-offset-2">
              {GITHUB_OWNER}/{GITHUB_REPO}
            </span>{" "}
            para unir <b className="text-slate-200">main · isa · paola</b> sin conflictos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Authenticated>
            <UserChip />
          </Authenticated>
        </div>
      </div>
    </header>
  );
}
