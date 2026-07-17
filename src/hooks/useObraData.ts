import { useEffect, useRef, useState } from 'react';
import * as data from '../lib/data';
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
 * Cada evento atualiza apenas a tabela afetada (nada de recarregar tudo).
 */
export function useObraData({ user, onNewChatMessage, onError }: Options) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cronograma, setCronograma] = useState<CronogramaItem[]>([]);
  const [financeiro, setFinanceiro] = useState<FinanceiroItem[]>([]);
  const [diario, setDiario] = useState<DiarioItem[]>([]);
  const [pedidos, setPedidos] = useState<PedidoMaterial[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);

  const onNewChatRef = useRef(onNewChatMessage);
  const onErrorRef = useRef(onError);
  onNewChatRef.current = onNewChatMessage;
  onErrorRef.current = onError;
  const realtimeErrorNotified = useRef(false);

  const reloadCronograma = async () => setCronograma(await data.listCronograma());
  const reloadFinanceiro = async () => setFinanceiro(await data.listFinanceiro());
  const reloadDiario = async () => setDiario(await data.listDiario());
  const reloadPedidos = async () => setPedidos(await data.listPedidos());
  const reloadHotspots = async () => setHotspots(await data.listHotspots());

  useEffect(() => {
    if (!user) return;
    let active = true;

    (async () => {
      setLoading(true);
      try {
        const [chat, crono, fin, dia, ped, hot] = await Promise.all([
          data.listChat(),
          data.listCronograma(),
          data.listFinanceiro(),
          data.listDiario(),
          data.listPedidos(),
          data.listHotspots(),
        ]);
        if (!active) return;
        setMessages(chat);
        setCronograma(crono);
        setFinanceiro(fin);
        setDiario(dia);
        setPedidos(ped);
        setHotspots(hot);
      } catch {
        onErrorRef.current?.('Erro de conexão com o banco de dados');
      } finally {
        if (active) setLoading(false);
      }
    })();

    const unsubscribe = data.subscribe({
      onChatInsert: (newMsg) => {
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
      },
      onCronograma: reloadCronograma,
      onPedidos: reloadPedidos,
      onFinanceiro: reloadFinanceiro,
      onDiario: reloadDiario,
      onHotspots: reloadHotspots,
      onStatus: (connected) => {
        if (!connected && !realtimeErrorNotified.current) {
          realtimeErrorNotified.current = true;
          onErrorRef.current?.('Erro na conexão em tempo real');
        }
        if (connected) realtimeErrorNotified.current = false;
      },
    });

    return () => {
      active = false;
      unsubscribe();
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
    loading,
    reloadCronograma,
    reloadFinanceiro,
    reloadDiario,
    reloadPedidos,
    reloadHotspots,
  };
}
