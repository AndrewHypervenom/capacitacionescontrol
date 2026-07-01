import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastType = "ok" | "err" | "warn";
interface Toast {
  id: number;
  msg: string;
  type: ToastType;
  leaving?: boolean;
}

const COLORS: Record<ToastType, string> = {
  ok: "bg-slate-800",
  err: "bg-rose-600",
  warn: "bg-amber-600",
};

const ToastCtx = createContext<(msg: string, type?: ToastType) => void>(() => {});

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((msg: string, type: ToastType = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => {
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    }, 2800);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${COLORS[t.type]} text-white text-sm rounded-lg px-4 py-3 shadow-lg fade-in max-w-xs transition-opacity duration-300`}
            style={{ opacity: t.leaving ? 0 : 1 }}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
