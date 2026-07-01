import { GITHUB_OWNER, GITHUB_REPO } from "../lib/config";
import { usePullRequests, type PullRequest } from "../lib/github";

// Muestra los Pull Requests abiertos del repo con su estado de fusión, para
// conectar la Mesa con el momento real del merge: qué PR une qué ramas y si
// GitHub ya detecta conflictos en él.
export function PullRequests() {
  const { prs, loading, error } = usePullRequests();

  return (
    <section className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6">
      <h2 className="font-bold text-lg flex items-center gap-2">
        🔀 Pull Requests abiertos en GitHub
      </h2>
      <p className="text-slate-400 text-sm mt-1">
        El estado real del merge: cada PR y si GitHub ya detecta conflictos en él.
      </p>

      {loading ? (
        <p className="text-sm text-slate-500 mt-4">Leyendo los PRs en GitHub…</p>
      ) : prs.length === 0 ? (
        <div className="mt-4 text-sm text-slate-400 flex items-center gap-2">
          <span>📭</span>
          No hay Pull Requests abiertos ahora mismo.
        </div>
      ) : (
        <div className="grid gap-2 mt-4">
          {prs.map((pr) => (
            <PrRow key={pr.number} pr={pr} />
          ))}
        </div>
      )}

      {error && <p className="text-xs text-slate-500 mt-3">{error}</p>}
    </section>
  );
}

function PrRow({ pr }: { pr: PullRequest }) {
  const status = pr.draft
    ? { label: "Borrador", cls: "text-slate-300 bg-slate-800" }
    : pr.mergeable === false
      ? { label: "⚠️ Con conflictos", cls: "text-rose-300 bg-rose-950/60" }
      : pr.mergeable === true
        ? { label: "✅ Se puede unir", cls: "text-emerald-300 bg-emerald-950/60" }
        : { label: "Calculando…", cls: "text-amber-300 bg-amber-950/60" };

  return (
    <div className="bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={pr.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-slate-100 hover:text-indigo-300 break-all"
        >
          #{pr.number} {pr.title}
        </a>
        <span
          className={`text-xs font-semibold rounded-full px-2 py-0.5 ${status.cls}`}
        >
          {status.label}
        </span>
        <a
          href={`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/pull/${pr.number}`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
        >
          abrir ↗
        </a>
      </div>
      <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5 flex-wrap">
        <span className="font-semibold text-violet-300 bg-violet-950/60 rounded px-1.5 py-0.5">
          {pr.head}
        </span>
        <span>→</span>
        <span className="font-semibold text-violet-300 bg-violet-950/60 rounded px-1.5 py-0.5">
          {pr.base}
        </span>
        <span className="text-slate-500">· por {pr.author}</span>
      </div>
    </div>
  );
}
