import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Lock, MessageSquare, Send, Users, X } from 'lucide-react';
import { sendChatMessage } from '../lib/data';
import { uploadImage } from '../lib/upload';
import { uid } from '../utils';
import { nomeDe, outros } from '../lib/participants';
import type { ChatMessage, UserState } from '../types';

interface Props {
  user: UserState;
  open: boolean;
  onToggle: () => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  unread: number;
  onNotify: (message: string, type?: 'info' | 'success' | 'warning') => void;
}

// `null` = canal geral; caso contrário, e-mail do outro participante (conversa privada)
type Thread = string | null;

export default function ChatWidget({ user, open, onToggle, messages, setMessages, unread, onNotify }: Props) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [thread, setThread] = useState<Thread>(null);

  const contatos = useMemo(() => outros(user.email), [user.email]);

  // Mensagens da conversa aberta: geral (sem `para`) ou privada (entre eu e o contato).
  const visibleMessages = useMemo(() => {
    if (thread === null) return messages.filter((m) => !m.para);
    return messages.filter(
      (m) =>
        (m.autor === user.email && m.para === thread) ||
        (m.autor === thread && m.para === user.email)
    );
  }, [messages, thread, user.email]);

  // Contagem de não lidas por conversa privada (indicador no seletor).
  const unreadByContact = useMemo(() => {
    const map: Record<string, number> = {};
    messages.forEach((m) => {
      if (m.para === user.email && m.autor !== user.email && !m.isOptimistic) {
        map[m.autor] = (map[m.autor] ?? 0) + 1;
      }
    });
    return map;
  }, [messages, user.email]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      return () => clearTimeout(t);
    }
  }, [visibleMessages, open]);

  const insertOptimistic = (partial: Partial<ChatMessage>): ChatMessage => {
    const msg: ChatMessage = {
      id: uid(),
      autor: user.email,
      para: thread,
      created_at: new Date().toISOString(),
      isOptimistic: true,
      ...partial,
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('message') as HTMLInputElement;
    const val = input.value.trim();
    if (!val) return;

    const optimistic = insertOptimistic({ mensagem: val });
    input.value = '';

    const { error } = await sendChatMessage({ autor: user.email, para: thread, mensagem: val });
    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      onNotify('Erro ao enviar: ' + error, 'warning');
      input.value = val;
    }
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const { url, usedFallback } = await uploadImage(file, 'chat');
    if (usedFallback) onNotify('Storage indisponível — foto enviada em modo compatível', 'warning');

    const optimistic = insertOptimistic({ midia_url: url });
    const { error } = await sendChatMessage({ autor: user.email, para: thread, midia_url: url });
    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      onNotify('Erro ao enviar foto', 'warning');
    }
  };

  const tituloAtual = thread === null ? 'Canal Geral' : nomeDe(thread);

  return (
    <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[110]">
      <button
        onClick={onToggle}
        aria-label={open ? 'Fechar chat' : 'Abrir chat'}
        className="w-16 h-16 bg-[#ffb7c5] rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all relative"
      >
        {open ? <X size={28} className="text-black" /> : <MessageSquare size={28} className="text-black" />}
        {!open && unread > 0 && (
          <span className="absolute -top-2 -right-2 min-w-6 h-6 px-1.5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0a0b0d]">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-[90vw] md:w-[380px] h-[580px] bg-[#14161a] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-5 bg-[#ffb7c5] text-black">
              <h4 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
                {thread === null ? <Users size={13} /> : <Lock size={13} />}
                {tituloAtual}
              </h4>
              <p className="text-[9px] font-bold opacity-60">
                {thread === null ? 'Todos os participantes' : 'Conversa privada'}
              </p>
            </div>

            {/* Seletor de conversas */}
            <div className="flex gap-2 p-3 bg-black/30 overflow-x-auto border-b border-white/5">
              <button
                onClick={() => setThread(null)}
                className={`shrink-0 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                  thread === null ? 'bg-[#ffb7c5] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Users size={12} /> Geral
              </button>
              {contatos.map((c) => (
                <button
                  key={c.email}
                  onClick={() => setThread(c.email)}
                  className={`relative shrink-0 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                    thread === c.email ? 'bg-[#ffb7c5] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Lock size={11} /> {c.nome}
                  {thread !== c.email && unreadByContact[c.email] > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                      {unreadByContact[c.email]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-black/20">
              {visibleMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 text-center p-10">
                  {thread === null ? <Users size={38} className="mb-4 opacity-20" /> : <Lock size={38} className="mb-4 opacity-20" />}
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    {thread === null ? 'Nenhuma mensagem ainda' : `Converse em privado com ${nomeDe(thread)}`}
                  </p>
                </div>
              )}
              {visibleMessages.map((msg) => {
                const isMe = msg.autor === user.email;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <p className="text-[8px] font-black text-gray-500 uppercase mb-1 px-2">{nomeDe(msg.autor)}</p>
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                        isMe ? 'bg-[#ffb7c5] text-black rounded-tr-none' : 'bg-white/5 text-white rounded-tl-none'
                      } ${msg.isOptimistic ? 'opacity-50' : 'opacity-100'}`}
                    >
                      {msg.midia_url ? (
                        <img src={msg.midia_url} className="rounded-lg max-w-full mb-1" alt={`Foto de ${nomeDe(msg.autor)}`} />
                      ) : (
                        msg.mensagem
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-white/5 flex gap-3">
              <input type="file" id="chat-photo-input" className="hidden" accept="image/*" onChange={handlePhoto} />
              <button
                type="button"
                onClick={() => document.getElementById('chat-photo-input')?.click()}
                aria-label="Enviar foto"
                className="text-gray-500 hover:text-[#ffb7c5] transition-all"
              >
                <Camera size={18} />
              </button>
              <input
                name="message"
                autoComplete="off"
                placeholder={thread === null ? 'Mensagem para todos...' : `Privado para ${nomeDe(thread)}...`}
                aria-label="Mensagem"
                className="flex-1 bg-transparent outline-none text-xs font-medium"
              />
              <button type="submit" aria-label="Enviar mensagem" className="text-[#ffb7c5] p-2 hover:scale-110 transition-all">
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
