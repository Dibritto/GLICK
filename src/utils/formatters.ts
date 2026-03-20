/**
 * Utilitários de formatação centralizados para garantir consistência visual em todo o console.
 */

/**
 * Formata um valor numérico para a moeda brasileira (BRL).
 * @param value O valor a ser formatado
 * @param showSymbol Se deve exibir o símbolo "R$" (padrão: true)
 */
export const formatCurrency = (value: number | undefined | null, showSymbol: boolean = true): string => {
  const numValue = Number(value);
  if (isNaN(numValue)) return showSymbol ? 'R$ 0,00' : '0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

/**
 * Formata uma string de data (YYYY-MM-DD) para o padrão brasileiro (DD/MM/YYYY).
 * @param dateString A string de data no formato ISO ou YYYY-MM-DD
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    // Se for apenas YYYY-MM-DD, evitamos o problema de fuso horário
    // que ocorre ao usar new Date(dateString) diretamente.
    if (dateString.includes('T')) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR').format(date);
    }
    
    const [year, month, day] = dateString.split('-').map(Number);
    // Note: month is 0-indexed in JS Date
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  } catch (e) {
    return dateString;
  }
};

/**
 * Formata uma porcentagem.
 * @param value O valor decimal ou inteiro
 */
export const formatPercent = (value: number | undefined | null): string => {
  const numValue = Number(value);
  if (isNaN(numValue)) return '0.0%';
  return `${numValue.toFixed(1)}%`;
};
