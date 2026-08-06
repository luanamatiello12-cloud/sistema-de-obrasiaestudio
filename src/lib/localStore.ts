import type {
  ChatMessage,
  CronogramaItem,
  DiarioItem,
  FinanceiroItem,
  Hotspot,
  PedidoMaterial,
} from '../types';

/**
 * Banco de dados local (localStorage) usado no MODO DEMONSTRAÇÃO,
 * quando não há um projeto Supabase configurado. Reproduz o comportamento
 * do backend real — inclusive "tempo real" via eventos — para que o sistema
 * fique 100% navegável e apresentável sem depender de servidor.
 */

const KEY = 'gp_obra_demo_db_v4';

export type TableName =
  | 'chat_mensagens'
  | 'obra_cronograma'
  | 'obra_financeiro'
  | 'diario_obra'
  | 'pedidos_materiais'
  | 'pontos_tecnicos';

interface DB {
  chat_mensagens: ChatMessage[];
  obra_cronograma: CronogramaItem[];
  obra_financeiro: FinanceiroItem[];
  diario_obra: DiarioItem[];
  pedidos_materiais: PedidoMaterial[];
  pontos_tecnicos: Hotspot[];
  _seq: number;
}

/* ---------- Placeholders visuais (fotos de exemplo em SVG) ---------- */
function photo(label: string, from: string, to: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/>
    </linearGradient></defs>
    <rect width='400' height='300' fill='url(#g)'/>
    <rect x='16' y='16' width='368' height='268' fill='none' stroke='rgba(255,255,255,.25)' stroke-width='2' rx='12'/>
    <text x='200' y='158' fill='#fff' font-family='Montserrat,sans-serif' font-size='22' font-weight='800' text-anchor='middle' letter-spacing='1'>${label}</text>
    <text x='200' y='185' fill='rgba(255,255,255,.6)' font-family='Montserrat,sans-serif' font-size='11' font-weight='700' text-anchor='middle' letter-spacing='3'>GP:OBRA · REGISTRO</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Foto real de interior (Unsplash, uso livre), otimizada para a web. */
function roomPhoto(id: string): string {
  return `https://images.unsplash.com/photo-${id}?w=1000&q=80&auto=format&fit=crop`;
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const hoursAgo = (n: number) => new Date(Date.now() - n * 3600000).toISOString();

function seed(): DB {
  return {
    _seq: 100,
    obra_cronograma: [
      { id: 1, etapa: 'Demolição', progresso: 100, ordem: 1 },
      { id: 2, etapa: 'Contrapiso', progresso: 100, ordem: 2 },
      { id: 3, etapa: 'Hidráulica', progresso: 85, ordem: 3 },
      { id: 4, etapa: 'Elétrica', progresso: 70, ordem: 4 },
      { id: 5, etapa: 'Alvenaria / Gesso', progresso: 75, ordem: 5 },
      { id: 6, etapa: 'Marcenaria', progresso: 35, ordem: 6 },
      { id: 7, etapa: 'Pintura', progresso: 20, ordem: 7 },
      { id: 8, etapa: 'Acabamento Final', progresso: 5, ordem: 8 },
    ],
    obra_financeiro: [
      { id: 1, descricao: 'COMPRA: Cimento e argamassa', valor_pago: 2480.0, cupom_url: photo('Cupom Fiscal', '#1e293b', '#334155'), created_at: daysAgo(22) },
      { id: 2, descricao: 'COMPRA: Tubos e conexões PVC', valor_pago: 1875.5, cupom_url: photo('Cupom Fiscal', '#1e293b', '#334155'), created_at: daysAgo(18) },
      { id: 3, descricao: 'COMPRA: Fios e disjuntores', valor_pago: 3120.9, cupom_url: photo('Cupom Fiscal', '#1e293b', '#334155'), created_at: daysAgo(12) },
      { id: 4, descricao: 'COMPRA: Placas de gesso', valor_pago: 1640.0, cupom_url: photo('Cupom Fiscal', '#1e293b', '#334155'), created_at: daysAgo(7) },
      { id: 5, descricao: 'COMPRA: Porcelanato 80x80', valor_pago: 5890.0, cupom_url: photo('Cupom Fiscal', '#1e293b', '#334155'), created_at: daysAgo(3) },
    ],
    diario_obra: [
      { id: 1, autor: 'eng.ricardo@gpobra.com', descricao: 'Concluída a demolição das paredes da sala. Entulho removido e caçamba retirada. Área liberada para o contrapiso.', midia_url: photo('Demolição concluída', '#7c2d12', '#9a3412'), created_at: daysAgo(20) },
      { id: 2, autor: 'eng.ricardo@gpobra.com', descricao: 'Passagem da tubulação hidráulica da suíte e cozinha finalizada. Teste de pressão aprovado, sem vazamentos.', midia_url: photo('Prumadas hidráulicas', '#0c4a6e', '#0369a1'), created_at: daysAgo(9) },
      { id: 3, autor: 'eng.ricardo@gpobra.com', descricao: 'Infraestrutura elétrica em andamento. Eletrodutos e caixas de tomada posicionados conforme projeto luminotécnico.', created_at: daysAgo(4) },
    ],
    pedidos_materiais: [
      { id: 1, material: 'Porcelanato Acetinado 80x80', quantidade: '45 m²', urgencia: 'media', status: 'aprovado', created_at: daysAgo(5) },
      { id: 2, material: 'Rejunte Flexível (cinza platina)', quantidade: '12 sacos', urgencia: 'planeada', status: 'pendente', created_at: daysAgo(2) },
      { id: 3, material: 'Tinta acrílica premium fosca', quantidade: '8 latas 18L', urgencia: 'media', status: 'pendente', created_at: daysAgo(1) },
      { id: 4, material: 'Spots de LED embutir 7W', quantidade: '24 un', urgencia: 'critica', status: 'pendente', created_at: hoursAgo(6) },
    ],
    pontos_tecnicos: [
      { id: 1, nome_comodo: 'Sala de Estar', url_foto_interna: roomPhoto('1586023492125-27b2c045efd7'), pos_x: 22, pos_y: 38 },
      { id: 2, nome_comodo: 'Cozinha', url_foto_interna: roomPhoto('1556911220-bff31c812dba'), pos_x: 80, pos_y: 38 },
      { id: 3, nome_comodo: 'Suíte', url_foto_interna: roomPhoto('1616594039964-ae9021a400a0'), pos_x: 20, pos_y: 76 },
      { id: 4, nome_comodo: 'Quarto', url_foto_interna: roomPhoto('1522771739844-6a9f6d5f14af'), pos_x: 78, pos_y: 76 },
    ],
    chat_mensagens: [
      // Canal geral (todos veem)
      { id: 1, autor: 'cliente@gpobra.com', mensagem: 'Bom dia! Como está o andamento do porcelanato?', created_at: hoursAgo(28) },
      { id: 2, autor: 'eng.ricardo@gpobra.com', mensagem: 'Bom dia! Material entregue ontem, assentamento começa amanhã cedo.', created_at: hoursAgo(27) },
      { id: 3, autor: 'cliente@gpobra.com', mensagem: 'Perfeito. E os spots de LED, já foram pedidos?', created_at: hoursAgo(5) },
      { id: 4, autor: 'eng.ricardo@gpobra.com', mensagem: 'Acabei de lançar o pedido como crítico, aguardando sua aprovação no painel de materiais.', created_at: hoursAgo(4) },
      // Privado: Engenheiro ⇄ Mestre de obras
      { id: 5, autor: 'eng.ricardo@gpobra.com', para: 'mestre.jose@gpobra.com', mensagem: 'José, confirma se a prumada da suíte passou no teste de pressão antes de fechar a parede.', created_at: hoursAgo(26) },
      { id: 6, autor: 'mestre.jose@gpobra.com', para: 'eng.ricardo@gpobra.com', mensagem: 'Confirmado, engenheiro. Segurou 40 min sem queda. Pode liberar o gesso.', created_at: hoursAgo(25) },
      // Privado: Engenheiro ⇄ Cliente
      { id: 7, autor: 'cliente@gpobra.com', para: 'eng.ricardo@gpobra.com', mensagem: 'Consigo passar na obra sexta à tarde para ver os acabamentos?', created_at: hoursAgo(3) },
      { id: 8, autor: 'eng.ricardo@gpobra.com', para: 'cliente@gpobra.com', mensagem: 'Claro! Pode vir às 15h que eu te acompanho pessoalmente.', created_at: hoursAgo(2) },
    ],
  };
}

/* ---------- Persistência ---------- */
function read(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    /* ignore */
  }
  const fresh = seed();
  write(fresh);
  return fresh;
}

function write(db: DB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch (e) {
    console.warn('Modo demo: não foi possível persistir (armazenamento cheio).', e);
  }
}

export function resetDemo() {
  localStorage.removeItem(KEY);
}

/* ---------- Eventos (simula o realtime do Supabase) ---------- */
type Listener = (table: TableName, payload: any) => void;
const listeners = new Set<Listener>();

export function onChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(table: TableName, payload: any) {
  listeners.forEach((fn) => fn(table, payload));
}

/* ---------- Operações ---------- */
export function list<T = any>(table: TableName): T[] {
  const db = read();
  const rows = [...(db[table] as any[])];
  if (table === 'obra_cronograma') rows.sort((a, b) => a.ordem - b.ordem);
  else if (table === 'pontos_tecnicos') {
    /* sem ordenação */
  } else if (table === 'chat_mensagens') rows.sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));
  else rows.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
  return rows as T[];
}

export function insert(table: TableName, row: Record<string, any>) {
  const db = read();
  const id = ++db._seq;
  const created_at = new Date().toISOString();
  const full = { id, created_at, ...row };
  (db[table] as any[]).push(full);
  write(db);
  emit(table, { eventType: 'INSERT', new: full });
  return full;
}

export function update(table: TableName, id: number | string, patch: Record<string, any>) {
  const db = read();
  const arr = db[table] as any[];
  const idx = arr.findIndex((r) => r.id === id);
  if (idx >= 0) {
    arr[idx] = { ...arr[idx], ...patch };
    write(db);
    emit(table, { eventType: 'UPDATE', new: arr[idx] });
  }
}

export function remove(table: TableName, id: number | string) {
  const db = read();
  const arr = db[table] as any[];
  const idx = arr.findIndex((r) => r.id === id);
  if (idx >= 0) {
    const [removed] = arr.splice(idx, 1);
    write(db);
    emit(table, { eventType: 'DELETE', old: removed });
  }
}
