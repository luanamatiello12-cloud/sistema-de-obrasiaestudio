import { motion } from 'motion/react';
import { CheckCircle, Download, Package, Trash2 } from 'lucide-react';
import { EmptyState } from '../Skeleton';
import { can } from '../../lib/permissions';
import type { PedidoMaterial, UserState } from '../../types';

interface Props {
  user: UserState;
  pedidos: PedidoMaterial[];
  onNewPedido: () => void;
  onApprove: (pedido: PedidoMaterial) => void;
  onDelete: (id: number) => void;
  onNotify: (message: string, type?: 'info' | 'success' | 'warning') => void;
}

export default function Pedidos({ user, pedidos, onNewPedido, onApprove, onDelete, onNotify }: Props) {
  return (
    <motion.section
      key="pedidos"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-10"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-4xl md:text-5xl font-black uppercase italic">Materiais</h2>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              const { generateMateriaisReport } = await import('../../lib/reports');
              generateMateriaisReport(pedidos);
              onNotify('Relatório de Materiais gerado!', 'success');
            }}
            className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-white/10 transition-all"
          >
            <Download size={14} aria-hidden="true" /> Relatório
          </button>
          {can(user, 'request_material') && (
            <button
              onClick={onNewPedido}
              className="bg-[#ffb7c5] text-black px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition-all"
            >
              Solicitar
            </button>
          )}
        </div>
      </div>
      {pedidos.length === 0 && (
        <EmptyState
          icon={<Package size={44} />}
          title="Nenhum pedido de material"
          hint="As solicitações de material aparecerão aqui."
        />
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {pedidos.map((p) => (
          <div
            key={p.id}
            className={`bg-[#14161a] p-8 rounded-[2rem] border border-white/5 relative overflow-hidden transition-all hover:border-[#ffb7c5]/20 ${
              p.urgencia === 'critica'
                ? 'border-l-4 border-l-red-500'
                : p.urgencia === 'media'
                ? 'border-l-4 border-l-amber-500'
                : 'border-l-4 border-l-emerald-500'
            }`}
          >
            <p className="font-black text-white uppercase text-sm mb-1 tracking-tight">{p.material}</p>
            <p className="text-[10px] text-gray-500 uppercase font-black mb-6 tracking-widest">Qtd: {p.quantidade}</p>
            <div className="flex items-center justify-between mb-4">
              <span
                className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${
                  p.status === 'aprovado' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-400'
                }`}
              >
                {p.status}
              </span>
              <span className="text-[8px] text-gray-600 font-bold">{new Date(p.created_at).toLocaleDateString('pt-br')}</span>
            </div>

            {can(user, 'approve_purchase') && p.status === 'pendente' && (
              <div className="flex gap-2 pt-4 border-t border-white/5">
                <button
                  onClick={() => onApprove(p)}
                  aria-label={`Aprovar pedido de ${p.material}`}
                  className="flex-1 bg-emerald-500/10 text-emerald-500 p-2 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                >
                  <CheckCircle size={16} className="mx-auto" />
                </button>
                <button
                  onClick={() => onDelete(p.id)}
                  aria-label={`Excluir pedido de ${p.material}`}
                  className="flex-1 bg-red-500/10 text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={16} className="mx-auto" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.section>
  );
}
