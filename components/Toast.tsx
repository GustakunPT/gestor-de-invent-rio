import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastMessage } from '../hooks/useToast';

interface ToastProps {
    toast: ToastMessage;
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(toast.id);
        }, toast.duration || 5000);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    };

    const colors = {
        success: 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800',
        error: 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800',
        warning: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800',
        info: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
    };

    return (
        <div className={`flex items-start p-4 rounded-lg border shadow-lg ${colors[toast.type]} animate-in slide-in-from-right duration-300`}>
            <div className="mr-3">{icons[toast.type]}</div>
            <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{toast.title}</p>
                {toast.message && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{toast.message}</p>
                )}
            </div>
            <button
                onClick={() => onClose(toast.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-2"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

// Container de Toasts
interface ToastContainerProps {
    toasts: ToastMessage[];
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
            {toasts.map(toast => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast toast={toast} onClose={onClose} />
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
