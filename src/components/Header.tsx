import { Camera, DollarSign, FileText, Package } from 'lucide-react';
import type { UserState } from '../types';

export const TABS = [
  { id: 'projeto3d', label: 'PROJETO', icon: Camera },
  { id: 'financeiro', label: 'FINANCEIRO', icon: DollarSign },
  { id: 'diario', label: 'DIÁRIO', icon: FileText },
  { id: 'pedidos', label: 'MATERIAIS', icon: Package },
] as const;

interface Props {
  user: UserState;
  activeTab: string;
  onTabChange: (id: string) => void;
  onOpenProfile: () => void;
}

export default function Header({ user, activeTab, onTabChange, onOpenProfile }: Props) {
  return (
    <>
      <header className="sticky top-0 bg-[#0a0b0d] px-6 md:px-10 py-6 flex justify-between items-center border-b border-white/5 z-[100]">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-black italic">
            GP<span className="text-[#ffb7c5]">:OBRA</span>
          </h1>
          {user.demo && (
            <span className="text-[8px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full font-black uppercase tracking-widest border border-amber-500/30">
              Modo Demo
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[12px] font-bold uppercase">{user.email.split('@')[0]}</p>
            <p className="text-[9px] text-[#ffb7c5] font-black uppercase tracking-widest">{user.role} ACCESS</p>
          </div>
          <button onClick={onOpenProfile} className="relative" aria-label="Abrir perfil">
            <img
              src={user.avatar || ''}
              alt={`Avatar de ${user.email.split('@')[0]}`}
              className="w-10 h-10 rounded-full border-2 border-[#ffb7c5] object-cover"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0a0b0d] rounded-full"></div>
          </button>
        </div>
      </header>

      <nav className="hidden md:flex justify-center gap-10 py-4 border-b border-white/5" aria-label="Navegação principal">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex items-center gap-2 text-[11px] font-black tracking-widest transition-all ${
              activeTab === item.id ? 'text-[#ffb7c5]' : 'text-gray-500 hover:text-white'
            }`}
          >
            <item.icon size={14} aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </nav>
    </>
  );
}
