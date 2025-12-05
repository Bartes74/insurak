import { useToast, type ToastType } from '../context/ToastContext';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';

export default function ToastContainer() {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
            ))}
        </div>
    );
}

function ToastItem({ message, type, onDismiss }: { id: string; message: string; type: ToastType; onDismiss: () => void }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        // Wait for exit animation
        setTimeout(onDismiss, 300);
    };

    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-500" />,
        error: <AlertCircle className="h-5 w-5 text-red-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
    };

    const styles = {
        success: 'bg-white dark:bg-gray-800 border-green-100 dark:border-green-900/30',
        error: 'bg-white dark:bg-gray-800 border-red-100 dark:border-red-900/30',
        info: 'bg-white dark:bg-gray-800 border-blue-100 dark:border-blue-900/30',
    };

    return (
        <div
            className={clsx(
                "pointer-events-auto flex items-center w-full p-4 rounded-lg shadow-lg border transition-all duration-300 transform",
                styles[type],
                isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            )}
            role="alert"
        >
            <div className="flex-shrink-0">{icons[type]}</div>
            <div className="ml-3 text-sm font-medium text-gray-900 dark:text-white">{message}</div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                onClick={handleDismiss}
            >
                <span className="sr-only">Zamknij</span>
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
