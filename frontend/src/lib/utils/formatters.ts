/**
 * Utilitários para formatação de datas, números e outros valores
 */

/**
 * Formata uma data para exibição conforme o padrão brasileiro
 * @param dateString String contendo a data a ser formatada
 * @param includeTime Se true, inclui as informações de horário
 * @returns Data formatada como string
 */
export const formatDate = (dateString: string, includeTime: boolean = true): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return date.toLocaleDateString('pt-BR', options);
};

/**
 * Formata um número para exibição no formato brasileiro
 * @param value Número a ser formatado
 * @param decimalPlaces Quantidade de casas decimais
 * @returns Número formatado como string
 */
export const formatNumber = (value: number, decimalPlaces: number = 2): string => {
  if (value === undefined || value === null) return '';
  
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  });
};

/**
 * Formata um valor monetário para exibição no formato brasileiro
 * @param value Valor a ser formatado
 * @returns Valor formatado como string
 */
export const formatCurrency = (value: number): string => {
  if (value === undefined || value === null) return '';
  
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

/**
 * Trunca um texto longo, adicionando reticências no final se necessário
 * @param text Texto a ser truncado
 * @param maxLength Tamanho máximo do texto
 * @returns Texto truncado como string
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text || text.length <= maxLength) return text || '';
  
  return text.substring(0, maxLength) + '...';
};

/**
 * Formata um nome para exibição apenas com a primeira letra de cada palavra em maiúscula
 * @param name Nome a ser formatado
 * @returns Nome formatado como string
 */
export const formatName = (name: string): string => {
  if (!name) return '';
  
  return name.toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
