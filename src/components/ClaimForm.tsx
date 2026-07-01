import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { BRANCHES } from "../lib/config";
import { useRepoFiles } from "../lib/github";
import { useToast } from "../lib/toast";

export function ClaimForm() {
  const claim = useMutation(api.fileLocks.claim);
  const toast = useToast();
  const { files, hint } = useRepoFiles();

  const [branch, setBranch] = useState(BRANCHES[0] ?? "main");
  const [file, setFile] = useState("");
  const [note, setNote] = useState("");
  const [showList, setShowList] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Cierra el desplegable al hacer clic fuera.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowList(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const q = file.trim().toLowerCase();
  const matches = q
    ? files.filter((f) => f.toLowerCase().includes(q)).slice(0, 50)
    : [];

  const submit = async () => {
    if (!file.trim()) {
      toast("Escribe o elige un archivo", "warn");
      return;
    }
    setBusy(true);
    try {
      await claim({ filePath: file, branch, note });
      setFile("");
      setNote("");
      toast("Archivo marcado ✅");
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo guardar", "err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6 fade-in">
      <h2 className="font-bold text-lg flex items-center gap-2">
        ✍️ Marcar un archivo en el que estás trabajando
      </h2>
      <p className="text-slate-400 text-sm mt-1">
        Avisa al equipo antes de tocar un archivo. Si alguien más ya lo tiene, lo verás al
        instante.
      </p>

      <div className="grid md:grid-cols-12 gap-3 mt-5">
        <div className="md:col-span-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Tu rama
          </label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 px-3 py-2.5 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
          >
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-9 relative" ref={wrapRef}>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Archivo del repositorio
          </label>
          <input
            value={file}
            autoComplete="off"
            placeholder="Escribe para buscar… ej: src/App.tsx"
            onChange={(e) => {
              setFile(e.target.value);
              setShowList(true);
            }}
            onFocus={() => setShowList(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 px-3 py-2.5 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
          />
          {showList && matches.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-72 overflow-auto">
              {matches.map((f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() => {
                    setFile(f);
                    setShowList(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-700 border-b border-slate-700/40 last:border-0"
                >
                  {f}
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400 mt-1">{hint}</p>
        </div>

        <div className="md:col-span-9">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Nota (opcional)
          </label>
          <input
            value={note}
            maxLength={140}
            placeholder="¿Qué vas a cambiar? ej: Arreglando el login"
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 px-3 py-2.5 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
          />
        </div>

        <div className="md:col-span-3 flex items-end">
          <button
            onClick={() => void submit()}
            disabled={busy}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition text-white font-semibold rounded-lg px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔒 Marcar archivo
          </button>
        </div>
      </div>
    </section>
  );
}
