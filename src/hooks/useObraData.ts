import { useEffect, useRef, useState } from 'react';
import { sb } from '../lib/supabase';
import type {
  ChatMessage,
  CronogramaItem,
  DiarioItem,
  FinanceiroItem,
  Hotspot,
  PedidoMaterial,
  UserState,
} from '../types';

interface Options {
  user: UserState | null;
  onNewChatMessage?: (msg: ChatMessage) => void;
  onError?: (message: string) => void;
}

/**
 * Carrega todos os dados da obra e mantém tudo atualizado via realtime.
 * Diferente da versão anterior, cada evento atualiza apenas a tabela afetada
 * (nada de recarregar as 6 tabelas a cada mudança).
 */
export function useObraData({ user, onNewChatMessage, onError }: Options) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cronograma, setCronograma] = useState<CronogramaItem[]>([]);
  const [financeiro, setFinanceiro] = useState<FinanceiroItem[]>([]);
  const [diario, setDiario] = useState<DiarioItem[]>([]);
  const [pedidos, setPedidos] = useState<PedidoMaterial[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  // Callbacks em refs para o canal realtime não precisar reinscrever a cada render
  const onNewChatRef = useRef(onNewChatMessage);
  const onErrorRef = useRef(onError);
  onNewChatRef.current = onNewChatMessage;
  onErrorRef.current = onError;

  // Evita spam de notificação quando o realtime fica tentando reconectar
  const realtimeErrorNotified = useRef(false);

  const reloadCronograma = async () => {
    const { data } = await sb.from('obra_cronograma').select('*').order('ordem', { ascending: true });
    if (data) setCronograma(data);
  };
  const reloadFinanceiro = async () => {
    const { data } = await sb.from('obra_financeiro').select('*').order('created_at', { ascending: false });
    if (data) setFinanceiro(data);
  };
  const reloadDiario = async () => {
    const { data } = await sb.from('diario_obra').select('*').order('created_at', { ascending: false });
    if (data) setDiario(data);
  };
  const reloadPedidos = async () => {
    const { data } = await sb.from('pedidos_materiais').select('*').order('created_at', { ascending: false });
    if (data) setPedidos(data);
  };
  const reloadHotspots = async () => {
    const { data } = await sb.from('pontos_tecnicos').select('*');
    if (data) setHotspots(data);
  };

  const loadAll = async () => {
    try {
      const [{ data: chatData, error: chatError }] = await Promise.all([
        sb.from('chat_mensagens').select('*').order('created_at', { ascending: true }),
        reloadCronograma(),
        reloadFinanceiro(),
        reloadDiario(),
        reloadPedidos(),
        reloadHotspots(),
      ]);
      if (chatError) console.error('Erro Chat:', chatError);
      if (chatData) setMessages(chatData);
    } catch {
      onErrorRef.current?.('Erro de conexão com o banco de dados');
    }
  };

  useEffect(() => {
    if (!user) return;
    loadAll();

    const channel = sb
      .channel('obra_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_mensagens' }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          const filtered = prev.filter(
            (m) =>
              !(
                m.isOptimistic &&
                m.autor === newMsg.autor &&
                (m.mensagem === newMsg.mensagem || m.midia_url === newMsg.midia_url)
              )
          );
          return [...filtered, newMsg];
        });
        onNewChatRef.current?.(newMsg);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'obra_cronograma' }, () => reloadCronograma())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos_materiais' }, () => reloadPedidos())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'obra_financeiro' }, () => reloadFinanceiro())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'diario_obra' }, () => reloadDiario())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pontos_tecnicos' }, () => reloadHotspots())
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && !realtimeErrorNotified.current) {
          realtimeErrorNotified.current = true;
          onErrorRef.current?.('Erro na conexão em tempo real');
        }
        if (status === 'SUBSCRIBED') {
          realtimeErrorNotified.current = false;
        }
      });

    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  return {
    messages,
    setMessages,
    cronograma,
    financeiro,
    diario,
    pedidos,
    hotspots,
    reloadCronograma,
    reloadFinanceiro,
    reloadDiario,
    reloadPedidos,
    reloadHotspots,
  };
}
