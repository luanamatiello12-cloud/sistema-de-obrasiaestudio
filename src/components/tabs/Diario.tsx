import { motion } from 'motion/react';
import type { DiarioItem, UserState } from '../../types';

interface Props {
  user: UserState;
  diario: DiarioItem[];
  onNewRelato: () => void;
}

export default function Diario({ user, diario, onNewRelato }: Props) {
  return (
    <motion.section
      key="diario"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-10"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-4xl md:text-5xl font-black uppercase italic">Diário</h2>
        {user.role === 'ADMIN' && (
          <button
            onClick={onNewRelato}
            className="bg-[#ffb7c5] text-black px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition-all"
          >
            Novo Relato
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {diario.map((item) => (
          <div
            key={item.id}
            className="bg-[#14161a] p-8 rounded-[2rem] border border-white/5 group hover:border-[#ffb7c5]/30 transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#ffb7c5]/10 flex items-center justify-center text-[#ffb7c5] font-black text-[10px]">
                {item.autor[0].toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] font-black text-[#ffb7c5] uppercase tracking-widest">{item.autor.split('@')[0]}</p>
                <p className="text-[9px] text-gray-500 uppercase font-bold">
                  {new Date(item.created_at).toLocaleDateString('pt-br')}
                </p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 text-sm leading-relaxed">{item.descricao}</p>
            {item.midia_url && (
              <img
                src={item.midia_url}
                alt={`Foto do relato de ${item.autor.split('@')[0]}`}
                className="w-full h-48 object-cover rounded-2xl border border-white/5"
              />
            )}
          </div>
        ))}
      </div>
    </motion.section>
  );
}
