import { create } from 'zustand';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export interface ToastStateProps {
  // Toast state
  toast: {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration: number;
  };

  // Toast actions
  showToast: (props: ToastProps) => void;
  hideToast: () => void;
}

const useToastState = create<ToastStateProps>((set) => ({
  toast: {
    visible: false,
    message: '',
    type: 'info',
    duration: 2000,
  },
  showToast: (props: ToastProps) => {
    set({
      toast: {
        visible: true,
        message: props.message,
        type: props.type || 'info',
        duration: props.duration || 2000,
      },
    });
  },
  hideToast: () =>
    set((state) => ({
      toast: {
        ...state.toast,
        visible: false,
      },
    })),
}));

export default useToastState;