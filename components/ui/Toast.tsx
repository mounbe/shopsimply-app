'use client'

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info' | 'loading'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => string
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  loading: (message: string) => string
  dismiss: (id: string) => void
}

// ── Context ───────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ── Icons ─────────────────────────────────────────────
const ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  loading: '⏳',
}

const BG: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-navy',
  loading: 'bg-gray-700',
}

// ── Toast Item ────────────────────────────────────────
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl text-white text-sm font-semibold shadow-lg',
        'animate-slide-up max-w-[320px] cursor-pointer',
        BG[toast.type]
      )}
      onClick={() => onDismiss(toast.id)}
    >
      <span className="text-base flex-shrink-0">{ICONS[toast.type]}</span>
      <span className="flex-1 leading-snug">{toast.message}</span>
      {toast.type === 'loading' && (
        <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin flex-shrink-0" />
      )}
    </div>
  )
}

// ── Provider ──────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 3000): string => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev.slice(-4), { id, message, type, duration }])

    if (type !== 'loading' && duration > 0) {
      const timer = setTimeout(() => dismiss(id), duration)
      timers.current.set(id, timer)
    }

    return id
  }, [dismiss])

  const success = useCallback((message: string) => toast(message, 'success', 3500), [toast])
  const error = useCallback((message: string) => toast(message, 'error', 5000), [toast])
  const info = useCallback((message: string) => toast(message, 'info', 3000), [toast])
  const loading = useCallback((message: string) => toast(message, 'loading', 0), [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error, info, loading, dismiss }}>
      {children}
      {/* Portal */}
      <div className="fixed bottom-24 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
