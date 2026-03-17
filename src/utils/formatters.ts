/**
 * Utilitários de formatação centralizados para garantir consistência visual em todo o console.
 */

/**
 * Formata um valor numérico para a moeda brasileira (BRL).
 * @param value O valor a ser formatado
 * @param showSymbol Se deve exibir o símbolo "R$" (padrão: true)
 */
export const formatCurrency = (value: number, showSymbol: boolean = true): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formata uma string de data (YYYY-MM-DD) para o padrão brasileiro (DD/MM/YYYY).
 * @param dateString A string de data no formato ISO ou YYYY-MM-DD
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  } catch (e) {
    return dateString;
  }
};

/**
 * Formata uma porcentagem.
 * @param value O valor decimal ou inteiro
 */
export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};
