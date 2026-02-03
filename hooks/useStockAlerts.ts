import { useMemo } from 'react';
import { Product } from '../types';

export interface StockAlert {
    id: string;
    productId: string;
    productName: string;
    type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING' | 'OVERSTOCK';
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    createdAt: string;
    isRead: boolean;
    isDismissed: boolean;
}

/**
 * Hook para gerar alertas de stock automaticamente
 */
export const useStockAlerts = (products: Product[]): StockAlert[] => {
    // Proteção contra undefined
    const safeProducts = products || [];

    return useMemo(() => {
        const alerts: StockAlert[] = [];
        const now = new Date();

        safeProducts.forEach(product => {
            // Ignorar produtos inativos (se o campo existir)
            if ('isActive' in product && !product.isActive) return;

            // Alerta de Stock Esgotado
            if (product.quantity === 0) {
                alerts.push({
                    id: `ALERT-${product.id}-OUT`,
                    productId: product.id,
                    productName: product.name,
                    type: 'OUT_OF_STOCK',
                    message: `${product.name} está esgotado!`,
                    severity: 'CRITICAL',
                    createdAt: now.toISOString(),
                    isRead: false,
                    isDismissed: false
                });
            }
            // Alerta de Stock Baixo
            else if (product.quantity <= product.minStock) {
                alerts.push({
                    id: `ALERT-${product.id}-LOW`,
                    productId: product.id,
                    productName: product.name,
                    type: 'LOW_STOCK',
                    message: `${product.name} tem apenas ${product.quantity} unidades (mínimo: ${product.minStock})`,
                    severity: 'HIGH',
                    createdAt: now.toISOString(),
                    isRead: false,
                    isDismissed: false
                });
            }
            // Alerta de Excesso de Stock
            else if (product.quantity > product.maxStock) {
                alerts.push({
                    id: `ALERT-${product.id}-OVER`,
                    productId: product.id,
                    productName: product.name,
                    type: 'OVERSTOCK',
                    message: `${product.name} tem ${product.quantity} unidades (máximo: ${product.maxStock})`,
                    severity: 'LOW',
                    createdAt: now.toISOString(),
                    isRead: false,
                    isDismissed: false
                });
            }

            // Alerta de Validade (30 dias) - se o campo existir
            if ('expirationDate' in product && product.expirationDate) {
                const expDate = new Date(product.expirationDate as string);
                const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
                    alerts.push({
                        id: `ALERT-${product.id}-EXP`,
                        productId: product.id,
                        productName: product.name,
                        type: 'EXPIRING',
                        message: `${product.name} expira em ${daysUntilExpiry} dias`,
                        severity: daysUntilExpiry <= 7 ? 'HIGH' : 'MEDIUM',
                        createdAt: now.toISOString(),
                        isRead: false,
                        isDismissed: false
                    });
                }
            }
        });

        // Ordenar por severidade
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    }, [safeProducts]);
};
