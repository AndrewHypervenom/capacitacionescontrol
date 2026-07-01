import { Authenticated, Unauthenticated, AuthLoading, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Header } from "./components/Header";
import { SignIn } from "./components/SignIn";
import { ClaimForm } from "./components/ClaimForm";
import { Alerts } from "./components/Alerts";
import { Board } from "./components/Board";
import { GitConflicts } from "./components/GitConflicts";
import { AdminUsers } from "./components/AdminUsers";
import { MergeGuide } from "./components/MergeGuide";
import { useCollisionAlerts } from "./lib/notify";
import { GITHUB_OWNER, GITHUB_REPO } from "./lib/config";

export default function App() {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      <Header />

      <AuthLoading>
        <div className="max-w-6xl mx-auto px-5 py-20 text-center text-slate-400">
          Cargando…
        </div>
      </AuthLoading>

      <Unauthenticated>
        <SignIn />
      </Unauthenticated>

      <Authenticated>
        <AuthedApp />
      </Authenticated>
    </div>
  );
}

// Contenido para quien inició sesión. Si no está en la lista blanca, ve una
// pantalla de "sin acceso" en vez del tablero.
function AuthedApp() {
  const me = useQuery(api.users.viewer);
  useCollisionAlerts();

  if (me === undefined) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-20 text-center text-slate-400">
        Cargando…
      </div>
    );
  }

  if (me && !me.allowed) {
    return <NotAllowed />;
  }

  return (
    <main className="max-w-6xl mx-auto px-5 py-8 space-y-8">
      <Alerts />
      <ClaimForm />
      <Board />
      <GitConflicts />
      <AdminUsers />
      <MergeGuide />
      <footer className="text-center text-xs text-slate-400 pt-4 pb-10">
        Coordina a Isa, Pao y el equipo · Datos en Convex · Login con GitHub ·{" "}
        <span className="font-semibold">
          {GITHUB_OWNER}/{GITHUB_REPO}
        </span>
      </footer>
    </main>
  );
}

function NotAllowed() {
  return (
    <main className="max-w-6xl mx-auto px-5 py-20">
      <div className="max-w-md mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-8 text-center">
        <div className="text-5xl">🔒</div>
        <h2 className="font-bold text-xl mt-3">Acceso restringido</h2>
        <p className="text-slate-400 mt-2">
          Tu cuenta inició sesión correctamente, pero todavía no está autorizada
          para usar esta Mesa de Control. Pídele a un admin que agregue tu correo.
        </p>
      </div>
    </main>
  );
}
