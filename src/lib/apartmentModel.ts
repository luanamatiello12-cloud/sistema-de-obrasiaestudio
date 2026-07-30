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
  /** Cor do piso acabado (quando o acabamento "Piso" está ligado) */
  piso: string;
}

export const ROOMS: Room[] = [
  { nome: 'Sala de Estar', rect: [0, 0, 8, 4], cor: '#4338ca', piso: '#9c6f47' },
  { nome: 'Cozinha', rect: [8, 0, 12, 2], cor: '#0d9488', piso: '#c9ccd1' },
  { nome: 'Área de Serviço', rect: [8, 2, 12, 4], cor: '#0369a1', piso: '#b8bcc2' },
  { nome: 'Suíte', rect: [0, 4, 3.5, 8], cor: '#7c3aed', piso: '#a2764e' },
  { nome: 'Banho', rect: [3.5, 4, 6, 8], cor: '#be185d', piso: '#cfd3d8' },
  { nome: 'Quarto', rect: [6, 4, 12, 8], cor: '#b45309', piso: '#9c6f47' },
];

/** Peça de mobília: centro (x,z), tamanho (l,a,p), cor e y-base opcional (para itens de parede). */
export interface Piece {
  pos: [number, number];
  size: [number, number, number];
  cor: string;
  y?: number;
}

export const FURNITURE: Piece[] = [
  // Sala de Estar
  { pos: [2, 3.5], size: [2.6, 0.7, 0.95], cor: '#3f4b5b' }, // sofá
  { pos: [2.4, 2.4], size: [1.2, 0.35, 0.6], cor: '#6b4f34' }, // mesa de centro
  { pos: [2.4, 2.5], size: [3, 0.02, 2], cor: '#8a6d4f', y: 0.03 }, // tapete
  { pos: [5, 0.22], size: [1.8, 0.7, 0.12], cor: '#1f2937', y: 1.2 }, // painel de TV
  // Cozinha
  { pos: [10, 0.4], size: [3.4, 0.9, 0.6], cor: '#475569' }, // bancada
  { pos: [10, 0.32], size: [3.4, 0.6, 0.32], cor: '#e2e8f0', y: 1.95 }, // armários superiores
  // Área de Serviço
  { pos: [11.4, 3.5], size: [0.6, 0.9, 0.6], cor: '#e5e7eb' }, // máquina/tanque
  // Suíte
  { pos: [1.75, 6.3], size: [1.7, 0.5, 2.1], cor: '#cbd5e1' }, // cama
  { pos: [1.75, 7.45], size: [1.9, 0.9, 0.15], cor: '#5b4636' }, // cabeceira
  { pos: [0.45, 5], size: [0.55, 2.2, 1.6], cor: '#6b5844' }, // guarda-roupa
  // Banho
  { pos: [3.95, 7.5], size: [0.45, 0.45, 0.65], cor: '#f8fafc' }, // vaso
  { pos: [5.5, 7.55], size: [0.8, 0.85, 0.5], cor: '#e2e8f0' }, // gabinete/pia
  // Quarto
  { pos: [8, 6.5], size: [1.9, 0.5, 2.2], cor: '#cbd5e1' }, // cama
  { pos: [8, 7.75], size: [2.1, 0.95, 0.15], cor: '#5b4636' }, // cabeceira
  { pos: [11.4, 6], size: [0.55, 2.2, 2.2], cor: '#6b5844' }, // guarda-roupa
  { pos: [7, 4.5], size: [1.3, 0.75, 0.55], cor: '#4b5563' }, // escrivaninha
];

/** Deslocamento para centralizar o apartamento na origem. */
export const CENTER_OFFSET: [number, number, number] = [-APT.width / 2, 0, -APT.depth / 2];
