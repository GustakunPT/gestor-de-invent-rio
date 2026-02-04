/**
 * Formata uma data para o formato português "dd-MM-yyyy HH:mm"
 * @param dateInput - Data em qualquer formato aceite por Date()
 * @returns String formatada ou '-' se inválida
 */
export const formatDateTime = (dateInput: string | Date | number): string => {
    const d = new Date(dateInput);

    // Verifica se a data é válida
    if (isNaN(d.getTime())) return '-';

    // Formata os componentes da data com padding de zeros
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
};

/**
 * Formata uma data para o formato "dd-MM-yyyy" (sem hora)
 */
export const formatDate = (dateInput: string | Date | number): string => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
};
