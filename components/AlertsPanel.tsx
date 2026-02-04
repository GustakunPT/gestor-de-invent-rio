import React from 'react';
import { AlertTriangle, AlertCircle, Package, Clock, X, Bell } from 'lucide-react';
import { StockAlert } from '../hooks/useStockAlerts';
import { formatDateTime } from '../utils/dateUtils';

interface AlertsPanelProps {
    alerts: StockAlert[];
    onDismiss: (id: string) => void;
    onDismissAll: () => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onDismiss, onDismissAll }) => {
    const activeAlerts = alerts.filter(a => !a.isDismissed);

    if (activeAlerts.length === 0) {
        return null;
    }

    const getAlertIcon = (type: StockAlert['type']) => {
        switch (type) {
            case 'OUT_OF_STOCK': return <Package className="w-5 h-5" />;
            case 'LOW_STOCK': return <AlertTriangle className="w-5 h-5" />;
            case 'EXPIRING': return <Clock className="w-5 h-5" />;
            case 'OVERSTOCK': return <AlertCircle className="w-5 h-5" />;
        }
    };

    const getSeverityColors = (severity: StockAlert['severity']) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-red-50 border-l-red-500 text-red-800 dark:bg-red-900/20 dark:text-red-300';
            case 'HIGH': return 'bg-orange-50 border-l-orange-500 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
            case 'MEDIUM': return 'bg-yellow-50 border-l-yellow-500 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
            case 'LOW': return 'bg-blue-50 border-l-blue-500 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
        }
    };

    const criticalCount = activeAlerts.filter(a => a.severity === 'CRITICAL').length;
    const highCount = activeAlerts.filter(a => a.severity === 'HIGH').length;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center">
                    <Bell className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        Alertas de Stock
                    </h3>
                    {criticalCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
                        </span>
                    )}
                    {highCount > 0 && (
                        <span className="ml-1 px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                            {highCount} alto{highCount > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <button
                    onClick={onDismissAll}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:underline"
                >
                    Limpar Todos
                </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {activeAlerts.slice(0, 10).map(alert => (
                    <div
                        key={alert.id}
                        className={`p-4 border-l-4 flex items-start justify-between ${getSeverityColors(alert.severity)}`}
                    >
                        <div className="flex items-start">
                            <div className="mr-3 mt-0.5">
                                {getAlertIcon(alert.type)}
                            </div>
                            <div>
                                <p className="font-medium text-sm">{alert.message}</p>
                                <p className="text-xs opacity-75 mt-1">
                                    {formatDateTime(alert.createdAt)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => onDismiss(alert.id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {activeAlerts.length > 10 && (
                    <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                        +{activeAlerts.length - 10} mais alertas
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlertsPanel;
