"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastItem = { id: number; message: string };
type ToastContextValue = { show: (message: string) => void };

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const show = useCallback((message: string) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 ? (
        <div
          className="pointer-events-none fixed bottom-6 left-1/2 z-[9999] flex -translate-x-1/2 flex-col gap-2"
          aria-live="polite"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className="toast-enter pointer-events-auto rounded-[10px] bg-primary px-6 py-3 text-sm font-medium text-white shadow-[0_6px_20px_rgba(0,0,0,0.2)]"
            >
              {t.message}
            </div>
          ))}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
