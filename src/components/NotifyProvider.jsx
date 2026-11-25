"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import CustomSnackbar from "./CustomSnackbar";
import LoadingSpinner from "./LoadingSpinner";

const NotifyContext = createContext(null);

/**
 * App-wide toasts (your CustomSnackbar) and the full-screen loader (your
 * LoadingSpinner).
 *   const { notify, withLoading } = useNotify();
 *   notify("Saved", "success");
 *   await withLoading(api.post(...));
 */
export function NotifyProvider({ children }) {
  const [toast, setToast] = useState({ open: false, severity: "info", message: "", key: 0 });
  const [busy, setBusy] = useState(0);
  const keyRef = useRef(0);

  const notify = useCallback((message, severity = "info") => {
    keyRef.current += 1;
    setToast({ open: true, severity, message: String(message), key: keyRef.current });
  }, []);

  const notifyError = useCallback((err) => notify(err?.message || "Something went wrong", "error"), [notify]);

  const withLoading = useCallback(async (promiseOrFn) => {
    setBusy((n) => n + 1);
    try {
      return await (typeof promiseOrFn === "function" ? promiseOrFn() : promiseOrFn);
    } finally {
      setBusy((n) => n - 1);
    }
  }, []);

  const value = useMemo(() => ({ notify, notifyError, withLoading }), [notify, notifyError, withLoading]);

  return (
    <NotifyContext.Provider value={value}>
      {children}
      <CustomSnackbar
        key={toast.key}
        open={toast.open}
        severity={toast.severity}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
      <LoadingSpinner open={busy > 0} />
    </NotifyContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotifyContext);
  if (!ctx) throw new Error("useNotify must be used inside NotifyProvider");
  return ctx;
}
