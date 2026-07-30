import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bell, LogOut, X } from 'lucide-react';
import { uploadImage } from '../lib/upload';
import { parseBRL } from '../utils';
import type { CronogramaItem, PedidoMaterial, UserState } from '../types';

type Notify = (message: string, type?: 'info' | 'success' | 'warning') => void;

function Overlay({ children, z = 3000 }: { children: React.ReactNode; z?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ zIndex: z }}
      className="fixed inset-0 bg-black/95 flex items-center justify-center p-6"
    >
      {children}
    </motion.div>
  );
}

/* ---------- Confirmação (substitui window.confirm) ---------- */
export interface ConfirmState {
  title: string;
  message: string;
  onConfirm: () => void;
}

export function ConfirmModal({ confirm, onClose }: { confirm: ConfirmState; onClose: () => void }) {
  return (
    <Overlay z={7000}>
      <div className="bg-[#14161a] p-10 rounded-[2.5rem] max-w-sm w-full border border-white/5 text-center">
        <h3 className="text-xl font-black text-[#ffb7c5] uppercase mb-4 italic">{confirm.title}</h3>
        <p className="text-xs text-gray-400 mb-8">{confirm.message}</p>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 text-gray-500 font-black uppercase text-[10px] p-4">
            Cancelar
          </button>
          <button
            onClick={() => {
              confirm.onConfirm();
              onClose();
            }}
            className="flex-1 bg-red-500 text-white p-4 rounded-xl font-black uppercase text-[10px]"
          >
            Confirmar
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ---------- Perfil ---------- */
interface ProfileProps {
  user: UserState;
  onClose: () => void;
  onLogout: () => void;
  onAvatarChange: (base64: string) => void;
  onUpdatePassword: (newPassword: string) => Promise<void>;
  onRequestNotifications: () => void;
}

export function ProfileModal({ user, onClose, onLogout, onAvatarChange, onUpdatePassword, onRequestNotifications }: ProfileProps) {
  const [newPassword, setNewPassword] = useState('');

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onAvatarChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <Overlay z={4000}>
      <div className="bg-[#14161a] p-10 rounded-[2.5rem] max-w-sm w-full text-center border border-white/5">
        <img
          src={user.avatar || ''}
          alt="Seu avatar"
          className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-[#ffb7c5] object-cover"
        />
        <h3 className="font-black uppercase tracking-widest">{user.email.split('@')[0]}</h3>
        <p className="text-[10px] text-gray-500 mb-8">{user.email}</p>

        <div className="space-y-3">
          <input type="file" id="avatar-input" className="hidden" accept="image/*" onChange={handlePhoto} />
          <button
            onClick={() => document.getElementById('avatar-input')?.click()}
            className="w-full p-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            Alterar Foto
          </button>

          <div className="pt-6 border-t border-white/5 space-y-3">
            <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Segurança &amp; Alertas</p>

            <button
              onClick={onRequestNotifications}
              className="w-full p-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <Bell size={14} aria-hidden="true" /> Ativar Notificações
            </button>

            <input
              type="password"
              placeholder="NOVA SENHA"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-4 bg-white/5 rounded-2xl text-xs outline-none focus:ring-1 ring-[#ffb7c5]/30"
            />
            <button
              onClick={async () => {
                await onUpdatePassword(newPassword);
                setNewPassword('');
              }}
              className="w-full p-4 bg-[#ffb7c5]/10 text-[#ffb7c5] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#ffb7c5] hover:text-black transition-all"
            >
              Trocar Senha
            </button>
          </div>

          <button
            onClick={onLogout}
            className="w-full p-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
          >
            <LogOut size={14} className="inline mr-2" aria-hidden="true" /> Sair do Sistema
          </button>
        </div>
        <button onClick={onClose} className="mt-8 text-gray-500 text-[10px] font-black uppercase tracking-widest">
          Fechar
        </button>
      </div>
    </Overlay>
  );
}

/* ---------- Raio-X ---------- */
export function RaioXModal({ tit, url, onClose }: { tit: string; url: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/98 z-[6000] flex flex-col items-center justify-center p-6"
    >
      <button onClick={onClose} className="absolute top-10 right-10 text-[#ffb7c5] font-black flex items-center gap-2">
        FECHAR <X size={20} aria-hidden="true" />
      </button>
      <h3 className="text-2xl font-black text-[#ffb7c5] mb-8 italic uppercase tracking-tighter">{tit}</h3>
      <div className="relative max-w-4xl w-full">
        <img
          src={url}
          alt={`Foto interna de ${tit}`}
          className="w-full max-h-[70vh] object-cover rounded-[2rem] shadow-2xl border-2 border-[#ffb7c5]/20"
          onError={(e) => {
            const img = e.currentTarget;
            img.onerror = null;
            img.src = `data:image/svg+xml;utf8,${encodeURIComponent(
              `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'><rect width='800' height='500' fill='#14161a'/><text x='400' y='250' fill='#ffb7c5' font-family='Montserrat,sans-serif' font-size='26' font-weight='800' text-anchor='middle'>${tit}</text><text x='400' y='285' fill='rgba(255,255,255,.4)' font-family='Montserrat,sans-serif' font-size='12' text-anchor='middle' letter-spacing='3'>FOTO INDISPONÍVEL OFFLINE</text></svg>`
            )}`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-[2rem] pointer-events-none"></div>
      </div>
    </motion.div>
  );
}

/* ---------- Editar Cronograma ---------- */
export function CronoModal({
  item,
  onClose,
  onSave,
}: {
  item: CronogramaItem;
  onClose: () => void;
  onSave: (progresso: number) => Promise<void>;
}) {
  return (
    <Overlay z={5000}>
      <div className="bg-[#14161a] p-10 rounded-[2.5rem] max-w-sm w-full border border-white/5">
        <h3 className="text-xl font-black text-[#ffb7c5] uppercase mb-6 italic">Atualizar Etapa</h3>
        <p className="text-[10px] text-gray-500 uppercase font-black mb-8">{item.etapa}</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const val = parseInt((new FormData(e.currentTarget).get('progresso') as string) ?? '');
            if (isNaN(val) || val < 0 || val > 100) return;
            await onSave(val);
          }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 uppercase font-black">Progresso (%)</label>
            <input
              name="progresso"
              type="number"
              min="0"
              max="100"
              defaultValue={item.progresso}
              className="w-full p-5 bg-white/5 rounded-2xl outline-none text-2xl font-black text-[#ffb7c5] text-center"
            />
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 text-gray-500 font-black uppercase text-[10px]">
              Cancelar
            </button>
            <button type="submit" className="flex-1 bg-[#ffb7c5] text-black p-4 rounded-xl font-black uppercase text-[10px]">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}

/* ---------- Finalizar Compra ---------- */
export function CompraModal({
  pedido,
  onClose,
  onConfirm,
  onNotify,
}: {
  pedido: PedidoMaterial;
  onClose: () => void;
  onConfirm: (valor: number, cupomUrl: string) => Promise<void>;
  onNotify: Notify;
}) {
  const [cupomUrl, setCupomUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Overlay z={5000}>
      <div className="bg-[#14161a] p-10 rounded-[2.5rem] max-w-md w-full border border-white/5">
        <h3 className="text-xl font-black text-[#ffb7c5] uppercase mb-2 italic">Finalizar Compra</h3>
        <p className="text-[10px] text-gray-500 uppercase font-black mb-8">{pedido.material}</p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!cupomUrl) return;
            const raw = (new FormData(e.currentTarget).get('valor') as string) ?? '';
            const valor = parseBRL(raw);
            if (isNaN(valor) || valor <= 0) {
              onNotify('Valor inválido', 'warning');
              return;
            }
            setBusy(true);
            try {
              await onConfirm(valor, cupomUrl);
            } finally {
              setBusy(false);
            }
          }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 uppercase font-black">Valor Pago (R$)</label>
            <input
              name="valor"
              type="text"
              inputMode="decimal"
              required
              placeholder="1.500,00"
              className="w-full p-5 bg-white/5 rounded-2xl outline-none text-2xl font-black text-[#ffb7c5] text-center"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 uppercase font-black">Cupom Fiscal</label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const { url, usedFallback } = await uploadImage(file, 'cupons');
                if (usedFallback) onNotify('Storage indisponível — cupom salvo em modo compatível', 'warning');
                setCupomUrl(url);
              }}
              className="w-full p-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase text-gray-500"
            />
            {cupomUrl && <p className="text-[9px] text-emerald-500 font-black uppercase text-center">✓ Imagem carregada</p>}
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 text-gray-500 font-black uppercase text-[10px]">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 bg-[#ffb7c5] text-black p-4 rounded-xl font-black uppercase text-[10px] disabled:opacity-50"
            >
              {busy ? 'Salvando...' : 'Confirmar & Lançar'}
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}

/* ---------- Novo Relato (Diário) — agora com foto ---------- */
export function DiarioModal({
  onClose,
  onPublish,
  onNotify,
}: {
  onClose: () => void;
  onPublish: (texto: string, midiaUrl: string | null) => Promise<void>;
  onNotify: Notify;
}) {
  const [midiaUrl, setMidiaUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Overlay>
      <div className="bg-[#14161a] p-10 rounded-[2.5rem] max-w-lg w-full border border-white/5">
        <h3 className="text-2xl font-black mb-6 text-[#ffb7c5] italic uppercase tracking-tighter">Novo Relato</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const texto = ((new FormData(e.currentTarget).get('texto') as string) ?? '').trim();
            if (!texto) return;
            setBusy(true);
            try {
              await onPublish(texto, midiaUrl);
            } finally {
              setBusy(false);
            }
          }}
        >
          <textarea
            name="texto"
            required
            className="w-full h-44 bg-white/5 rounded-2xl p-5 mb-4 outline-none text-white text-sm"
            placeholder="O que foi feito hoje?"
          ></textarea>
          <div className="mb-4 space-y-2">
            <label className="text-[10px] text-gray-400 uppercase font-black">Foto (opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const { url, usedFallback } = await uploadImage(file, 'diario');
                if (usedFallback) onNotify('Storage indisponível — foto salva em modo compatível', 'warning');
                setMidiaUrl(url);
              }}
              className="w-full p-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase text-gray-500"
            />
            {midiaUrl && <p className="text-[9px] text-emerald-500 font-black uppercase text-center">✓ Foto anexada</p>}
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 text-gray-500 font-black uppercase text-[12px]">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 bg-[#ffb7c5] text-black p-5 rounded-2xl font-black uppercase text-xs disabled:opacity-50"
            >
              {busy ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}

/* ---------- Solicitar Material ---------- */
export function PedidoModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (material: string, quantidade: string, urgencia: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Overlay>
      <div className="bg-[#14161a] p-10 rounded-[2.5rem] max-w-lg w-full border border-white/5">
        <h3 className="text-2xl font-black mb-6 text-[#ffb7c5] italic uppercase tracking-tighter">Solicitar Material</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setBusy(true);
            try {
              await onSubmit(
                (fd.get('material') as string) ?? '',
                (fd.get('qtd') as string) ?? '',
                (fd.get('urgencia') as string) ?? 'planeada'
              );
            } finally {
              setBusy(false);
            }
          }}
          className="space-y-4"
        >
          <input name="material" placeholder="NOME DO MATERIAL" required className="w-full p-5 bg-white/5 rounded-2xl outline-none text-xs font-bold" />
          <input name="qtd" placeholder="QUANTIDADE" required className="w-full p-5 bg-white/5 rounded-2xl outline-none text-xs font-bold" />
          <select name="urgencia" className="w-full p-5 bg-white/5 rounded-2xl outline-none text-xs font-bold text-gray-400">
            <option value="planeada">PLANEADA</option>
            <option value="media">MÉDIA</option>
            <option value="critica">CRÍTICA</option>
          </select>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 text-gray-500 font-black uppercase text-[12px]">
              Cancelar
            </button>
            <button type="submit" disabled={busy} className="flex-1 bg-[#ffb7c5] text-black p-5 rounded-2xl font-black uppercase text-xs disabled:opacity-50">
              {busy ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}

/* ---------- Novo Ponto Raio-X (Hotspot) ---------- */
export function HotspotModal({
  pos,
  onClose,
  onSubmit,
  onNotify,
}: {
  pos: { x: number; y: number };
  onClose: () => void;
  onSubmit: (nome: string, fotoUrl: string) => Promise<void>;
  onNotify: Notify;
}) {
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Overlay z={5000}>
      <div className="bg-[#14161a] p-10 rounded-[2.5rem] max-w-md w-full border border-white/5">
        <h3 className="text-xl font-black text-[#ffb7c5] uppercase mb-2 italic">Novo Ponto Raio-X</h3>
        <p className="text-[10px] text-gray-500 uppercase font-black mb-8">
          Posição: {pos.x.toFixed(1)}% × {pos.y.toFixed(1)}%
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const nome = ((new FormData(e.currentTarget).get('nome') as string) ?? '').trim();
            if (!nome || !fotoUrl) return;
            setBusy(true);
            try {
              await onSubmit(nome, fotoUrl);
            } finally {
              setBusy(false);
            }
          }}
          className="space-y-4"
        >
          <input name="nome" placeholder="NOME DO CÔMODO" required className="w-full p-5 bg-white/5 rounded-2xl outline-none text-xs font-bold" />
          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 uppercase font-black">Foto Interna</label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const { url, usedFallback } = await uploadImage(file, 'hotspots');
                if (usedFallback) onNotify('Storage indisponível — foto salva em modo compatível', 'warning');
                setFotoUrl(url);
              }}
              className="w-full p-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase text-gray-500"
            />
            {fotoUrl && <p className="text-[9px] text-emerald-500 font-black uppercase text-center">✓ Foto carregada</p>}
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 text-gray-500 font-black uppercase text-[10px]">
              Cancelar
            </button>
            <button type="submit" disabled={busy} className="flex-1 bg-[#ffb7c5] text-black p-4 rounded-xl font-black uppercase text-[10px] disabled:opacity-50">
              {busy ? 'Salvando...' : 'Criar Ponto'}
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}
