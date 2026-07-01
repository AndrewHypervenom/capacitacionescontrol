import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Header } from "./components/Header";
import { SignIn } from "./components/SignIn";
import { ClaimForm } from "./components/ClaimForm";
import { Alerts } from "./components/Alerts";
import { Board } from "./components/Board";
import { MergeGuide } from "./components/MergeGuide";
import { GITHUB_OWNER, GITHUB_REPO } from "./lib/config";

export default function App() {
  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen">
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
        <main className="max-w-6xl mx-auto px-5 py-8 space-y-8">
          <Alerts />
          <ClaimForm />
          <Board />
          <MergeGuide />
          <footer className="text-center text-xs text-slate-400 pt-4 pb-10">
            Coordina a Isa, Pao y el equipo · Datos en Convex · Login con GitHub ·{" "}
            <span className="font-semibold">
              {GITHUB_OWNER}/{GITHUB_REPO}
            </span>
          </footer>
        </main>
      </Authenticated>
    </div>
  );
}
