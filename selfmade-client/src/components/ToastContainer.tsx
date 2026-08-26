import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToastStore, type Toast } from '../store/toastStore';

const STYLES: Record<Toast['type'], { wrapper: string; icon: React.ReactNode }> = {
  success: {
    wrapper: 'bg-green-50 border-green-200 text-green-800',
    icon: <CheckCircle2 className="text-green-600 shrink-0" size={20} />,
  },
  error: {
    wrapper: 'bg-red-50 border-red-200 text-red-800',
    icon: <XCircle className="text-red-600 shrink-0" size={20} />,
  },
  info: {
    wrapper: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: <Info className="text-blue-600 shrink-0" size={20} />,
  },
};

export const ToastContainer = () => {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`flex items-start gap-3 border rounded-xl shadow-lg px-4 py-3 animate-[fadeIn_0.15s_ease-out] ${STYLES[t.type].wrapper}`}
        >
          {STYLES[t.type].icon}
          <p className="text-sm font-medium flex-1 leading-snug">{t.message}</p>
          <button
            onClick={() => dismissToast(t.id)}
            className="text-current opacity-60 hover:opacity-100 transition-opacity shrink-0"
            aria-label="Закрыть уведомление"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
