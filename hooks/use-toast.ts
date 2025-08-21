import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastState {
  toasts: Toast[];
}

let toastCount = 0;

const listeners: ((state: ToastState) => void)[] = [];
let memoryState: ToastState = { toasts: [] };

const dispatch = (state: ToastState) => {
  memoryState = state;
  listeners.forEach((listener) => listener(memoryState));
};

export const toast = ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
  const id = (++toastCount).toString();
  const newToast: Toast = { id, title, description, variant };
  
  dispatch({
    toasts: [...memoryState.toasts, newToast]
  });

  // Auto dismiss after 5 seconds
  setTimeout(() => {
    dispatch({
      toasts: memoryState.toasts.filter(t => t.id !== id)
    });
  }, 5000);

  return {
    id,
    dismiss: () => {
      dispatch({
        toasts: memoryState.toasts.filter(t => t.id !== id)
      });
    }
  };
};

export const useToast = () => {
  const [state, setState] = useState<ToastState>(memoryState);

  const subscribe = useCallback((listener: (state: ToastState) => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  const unsubscribe = useCallback(() => {
    listeners.length = 0;
  }, []);

  // Subscribe to state changes
  useState(() => {
    const unsub = subscribe((newState) => {
      setState(newState);
    });
    return unsub;
  });

  return {
    toast,
    toasts: state.toasts,
    dismiss: (id: string) => {
      dispatch({
        toasts: state.toasts.filter(t => t.id !== id)
      });
    }
  };
};