/** Gera id único para mensagens otimistas (sem risco de colisão do Math.random). */
export function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Converte valores em formato brasileiro para número.
 * "1.500,50" -> 1500.5 | "1500.50" -> 1500.5 | "1500,50" -> 1500.5
 */
export function parseBRL(raw: string): number {
  const s = raw.trim();
  if (!s) return NaN;
  // Tem vírgula: assume formato pt-BR (ponto = milhar, vírgula = decimal)
  if (s.includes(',')) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  }
  return parseFloat(s);
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-br', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
