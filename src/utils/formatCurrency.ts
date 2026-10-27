export const formatCurrency = (amount: number, currency: string = 'PEN'): string => new Intl.NumberFormat('es-PE', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
