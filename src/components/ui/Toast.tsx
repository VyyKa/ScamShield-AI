'use client';

import React, { useEffect } from 'react';

type ToastVariant = 'info' | 'success' | 'danger' | 'warning';

export interface ToastProps {
  message: string | null;
  variant?: ToastVariant;
  onClose?: () => void;
  durationMs?: number;
}

const styles: Record<ToastVariant, string> = {
  info: 'border-white/15 text-on-surface',
  success: 'border-primary/35 text-primary',
  danger: 'border-danger/35 text-danger',
  warning: 'border-amber/35 text-amber',
};

export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'info',
  onClose,
  durationMs = 3000,
}) => {
  useEffect(() => {
    if (!message || !onClose) return;
    const t = setTimeout(onClose, durationMs);
    return () => clearTimeout(t);
  }, [message, onClose, durationMs]);

  if (!message) return null;

  return (
    <div
      role="status"
      className={`fixed bottom-24 left-1/2 z-[70] max-w-[min(92vw,420px)] -translate-x-1/2 rounded-xl border bg-surface-elevated/95 px-4 py-2.5 text-sm shadow-card backdrop-blur-md animate-scale-in md:bottom-8 ${styles[variant]}`}
    >
      {message}
    </div>
  );
};

export function useToast(durationMs = 3000) {
  const [toast, setToast] = React.useState<{ message: string; variant: ToastVariant } | null>(null);

  const show = React.useCallback((message: string, variant: ToastVariant = 'info') => {
    setToast({ message, variant });
  }, []);

  const clear = React.useCallback(() => setToast(null), []);

  const node = (
    <Toast
      message={toast?.message ?? null}
      variant={toast?.variant}
      onClose={clear}
      durationMs={durationMs}
    />
  );

  return { show, clear, node, toast };
}
