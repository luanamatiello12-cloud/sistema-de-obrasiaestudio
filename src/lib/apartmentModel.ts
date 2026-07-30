/**
 * Modelo geométrico do apartamento (em metros), derivado da mesma planta 2D.
 * Eixos: X = largura (0–12 m), Z = profundidade (0–8 m), Y = altura.
 * A vista 3D centraliza o conjunto na origem deslocando por (-6, 0, -4).
 */

export const APT = {
  width: 12, // X
  depth: 8, // Z
  wallHeight: 2.6,
  wallThickness: 0.12,
};

/** Segmentos de parede [x1, z1, x2, z2]. Vãos de porta já estão "recortados". */
export const WALLS: [number, number, number, number][] = [
  // Perímetro externo
  [0, 0, 12, 0],
  [0, 8, 12, 8],
  [0, 0, 0, 8],
  [12, 0, 12, 8],

  // Divisória principal (z = 4) com vãos: suíte, banho, quarto
  [0, 4, 1.4, 4],
  [2.2, 4, 4.4, 4],
  [5.2, 4, 8.4, 4],
  [9.2, 4, 12, 4],

  // Topo: parede sala | cozinha/serviço (x = 8) com passagem
  [8, 0, 8, 1.6],
  [8, 2.4, 8, 4],
  // Cozinha | Área de serviço (z = 2)
  [8, 2, 9.5, 2],
  [10.3, 2, 12, 2],

  // Base: suíte | banho (x = 3.5) com porta
  [3.5, 4, 3.5, 5],
  [3.5, 5.8, 3.5, 8],
  // Banho | quarto (x = 6) com porta
  [6, 4, 6, 6],
  [6, 6.8, 6, 8],
];

export interface Room {
  nome: string;
  /** Retângulo do piso [x1, z1, x2, z2] */
  rect: [number, number, number, number];
  cor: string;
}

export const ROOMS: Room[] = [
  { nome: 'Sala de Estar', rect: [0, 0, 8, 4], cor: '#4338ca' },
  { nome: 'Cozinha', rect: [8, 0, 12, 2], cor: '#0d9488' },
  { nome: 'Área de Serviço', rect: [8, 2, 12, 4], cor: '#0369a1' },
  { nome: 'Suíte', rect: [0, 4, 3.5, 8], cor: '#7c3aed' },
  { nome: 'Banho', rect: [3.5, 4, 6, 8], cor: '#be185d' },
  { nome: 'Quarto', rect: [6, 4, 12, 8], cor: '#b45309' },
];

/** Deslocamento para centralizar o apartamento na origem. */
export const CENTER_OFFSET: [number, number, number] = [-APT.width / 2, 0, -APT.depth / 2];
