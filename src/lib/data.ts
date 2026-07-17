import { sb } from './supabase';
import * as local from './localStore';
import type {
  ChatMessage,
  CronogramaItem,
  DiarioItem,
  FinanceiroItem,
  Hotspot,
  PedidoMaterial,
} from '../types';

/**
 * Camada de acesso a dados. Roteia cada operação para o Supabase real
 * ou para o banco local (modo demonstração), de forma transparente para
 * o resto do app. Sempre devolve { error } para tratamento uniforme.
 */

const MODE_KEY = 'gp_obra_mode';
export type Mode = 'supabase' | 'local';

export function getMode(): Mode {
  return (localStorage.getItem(MODE_KEY) as Mode) || 'local';
}
export function setMode(m: Mode) {
  localStorage.setItem(MODE_KEY, m);
}
export function isDemo() {
  return getMode() === 'local';
}

type Result = { error: string | null };

/* ---------------- Leituras ---------------- */
export async function listChat(): Promise<ChatMessage[]> {
  if (isDemo()) return local.list<ChatMessage>('chat_mensagens');
  const { data } = await sb.from('chat_mensagens').select('*').order('created_at', { ascending: true });
  return data ?? [];
}
export async function listCronograma(): Promise<CronogramaItem[]> {
  if (isDemo()) return local.list<CronogramaItem>('obra_cronograma');
  const { data } = await sb.from('obra_cronograma').select('*').order('ordem', { ascending: true });
  return data ?? [];
}
export async function listFinanceiro(): Promise<FinanceiroItem[]> {
  if (isDemo()) return local.list<FinanceiroItem>('obra_financeiro');
  const { data } = await sb.from('obra_financeiro').select('*').order('created_at', { ascending: false });
  return data ?? [];
}
export async function listDiario(): Promise<DiarioItem[]> {
  if (isDemo()) return local.list<DiarioItem>('diario_obra');
  const { data } = await sb.from('diario_obra').select('*').order('created_at', { ascending: false });
  return data ?? [];
}
export async function listPedidos(): Promise<PedidoMaterial[]> {
  if (isDemo()) return local.list<PedidoMaterial>('pedidos_materiais');
  const { data } = await sb.from('pedidos_materiais').select('*').order('created_at', { ascending: false });
  return data ?? [];
}
export async function listHotspots(): Promise<Hotspot[]> {
  if (isDemo()) return local.list<Hotspot>('pontos_tecnicos');
  const { data } = await sb.from('pontos_tecnicos').select('*');
  return data ?? [];
}

/* ---------------- Escritas ---------------- */
export async function sendChatMessage(payload: { autor: string; mensagem?: string; midia_url?: string }): Promise<Result> {
  if (isDemo()) {
    local.insert('chat_mensagens', payload);
    return { error: null };
  }
  const { error } = await sb.from('chat_mensagens').insert([payload]);
  return { error: error?.message ?? null };
}

export async function updateCronograma(id: number, progresso: number): Promise<Result> {
  if (isDemo()) {
    local.update('obra_cronograma', id, { progresso });
    return { error: null };
  }
  const { error } = await sb.from('obra_cronograma').update({ progresso }).eq('id', id);
  return { error: error?.message ?? null };
}

export async function createDiario(payload: { autor: string; descricao: string; midia_url?: string }): Promise<Result> {
  if (isDemo()) {
    local.insert('diario_obra', payload);
    return { error: null };
  }
  const { error } = await sb.from('diario_obra').insert([payload]);
  return { error: error?.message ?? null };
}

export async function createPedido(payload: {
  material: string;
  quantidade: string;
  urgencia: string;
  status: string;
}): Promise<Result> {
  if (isDemo()) {
    local.insert('pedidos_materiais', payload);
    return { error: null };
  }
  const { error } = await sb.from('pedidos_materiais').insert([payload]);
  return { error: error?.message ?? null };
}

export async function deletePedido(id: number): Promise<Result> {
  if (isDemo()) {
    local.remove('pedidos_materiais', id);
    return { error: null };
  }
  const { error } = await sb.from('pedidos_materiais').delete().eq('id', id);
  return { error: error?.message ?? null };
}

export async function createHotspot(payload: {
  nome_comodo: string;
  url_foto_interna: string;
  pos_x: number;
  pos_y: number;
}): Promise<Result> {
  if (isDemo()) {
    local.insert('pontos_tecnicos', payload);
    return { error: null };
  }
  const { error } = await sb.from('pontos_tecnicos').insert([payload]);
  return { error: error?.message ?? null };
}

export async function deleteHotspot(id: number): Promise<Result> {
  if (isDemo()) {
    local.remove('pontos_tecnicos', id);
    return { error: null };
  }
  const { error } = await sb.from('pontos_tecnicos').delete().eq('id', id);
  return { error: error?.message ?? null };
}

/** Aprova o pedido e lança no financeiro. No modo real usa a RPC atômica se existir. */
export async function finalizarCompra(pedido: PedidoMaterial, valor: number, cupomUrl: string): Promise<Result> {
  if (isDemo()) {
    local.insert('obra_financeiro', { descricao: `COMPRA: ${pedido.material}`, valor_pago: valor, cupom_url: cupomUrl });
    local.update('pedidos_materiais', pedido.id, { status: 'aprovado' });
    return { error: null };
  }

  // Tenta a função atômica do banco (supabase/setup.sql). Se não existir, faz o passo a passo.
  const rpc = await sb.rpc('finalizar_compra', { p_pedido_id: pedido.id, p_valor: valor, p_cupom_url: cupomUrl });
  if (!rpc.error) return { error: null };

  const { error: finError } = await sb
    .from('obra_financeiro')
    .insert([{ descricao: `COMPRA: ${pedido.material}`, valor_pago: valor, cupom_url: cupomUrl }]);
  if (finError) return { error: finError.message };
  const { error: pedError } = await sb.from('pedidos_materiais').update({ status: 'aprovado' }).eq('id', pedido.id);
  return { error: pedError?.message ?? null };
}

/* ---------------- Realtime ---------------- */
export interface RealtimeHandlers {
  onChatInsert?: (msg: ChatMessage) => void;
  onCronograma?: () => void;
  onPedidos?: () => void;
  onFinanceiro?: () => void;
  onDiario?: () => void;
  onHotspots?: () => void;
  onStatus?: (connected: boolean) => void;
}

export function subscribe(h: RealtimeHandlers): () => void {
  if (isDemo()) {
    h.onStatus?.(true);
    return local.onChange((table, payload) => {
      if (table === 'chat_mensagens' && payload.eventType === 'INSERT') h.onChatInsert?.(payload.new);
      else if (table === 'obra_cronograma') h.onCronograma?.();
      else if (table === 'pedidos_materiais') h.onPedidos?.();
      else if (table === 'obra_financeiro') h.onFinanceiro?.();
      else if (table === 'diario_obra') h.onDiario?.();
      else if (table === 'pontos_tecnicos') h.onHotspots?.();
    });
  }

  const channel = sb
    .channel('obra_realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_mensagens' }, (p) =>
      h.onChatInsert?.(p.new as ChatMessage)
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'obra_cronograma' }, () => h.onCronograma?.())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos_materiais' }, () => h.onPedidos?.())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'obra_financeiro' }, () => h.onFinanceiro?.())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'diario_obra' }, () => h.onDiario?.())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pontos_tecnicos' }, () => h.onHotspots?.())
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') h.onStatus?.(true);
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') h.onStatus?.(false);
    });

  return () => {
    channel.unsubscribe();
  };
}
