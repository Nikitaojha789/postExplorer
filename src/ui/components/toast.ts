import { AccessibilityInfo } from 'react-native';

import { create } from 'zustand';

export type ToastType = 'info' | 'success' | 'error';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

const DURATION_MS = 3_500;
const MAX_VISIBLE = 3;

let nextId = 0;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

export const useToastStore = create<{ toasts: ToastMessage[] }>()(() => ({ toasts: [] }));

const dismiss = (id: number) => {
  clearTimeout(timers.get(id));
  timers.delete(id);
  useToastStore.setState(state => ({ toasts: state.toasts.filter(toast => toast.id !== id) }));
};

const show = (message: string, type: ToastType = 'info') => {
  const id = ++nextId;
  useToastStore.setState(state => ({
    toasts: [...state.toasts, { id, message, type }].slice(-MAX_VISIBLE),
  }));
  timers.set(
    id,
    setTimeout(() => dismiss(id), DURATION_MS),
  );
  AccessibilityInfo.announceForAccessibility(message);
  return id;
};

/**
 * Imperative, callable from anywhere (mutation callbacks, services):
 *   toast.error(t('errors.network'))
 * Messages must already be translated.
 */
export const toast = {
  show,
  info: (message: string) => show(message, 'info'),
  success: (message: string) => show(message, 'success'),
  error: (message: string) => show(message, 'error'),
  dismiss,
} as const;
