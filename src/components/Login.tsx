import React, { useState } from 'react';
import { motion } from 'motion/react';
import { login, resetPassword } from '../lib/auth';
import type { UserState } from '../types';

interface Props {
  onLogin: (user: UserState, demo: boolean) => void;
  onNotify: (message: string, type?: 'info' | 'success' | 'warning') => void;
}

export default function Login({ onLogin, onNotify }: Props) {
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const password = String(form.get('password') ?? '');
    if (!email || password.length < 3) return;

    setBusy(true);
    try {
      const { user, demo } = await login(email, password);
      onLogin(user, demo);
    } finally {
      setBusy(false);
    }
  };

  const quickLogin = async (email: string) => {
    setBusy(true);
    try {
      const { user, demo } = await login(email, 'demo123');
      onLogin(user, demo);
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const form = e.currentTarget.closest('form');
    const email = (form?.elements.namedItem('email') as HTMLInputElement | null)?.value.trim();
    if (!email) {
      onNotify('Preencha o e-mail acima e clique novamente', 'warning');
      return;
    }
    const err = await resetPassword(email);
    if (err) onNotify('Erro: ' + err, 'warning');
    else onNotify('E-mail de recuperação enviado!', 'success');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[2000] flex items-center justify-center p-6"
    >
      <div className="bg-[#14161a] p-10 md:p-12 rounded-[2.5rem] max-w-md w-full text-center border border-white/5 shadow-2xl">
        <h1 className="text-4xl font-black mb-2 italic tracking-tighter">
          GP<span className="text-[#ffb7c5]">:OBRA</span>
        </h1>
        <p className="text-[10px] text-gray-500 uppercase tracking-[0.6em] mb-12">Command Center</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="E-MAIL"
            required
            autoComplete="email"
            className="w-full p-5 rounded-2xl bg-white/5 border-none text-center font-bold outline-none focus:ring-2 ring-[#ffb7c5]/30 transition-all"
          />
          <input
            name="password"
            type="password"
            placeholder="SENHA"
            required
            autoComplete="current-password"
            className="w-full p-5 rounded-2xl bg-white/5 border-none text-center outline-none focus:ring-2 ring-[#ffb7c5]/30 transition-all"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#ffb7c5] text-black font-black uppercase p-5 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {busy ? 'Entrando...' : 'Acessar Painel'}
          </button>
          <button
            type="button"
            onClick={handleForgot}
            className="text-[10px] text-[#ffb7c5] uppercase font-black tracking-widest hover:underline mt-4"
          >
            Esqueci minha senha
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-white/5">
          <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-3">Acesso de demonstração</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => quickLogin('eng.ricardo@gpobra.com')}
              className="p-3 bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-300 hover:bg-white/10 transition-all leading-tight"
            >
              Engenheiro
            </button>
            <button
              type="button"
              onClick={() => quickLogin('mestre.jose@gpobra.com')}
              className="p-3 bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-300 hover:bg-white/10 transition-all leading-tight"
            >
              Mestre
            </button>
            <button
              type="button"
              onClick={() => quickLogin('cliente@gpobra.com')}
              className="p-3 bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-300 hover:bg-white/10 transition-all leading-tight"
            >
              Cliente
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
