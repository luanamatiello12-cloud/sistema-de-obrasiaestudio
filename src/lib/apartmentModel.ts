/**
 * Modelo geométrico da casa (bangalô Craftsman), em metros — a MESMA casa da
 * planta 2D e da "Casa Realista". Eixos: X = largura (0–11), Z = profundidade
 * (0–8.5), Y = altura. A frente (varanda) fica em z pequeno.
 * A vista 3D centraliza deslocando por CENTER_OFFSET.
 */

export const APT = {
  width: 11, // X
  depth: 8.5, // Z (inclui a varanda frontal)
  wallHeight: 2.7,
  wallThickness: 0.14,
  porchDepth: 1.4, // faixa frontal (z 0 → 1.4) = varanda
};

/** Segmentos de parede [x1, z1, x2, z2] da casa fechada (atrás da varanda). Vãos já recortados. */
export const WALLS: [number, number, number, number][] = [
  // Perímetro da casa fechada (frente em z=1.4, atrás da varanda)
  [0, 1.4, 5.4, 1.4],
  [6.2, 1.4, 11, 1.4], // frente com vão da porta de entrada
  [0, 8.5, 11, 8.5], // fundo
  [0, 1.4, 0, 8.5], // lateral esquerda
  [11, 1.4, 11, 8.5], // lateral direita

  // Divisória social/íntima (z = 5.0) com portas: suíte, banho, quarto
  [0, 5, 1.5, 5],
  [2.3, 5, 4.6, 5],
  [5.4, 5, 8, 5],
  [8.8, 5, 11, 5],

  // Sala | Hall (x = 4.6) e Hall | Cozinha (x = 7.2), com passagens
  [4.6, 1.4, 4.6, 3.0],
  [4.6, 3.8, 4.6, 5],
  [7.2, 1.4, 7.2, 3.0],
  [7.2, 3.8, 7.2, 5],

  // Suíte | Banho (x = 4.0) e Banho | Quarto (x = 5.8), com portas
  [4, 5, 4, 5.6],
  [4, 6.4, 4, 8.5],
  [5.8, 5, 5.8, 6.4],
  [5.8, 7.2, 5.8, 8.5],
];

export interface Room {
  nome: string;
  rect: [number, number, number, number];
  cor: string;
  piso: string;
}

export const ROOMS: Room[] = [
  { nome: 'Sala de Estar', rect: [0, 1.4, 4.6, 5], cor: '#4338ca', piso: '#9c6f47' },
  { nome: 'Hall / Jantar', rect: [4.6, 1.4, 7.2, 5], cor: '#4338ca', piso: '#a2764e' },
  { nome: 'Cozinha', rect: [7.2, 1.4, 11, 5], cor: '#0d9488', piso: '#c9ccd1' },
  { nome: 'Suíte', rect: [0, 5, 4, 8.5], cor: '#7c3aed', piso: '#a2764e' },
  { nome: 'Banho', rect: [4, 5, 5.8, 8.5], cor: '#be185d', piso: '#cfd3d8' },
  { nome: 'Quarto', rect: [5.8, 5, 11, 8.5], cor: '#b45309', piso: '#9c6f47' },
];

/** Colunas da varanda (x) — a frente da casa Craftsman. */
export const PORCH_COLUMNS: number[] = [0.8, 3.7, 7.3, 10.2];

export interface Piece {
  pos: [number, number];
  size: [number, number, number];
  cor: string;
  y?: number;
}

export const FURNITURE: Piece[] = [
  // Sala de Estar
  { pos: [2.3, 4.4], size: [2.4, 0.7, 0.9], cor: '#3f4b5b' }, // sofá
  { pos: [2.3, 3.2], size: [2.8, 0.02, 1.8], cor: '#8a6d4f', y: 0.03 }, // tapete
  { pos: [2.3, 3.2], size: [1.0, 0.35, 0.5], cor: '#6b4f34' }, // mesa de centro
  { pos: [2.3, 1.6], size: [1.8, 0.7, 0.12], cor: '#1f2937', y: 1.2 }, // painel de TV
  // Hall / Jantar
  { pos: [5.9, 3.2], size: [1.3, 0.74, 0.85], cor: '#5b4636' }, // mesa
  { pos: [5.9, 2.55], size: [0.42, 0.9, 0.42], cor: '#3f4b5b' },
  { pos: [5.9, 3.85], size: [0.42, 0.9, 0.42], cor: '#3f4b5b' },
  // Cozinha
  { pos: [9.1, 4.6], size: [3.4, 0.9, 0.6], cor: '#475569' }, // bancada
  { pos: [9.1, 4.68], size: [3.4, 0.6, 0.32], cor: '#e2e8f0', y: 1.95 }, // armários
  // Suíte
  { pos: [1.9, 6.9], size: [1.7, 0.5, 2.1], cor: '#cbd5e1' }, // cama
  { pos: [1.9, 8.05], size: [1.9, 0.9, 0.15], cor: '#5b4636' }, // cabeceira
  { pos: [0.5, 5.6], size: [0.55, 2.2, 1.6], cor: '#6b5844' }, // guarda-roupa
  // Banho
  { pos: [4.4, 8.1], size: [0.45, 0.45, 0.65], cor: '#f8fafc' }, // vaso
  { pos: [5.3, 8.15], size: [0.8, 0.85, 0.5], cor: '#e2e8f0' }, // pia
  // Quarto
  { pos: [8.4, 6.9], size: [1.9, 0.5, 2.1], cor: '#cbd5e1' }, // cama
  { pos: [8.4, 8.05], size: [2.1, 0.9, 0.15], cor: '#5b4636' }, // cabeceira
  { pos: [10.4, 6.5], size: [0.55, 2.2, 2.0], cor: '#6b5844' }, // guarda-roupa
];

export interface Janela {
  pos: [number, number];
  w: number;
  h: number;
  sill: number;
  axis: 'x' | 'z';
}

export const WINDOWS: Janela[] = [
  { pos: [2.3, 1.4], w: 1.8, h: 1.2, sill: 0.9, axis: 'x' }, // sala (frente)
  { pos: [9.0, 1.4], w: 1.6, h: 1.2, sill: 0.9, axis: 'x' }, // cozinha (frente)
  { pos: [0, 3.0], w: 1.6, h: 1.2, sill: 0.9, axis: 'z' }, // sala (lateral esq)
  { pos: [0, 6.7], w: 1.8, h: 1.2, sill: 0.9, axis: 'z' }, // suíte (lateral esq)
  { pos: [11, 6.7], w: 1.8, h: 1.2, sill: 0.9, axis: 'z' }, // quarto (lateral dir)
  { pos: [8.4, 8.5], w: 1.6, h: 1.2, sill: 0.9, axis: 'x' }, // quarto (fundo)
];

export interface Porta {
  hinge: [number, number];
  w: number;
  axis: 'x' | 'z';
  swing: number;
}

export const DOORS: Porta[] = [
  { hinge: [5.4, 1.4], w: 0.8, axis: 'x', swing: -0.6 }, // entrada
  { hinge: [4.6, 3.0], w: 0.8, axis: 'z', swing: 0.6 }, // sala ↔ hall
  { hinge: [7.2, 3.0], w: 0.8, axis: 'z', swing: -0.6 }, // hall ↔ cozinha
  { hinge: [1.5, 5], w: 0.8, axis: 'x', swing: 0.6 }, // suíte
  { hinge: [4.6, 5], w: 0.8, axis: 'x', swing: 0.6 }, // banho
  { hinge: [8, 5], w: 0.8, axis: 'x', swing: 0.6 }, // quarto
];

export const PHASES = [
  { nome: 'Terreno', desc: 'Terreno preparado e nivelado' },
  { nome: 'Fundação', desc: 'Sapatas, baldrame e contrapiso' },
  { nome: 'Alvenaria', desc: 'Paredes erguidas em blocos' },
  { nome: 'Cobertura', desc: 'Telhado de duas águas e varanda' },
  { nome: 'Instalações', desc: 'Hidráulica e elétrica embutidas' },
  { nome: 'Reboco & Gesso', desc: 'Paredes rebocadas e forro' },
  { nome: 'Contrapiso & Piso', desc: 'Pisos assentados' },
  { nome: 'Pintura', desc: 'Pintura e esquadrias' },
  { nome: 'Acabamento', desc: 'Marcenaria, mobília e entrega' },
] as const;

export interface Tubo {
  pos: [number, number, number];
  size: [number, number, number];
  cor: string;
}

export const INSTALACOES: Tubo[] = [
  // Hidráulica cozinha
  { pos: [9.1, 0.5, 4.85], size: [3.0, 0.07, 0.07], cor: '#38bdf8' },
  { pos: [9.1, 0.62, 4.85], size: [3.0, 0.06, 0.06], cor: '#f87171' },
  { pos: [10.6, 0.5, 4.85], size: [0.07, 1.0, 0.07], cor: '#38bdf8' },
  // Hidráulica banho
  { pos: [4.9, 0.5, 8.1], size: [1.6, 0.07, 0.07], cor: '#38bdf8' },
  { pos: [4.9, 0.62, 8.1], size: [1.6, 0.06, 0.06], cor: '#f87171' },
  { pos: [4.4, 0.12, 7.2], size: [0.11, 0.11, 1.8], cor: '#64748b' }, // esgoto
  // Elétrica
  { pos: [0.9, 1.4, 4.95], size: [0.06, 0.06, 3.4], cor: '#facc15' },
  { pos: [3.5, 1.4, 3.0], size: [6.5, 0.06, 0.06], cor: '#facc15' },
];

export const CENTER_OFFSET: [number, number, number] = [-APT.width / 2, 0, -APT.depth / 2];
