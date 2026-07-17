import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, MessageSquare, Send, X } from 'lucide-react';
import { sendChatMessage } from '../lib/data';
import { uploadImage } from '../lib/upload';
import { uid } from '../utils';
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

export default function ChatWidget({ user, open, onToggle, messages, setMessages, unread, onNotify }: Props) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      return () => clearTimeout(t);
    }
  }, [messages, open]);

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('message') as HTMLInputElement;
    const val = input.value.trim();
    if (!val) return;

    const optimisticMsg: ChatMessage = {
      id: uid(),
      autor: user.email,
      mensagem: val,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    input.value = '';

    const { error } = await sendChatMessage({ autor: user.email, mensagem: val });
    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      onNotify('Erro ao enviar: ' + error, 'warning');
      input.value = val;
    }
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const { url, usedFallback } = await uploadImage(file, 'chat');
    if (usedFallback) {
      onNotify('Storage indisponível — foto enviada em modo compatível', 'warning');
    }

    const optimisticMsg: ChatMessage = {
      id: uid(),
      autor: user.email,
      midia_url: url,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const { error } = await sendChatMessage({ autor: user.email, midia_url: url });
    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      onNotify('Erro ao enviar foto', 'warning');
    }
  };

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
            className="absolute bottom-20 right-0 w-[90vw] md:w-[380px] h-[550px] bg-[#14161a] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-6 bg-[#ffb7c5] text-black">
              <h4 className="font-black uppercase text-xs tracking-widest">Canal de Obra</h4>
              <p className="text-[9px] font-bold opacity-60">Tempo Real Ativo</p>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-black/20">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 text-center p-10">
                  <MessageSquare size={40} className="mb-4 opacity-20" aria-hidden="true" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma mensagem ainda</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.autor === user.email;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <p className="text-[8px] font-black text-gray-500 uppercase mb-1 px-2">{msg.autor.split('@')[0]}</p>
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                        isMe ? 'bg-[#ffb7c5] text-black rounded-tr-none' : 'bg-white/5 text-white rounded-tl-none'
                      } ${msg.isOptimistic ? 'opacity-50' : 'opacity-100'}`}
                    >
                      {msg.midia_url ? (
                        <img src={msg.midia_url} className="rounded-lg max-w-full mb-1" alt={`Foto enviada por ${msg.autor.split('@')[0]}`} />
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
                placeholder="Sua mensagem..."
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
