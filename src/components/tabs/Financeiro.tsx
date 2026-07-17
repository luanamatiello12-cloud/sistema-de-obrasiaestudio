import { motion } from 'motion/react';
import { Download, DollarSign } from 'lucide-react';
import { EmptyState } from '../Skeleton';
import { formatBRL } from '../../utils';
import type { FinanceiroItem } from '../../types';

interface Props {
  financeiro: FinanceiroItem[];
  onNotify: (message: string, type?: 'info' | 'success' | 'warning') => void;
}

export default function Financeiro({ financeiro, onNotify }: Props) {
  const total = financeiro.reduce((acc, curr) => acc + curr.valor_pago, 0);

  return (
    <motion.section
      key="financeiro"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-10"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-4xl md:text-5xl font-black uppercase italic">Financeiro</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={async () => {
              const { generateFinanceiroReport } = await import('../../lib/reports');
              generateFinanceiroReport(financeiro);
              onNotify('Relatório Financeiro gerado!', 'success');
            }}
            className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-white/10 transition-all"
          >
            <Download size={14} aria-hidden="true" /> Relatório
          </button>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Investimento Total</p>
            <p className="text-3xl md:text-4xl font-black text-[#ffb7c5] italic">R$ {formatBRL(total)}</p>
          </div>
        </div>
      </div>
      {financeiro.length === 0 ? (
        <EmptyState
          icon={<DollarSign size={44} />}
          title="Nenhum lançamento ainda"
          hint="Os lançamentos financeiros da obra aparecerão aqui."
        />
      ) : (
      <div className="bg-[#14161a] rounded-[2.5rem] overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="p-6">Data</th>
                <th className="p-6">Descrição</th>
                <th className="p-6">Valor</th>
                <th className="p-6">Anexo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {financeiro.map((f) => (
                <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-6 text-xs text-gray-500">{new Date(f.created_at).toLocaleDateString('pt-br')}</td>
                  <td className="p-6 text-xs font-bold uppercase tracking-wider">{f.descricao}</td>
                  <td className="p-6 text-[#ffb7c5] font-black">R$ {formatBRL(f.valor_pago)}</td>
                  <td className="p-6">
                    <a
                      href={f.cupom_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[9px] bg-white/5 px-3 py-2 rounded-lg font-black hover:bg-white/10 transition-all"
                    >
                      VER COMPROVANTE
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </motion.section>
  );
}
