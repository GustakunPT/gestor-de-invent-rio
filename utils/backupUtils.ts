import { BackupData } from '../types';

/**
 * Cria e descarrega um backup JSON
 */
export const createBackup = (data: Omit<BackupData, 'version' | 'createdAt'>): void => {
    const backup: BackupData = {
        ...data,
        version: '1.0',
        createdAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_inventario_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
};

/**
 * Valida estrutura do backup
 */
export const validateBackup = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data) {
        return { isValid: false, errors: ['Ficheiro vazio ou inválido'] };
    }

    if (!data.version) errors.push('Versão do backup não encontrada');
    if (!data.createdAt) errors.push('Data do backup não encontrada');
    if (!Array.isArray(data.products)) errors.push('Lista de produtos inválida ou em falta');
    if (!Array.isArray(data.customers)) errors.push('Lista de clientes inválida ou em falta');
    if (!Array.isArray(data.suppliers)) errors.push('Lista de fornecedores inválida ou em falta');
    if (!Array.isArray(data.sales)) errors.push('Lista de vendas inválida ou em falta');
    if (!Array.isArray(data.users)) errors.push('Lista de utilizadores inválida ou em falta');

    // Validar versão
    if (data.version && !['1.0'].includes(data.version)) {
        errors.push(`Versão do backup não suportada: ${data.version}`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Lê e valida ficheiro de backup
 */
export const readBackupFile = (
    file: File,
    onProgress?: (message: string) => void
): Promise<BackupData> => {
    return new Promise((resolve, reject) => {
        if (!file.name.endsWith('.json')) {
            reject(new Error('O ficheiro deve ser do tipo JSON'));
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                onProgress?.('A ler ficheiro...');
                const content = e.target?.result as string;

                if (!content) {
                    reject(new Error('Ficheiro vazio'));
                    return;
                }

                onProgress?.('A processar dados...');
                const data = JSON.parse(content);

                onProgress?.('A validar backup...');
                const validation = validateBackup(data);

                if (!validation.isValid) {
                    reject(new Error(`Backup inválido:\n${validation.errors.join('\n')}`));
                    return;
                }

                onProgress?.('Backup válido!');
                resolve(data as BackupData);
            } catch (err) {
                if (err instanceof SyntaxError) {
                    reject(new Error('Erro ao processar JSON: ficheiro mal formatado'));
                } else {
                    reject(err);
                }
            }
        };

        reader.onerror = () => reject(new Error('Erro ao ler ficheiro'));
        reader.readAsText(file);
    });
};

/**
 * Formata tamanho do backup
 */
export const formatBackupSize = (data: BackupData): string => {
    const json = JSON.stringify(data);
    const bytes = new Blob([json]).size;

    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Estatísticas do backup
 */
export const getBackupStats = (data: BackupData) => ({
    products: data.products?.length || 0,
    customers: data.customers?.length || 0,
    suppliers: data.suppliers?.length || 0,
    sales: data.sales?.length || 0,
    purchaseOrders: data.purchaseOrders?.length || 0,
    users: data.users?.length || 0,
    promotions: data.promotions?.length || 0,
    createdAt: data.createdAt ? new Date(data.createdAt).toLocaleString('pt-PT') : 'N/A',
    version: data.version || 'N/A'
});
