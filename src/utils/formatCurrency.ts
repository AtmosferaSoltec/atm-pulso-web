const formatter = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });

/** Formats an amount the API sent as text ("270.00") or a number. */
export const formatCurrency = (amount: number | string): string => formatter.format(typeof amount === 'string' ? Number(amount) : amount);
