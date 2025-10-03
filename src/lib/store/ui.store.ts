// lib/stores/ui.store.ts
'use client';

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

/* Toasts */
export type ToastVariant = 'success' | 'error' | 'info' | 'warning';
export type Toast = {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number; // ms; default 4200
  createdAt: number;
};

/* Modals (ephemeral, not persisted) */
export type ConfirmModal = {
  type: 'confirm';
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void; // note: functions are runtime-only
  onCancel?: () => void;
};
export type ImageModal = {
  type: 'image';
  src: string;
  alt?: string;
};
export type CustomModal = {
  type: 'custom';
  id: string; // e.g., 'new-thread', 'edit-intro'
  payload?: Record<string, unknown>;
};
export type Modal = ConfirmModal | ImageModal | CustomModal;

type UIState = {
  // Global UI toggles
  mobileNavOpen: boolean;
  commandPaletteOpen: boolean;
  routeLoading: boolean; // for top progress bar / transitions

  // Toasts queue
  toasts: Toast[];

  // Single active modal
  modal: Modal | null;

  // Dismissed flags (persisted)
  dismissed: Record<string, boolean>;

  // Actions
  toggleMobileNav: (open?: boolean) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setRouteLoading: (loading: boolean) => void;

  pushToast: (toast: Omit<Toast, 'id' | 'createdAt'> & { id?: string }) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;

  openModal: (modal: Modal) => void;
  closeModal: () => void;

  setDismissed: (key: string, val: boolean) => void;

  reset: () => void;
};

const genId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try {
      
      return crypto.randomUUID();
    } catch  {}
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        mobileNavOpen: false,
        commandPaletteOpen: false,
        routeLoading: false,

        toasts: [],
        modal: null,

        dismissed: {},

        toggleMobileNav: (open) =>
          set(
            (s) => ({ mobileNavOpen: typeof open === 'boolean' ? open : !s.mobileNavOpen }),
            false,
            'ui/toggleMobileNav'
          ),

        openCommandPalette: () => set({ commandPaletteOpen: true }, false, 'ui/openCommandPalette'),
        closeCommandPalette: () => set({ commandPaletteOpen: false }, false, 'ui/closeCommandPalette'),

        setRouteLoading: (loading) => set({ routeLoading: loading }, false, 'ui/setRouteLoading'),

        pushToast: (toast) => {
          const id = toast.id ?? genId();
          const duration = typeof toast.duration === 'number' ? toast.duration : 4200;
          const next: Toast = {
            id,
            title: toast.title,
            message: toast.message,
            variant: toast.variant ?? 'info',
            duration,
            createdAt: Date.now(),
          };
          set((s) => ({ toasts: [...s.toasts, next] }), false, 'ui/pushToast');

          if (duration > 0) {
            // Auto-dismiss after duration
            setTimeout(() => {
              // Guard store existence
              try {
                get().dismissToast(id);
              } catch  {}
            }, duration);
          }
          return id;
        },

        dismissToast: (id) =>
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }), false, 'ui/dismissToast'),

        clearToasts: () => set({ toasts: [] }, false, 'ui/clearToasts'),

        openModal: (modal) => set({ modal }, false, 'ui/openModal'),
        closeModal: () => set({ modal: null }, false, 'ui/closeModal'),

        setDismissed: (key, val) =>
          set((s) => ({ dismissed: { ...s.dismissed, [key]: val } }), false, 'ui/setDismissed'),

        reset: () =>
          set(
            {
              mobileNavOpen: false,
              commandPaletteOpen: false,
              routeLoading: false,
              toasts: [],
              modal: null,
              // keep dismissed flags (persisted hints)
            },
            false,
            'ui/reset'
          ),
      }),
      {
        name: 'eiga.ui',
        storage: createJSONStorage(() => localStorage),
        // Persist only "dismissed" flags so hints/tooltips remain hidden once dismissed
        partialize: (s) => ({ dismissed: s.dismissed }),
        version: 1,
      }
    ),
    { name: 'ui-store' }
  )
);

// Selectors for fine-grained subscriptions
export const uiSelectors = {
  mobileNavOpen: (s: UIState) => s.mobileNavOpen,
  commandPaletteOpen: (s: UIState) => s.commandPaletteOpen,
  routeLoading: (s: UIState) => s.routeLoading,

  toasts: (s: UIState) => s.toasts,
  hasToasts: (s: UIState) => s.toasts.length > 0,

  modal: (s: UIState) => s.modal,
  isModalOpen: (s: UIState) => s.modal !== null,

  isDismissed:
    (key: string) =>
    (s: UIState): boolean =>
      !!s.dismissed[key],
};