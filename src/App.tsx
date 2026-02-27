import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  MessageSquare, 
  DollarSign, 
  Calendar, 
  Package, 
  Camera, 
  X, 
  Send, 
  LogOut, 
  User, 
  Plus, 
  FileText,
  Bell,
  ChevronRight,
  Menu,
  Trash2,
  CheckCircle,
  Download
} from 'lucide-react';
import type { 
  UserState, 
  ChatMessage, 
  CronogramaItem, 
  FinanceiroItem, 
  DiarioItem, 
  PedidoMaterial, 
  Hotspot,
  Notification 
} from './types';

const SUPA_URL = "https://exvsnqybuvkabavwyrsu.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4dnNucXlidXZrYWJhdnd5cnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4OTg0MDEsImV4cCI6MjA4NjQ3NDQwMX0.LQX2wS5XyAj1GAZmDqR4uXtVDu36nMcGGy2RKtpkJ5c";
const sb = createClient(SUPA_URL, SUPA_KEY);

export default function App() {
  const [user, setUser] = useState<UserState | null>(null);
  const [activeTab, setActiveTab] = useState('projeto3d');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cronograma, setCronograma] = useState<CronogramaItem[]>([]);
  const [financeiro, setFinanceiro] = useState<FinanceiroItem[]>([]);
  const [diario, setDiario] = useState<DiarioItem[]>([]);
  const [pedidos, setPedidos] = useState<PedidoMaterial[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [layers, setLayers] = useState({ hidraulica: false, eletrica: false, clima: false });
  
  // Modals
  const [showLogin, setShowLogin] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showDiarioModal, setShowDiarioModal] = useState(false);
  const [showPedidoModal, setShowPedidoModal] = useState(false);
  const [showRaioX, setShowRaioX] = useState<{tit: string, url: string} | null>(null);
  const [editingCrono, setEditingCrono] = useState<CronogramaItem | null>(null);
  const [approvingPedido, setApprovingPedido] = useState<PedidoMaterial | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [cupomBase64, setCupomBase64] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Função para tocar som de alerta usando Web Audio API
  const playAlertSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // Nota A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1); // Desce para A4

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.error("Erro ao tocar som:", e);
    }
  };

  // Solicitar permissão para notificações do navegador
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    const session = localStorage.getItem('gp_obra_session');
    if (session) {
      const userData = JSON.parse(session);
      setUser(userData);
      setShowLogin(false);
      requestNotificationPermission();
    }
  }, []);

  useEffect(() => {
    let channel: any;
    if (user) {
      loadAllData();
      channel = subscribeRealtime();
    }
    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, chatOpen]);

  const addNotification = (message: string, type: Notification['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Tocar som
    playAlertSound();

    // Notificação do Navegador (Push)
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("GP OBRA", {
        body: message,
        tag: 'gp-obra-alert'
      });
    }

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const loadAllData = async () => {
    try {
      const [
        { data: chatData, error: chatError },
        { data: cronoData, error: cronoError },
        { data: finData, error: finError },
        { data: diaData, error: diaError },
        { data: pedData, error: pedError },
        { data: hotData, error: hotError }
      ] = await Promise.all([
        sb.from('chat_mensagens').select('*').order('created_at', { ascending: true }),
        sb.from('obra_cronograma').select('*').order('ordem', { ascending: true }),
        sb.from('obra_financeiro').select('*').order('created_at', { ascending: false }),
        sb.from('diario_obra').select('*').order('created_at', { ascending: false }),
        sb.from('pedidos_materiais').select('*').order('created_at', { ascending: false }),
        sb.from('pontos_tecnicos').select('*')
      ]);

      if (chatError) console.error("Erro Chat:", chatError);
      if (chatData) setMessages(chatData);
      if (cronoData) setCronograma(cronoData);
      if (finData) setFinanceiro(finData);
      if (diaData) setDiario(diaData);
      if (pedData) setPedidos(pedData);
      if (hotData) setHotspots(hotData);
    } catch (err: any) {
      addNotification("Erro de conexão com o banco de dados", 'warning');
    }
  };

  const subscribeRealtime = () => {
    const channel = sb.channel('chat_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_mensagens' }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        
        setMessages(prev => {
          // Se já temos essa mensagem pelo ID real, não faz nada
          if (prev.some(m => m.id === newMsg.id)) return prev;

          // Remove mensagens otimistas que coincidam com o autor e conteúdo da nova mensagem
          const filtered = prev.filter(m => 
            !(m.isOptimistic && m.autor === newMsg.autor && (m.mensagem === newMsg.mensagem || m.midia_url === newMsg.midia_url))
          );
          
          return [...filtered, newMsg];
        });

        if (newMsg.autor !== user?.email) {
          addNotification(`Nova mensagem de ${newMsg.autor.split('@')[0]}`, 'info');
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'obra_cronograma' }, () => loadAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos_materiais' }, () => loadAllData())
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          addNotification("Erro na conexão em tempo real", 'warning');
        }
      });
    
    return channel;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const email = (e.target as any).email.value.trim().toLowerCase();
    const pass = (e.target as any).password.value;
    
    if (pass.length >= 3) {
      const userData: UserState = {
        email,
        role: (email.includes('eng') || email.includes('mestre')) ? 'ADMIN' : 'CLIENTE',
        avatar: `https://ui-avatars.com/api/?background=ffb7c5&color=000&name=${email[0]}`
      };
      setUser(userData);
      localStorage.setItem('gp_obra_session', JSON.stringify(userData));
      setShowLogin(false);
      addNotification(`Bem-vindo, ${email.split('@')[0]}!`, 'success');
      
      // Solicitar permissão de notificação após login
      requestNotificationPermission();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gp_obra_session');
    setUser(null);
    setShowLogin(true);
  };

  const handleForgotPassword = async () => {
    const email = prompt("Digite seu e-mail para recuperação:");
    if (email) {
      const { error } = await sb.auth.resetPasswordForEmail(email);
      if (error) {
        addNotification("Erro: " + error.message, 'warning');
      } else {
        addNotification("E-mail de recuperação enviado!", 'success');
      }
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      addNotification("A senha deve ter no mínimo 6 caracteres.", 'warning');
      return;
    }
    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (error) {
      addNotification("Erro ao atualizar senha: " + error.message, 'warning');
    } else {
      addNotification("Senha atualizada com sucesso!", 'success');
      setNewPassword('');
    }
  };

  const handleUpdateCronograma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCrono) return;
    const val = (e.target as any).progresso.value;
    const { error } = await sb.from('obra_cronograma').update({ progresso: parseInt(val) }).eq('id', editingCrono.id);
    if (error) {
      addNotification("Erro ao atualizar cronograma: " + error.message, 'warning');
    } else {
      addNotification("Cronograma atualizado!", 'success');
      setEditingCrono(null);
      loadAllData();
    }
  };

  const generateFinanceiroReport = () => {
    const doc = new jsPDF();
    doc.text("RELATÓRIO FINANCEIRO - GP OBRA", 14, 15);
    const tableData = financeiro.map(f => [
      new Date(f.created_at).toLocaleDateString(),
      f.descricao,
      `R$ ${f.valor_pago.toLocaleString('pt-br')}`
    ]);
    autoTable(doc, {
      head: [['Data', 'Descrição', 'Valor']],
      body: tableData,
      startY: 25,
      theme: 'striped',
      headStyles: { fillColor: [255, 183, 197], textColor: [0, 0, 0] }
    });
    doc.save('Financeiro_Obra.pdf');
    addNotification("Relatório Financeiro gerado!", 'success');
  };

  const generateMateriaisReport = () => {
    const doc = new jsPDF();
    doc.text("RELATÓRIO DE MATERIAIS - GP OBRA", 14, 15);
    const tableData = pedidos.map(p => [
      new Date(p.created_at).toLocaleDateString(),
      p.material,
      p.quantidade,
      p.urgencia.toUpperCase(),
      p.status.toUpperCase()
    ]);
    autoTable(doc, {
      head: [['Data', 'Material', 'Qtd', 'Urgência', 'Status']],
      body: tableData,
      startY: 25,
      theme: 'striped',
      headStyles: { fillColor: [255, 183, 197], textColor: [0, 0, 0] }
    });
    doc.save('Materiais_Obra.pdf');
    addNotification("Relatório de Materiais gerado!", 'success');
  };

  const handleDeletePedido = async (id: number) => {
    if (!confirm("Deseja realmente excluir este pedido?")) return;
    const { error } = await sb.from('pedidos_materiais').delete().eq('id', id);
    if (error) {
      addNotification("Erro ao excluir pedido: " + error.message, 'warning');
    } else {
      addNotification("Pedido excluído!", 'success');
      loadAllData();
    }
  };

  const handleDeleteHotspot = async (id: number) => {
    if (!confirm("Deseja realmente excluir este ponto de Raio-X?")) return;
    const { error } = await sb.from('pontos_tecnicos').delete().eq('id', id);
    if (error) {
      addNotification("Erro ao excluir ponto: " + error.message, 'warning');
    } else {
      addNotification("Ponto de Raio-X excluído!", 'success');
      loadAllData();
    }
  };

  const handleFinalizarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingPedido || !cupomBase64) return;
    const valor = parseFloat((e.target as any).valor.value);
    if (isNaN(valor)) return;

    const { error: pedError } = await sb.from('pedidos_materiais').update({ status: 'aprovado' }).eq('id', approvingPedido.id);
    const { error: finError } = await sb.from('obra_financeiro').insert([{
      descricao: `COMPRA: ${approvingPedido.material}`,
      valor_pago: valor,
      cupom_url: cupomBase64
    }]);

    if (pedError || finError) {
      addNotification("Erro ao finalizar compra.", 'warning');
    } else {
      addNotification("Compra finalizada e lançada no financeiro!", 'success');
      setApprovingPedido(null);
      setCupomBase64(null);
      loadAllData();
    }
  };

  const handleChatPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      
      // Mensagem otimista com foto
      const optimisticMsg: ChatMessage = {
        id: Math.random(),
        autor: user.email,
        midia_url: base64,
        created_at: new Date().toISOString(),
        isOptimistic: true
      };
      
      setMessages(prev => [...prev, optimisticMsg]);

      const { error } = await sb.from('chat_mensagens').insert([{
        autor: user.email,
        midia_url: base64
      }]);

      if (error) {
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        addNotification("Erro ao enviar foto", 'warning');
      }
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.message as HTMLInputElement;
    const val = input.value.trim();
    if (!val || !user) return;

    // Criar mensagem otimista para aparecer instantaneamente
    const optimisticMsg: ChatMessage = {
      id: Math.random(), // ID temporário
      autor: user.email,
      mensagem: val,
      created_at: new Date().toISOString(),
      isOptimistic: true
    };

    // Adicionar localmente primeiro
    setMessages(prev => [...prev, optimisticMsg]);
    input.value = ''; // Limpar campo imediatamente

    const { error } = await sb.from('chat_mensagens').insert([{
      autor: user.email,
      mensagem: val
    }]);

    if (error) {
      // Se falhar, remove a mensagem otimista e avisa
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      addNotification("Erro ao enviar: " + error.message, 'warning');
      input.value = val; // Devolve o texto ao campo
    }
  };

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const isAnyLayerActive = layers.hidraulica || layers.eletrica || layers.clima;

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white font-['Montserrat'] overflow-x-hidden pb-20 md:pb-0">
      {/* Notifications System */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`p-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl min-w-[250px] pointer-events-auto flex items-center gap-3 ${
                n.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                n.type === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                'bg-pink-300/20 text-pink-300'
              }`}
            >
              <Bell size={18} />
              <span className="text-xs font-black uppercase tracking-wider">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Login Overlay */}
      <AnimatePresence>
        {showLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[2000] flex items-center justify-center p-6"
          >
            <div className="bg-[#14161a] p-10 md:p-12 rounded-[2.5rem] max-w-md w-full text-center border border-white/5 shadow-2xl">
              <h1 className="text-4xl font-black mb-2 italic tracking-tighter">GP<span className="text-[#ffb7c5]">:OBRA</span></h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.6em] mb-12">Command Center</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <input 
                  name="email"
                  type="email" 
                  placeholder="E-MAIL" 
                  required
                  className="w-full p-5 rounded-2xl bg-white/5 border-none text-center font-bold outline-none focus:ring-2 ring-[#ffb7c5]/30 transition-all"
                />
                <input 
                  name="password"
                  type="password" 
                  placeholder="SENHA" 
                  required
                  className="w-full p-5 rounded-2xl bg-white/5 border-none text-center outline-none focus:ring-2 ring-[#ffb7c5]/30 transition-all"
                />
                <button type="submit" className="w-full bg-[#ffb7c5] text-black font-black uppercase p-5 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                  Acessar Painel
                </button>
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] text-[#ffb7c5] uppercase font-black tracking-widest hover:underline mt-4"
                >
                  Esqueci minha senha
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {!showLogin && user && (
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <header className="sticky top-0 bg-[#0a0b0d]/90 backdrop-blur-xl px-6 md:px-10 py-6 flex justify-between items-center border-b border-white/5 z-[100]">
            <h1 className="text-xl md:text-2xl font-black italic">GP<span className="text-[#ffb7c5]">:OBRA</span></h1>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[12px] font-bold uppercase">{user.email.split('@')[0]}</p>
                <p className="text-[9px] text-[#ffb7c5] font-black uppercase tracking-widest">{user.role} ACCESS</p>
              </div>
              <button onClick={() => setShowProfile(true)} className="relative">
                <img src={user.avatar || ''} className="w-10 h-10 rounded-full border-2 border-[#ffb7c5] object-cover" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0a0b0d] rounded-full"></div>
              </button>
            </div>
          </header>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex justify-center gap-10 py-4 border-b border-white/5">
            {[
              { id: 'projeto3d', label: 'PROJETO', icon: Camera },
              { id: 'financeiro', label: 'FINANCEIRO', icon: DollarSign },
              { id: 'diario', label: 'DIÁRIO', icon: FileText },
              { id: 'pedidos', label: 'MATERIAIS', icon: Package },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 text-[11px] font-black tracking-widest transition-all ${
                  activeTab === item.id ? 'text-[#ffb7c5]' : 'text-gray-500 hover:text-white'
                }`}
              >
                <item.icon size={14} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Main Viewport */}
          <main className="flex-1 p-6 md:p-12 max-w-[1600px] mx-auto w-full">
            <AnimatePresence mode="wait">
              {activeTab === 'projeto3d' && (
                <motion.section
                  key="projeto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-10"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">Visão Geral</h2>
                    {user.role === 'ADMIN' && (
                      <button className="bg-blue-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                        <Plus size={14} /> Novo Ponto Raio-X
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 bg-[#14161a] rounded-[2rem] relative p-4 min-h-[400px] md:min-h-[600px] overflow-hidden border border-white/5">
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                          src="https://exvsnqybuvkabavwyrsu.supabase.co/storage/v1/object/public/projeto-arquivos/planta%20base.png" 
                          className={`max-w-full max-h-[600px] object-contain transition-opacity duration-500 ${isAnyLayerActive ? 'opacity-20' : 'opacity-100'}`}
                        />
                        
                        {/* Layers */}
                        <img 
                          src="https://exvsnqybuvkabavwyrsu.supabase.co/storage/v1/object/public/projeto-arquivos/hidraulica%20(2).jpg" 
                          className={`absolute inset-0 w-full h-full object-contain mix-blend-screen transition-opacity duration-500 pointer-events-none ${layers.hidraulica ? 'opacity-100' : 'opacity-0'}`}
                        />
                        <img 
                          src="https://exvsnqybuvkabavwyrsu.supabase.co/storage/v1/object/public/projeto-arquivos/eletrica.jpg" 
                          className={`absolute inset-0 w-full h-full object-contain mix-blend-screen transition-opacity duration-500 pointer-events-none ${layers.eletrica ? 'opacity-100' : 'opacity-0'}`}
                        />
                        <img 
                          src="https://exvsnqybuvkabavwyrsu.supabase.co/storage/v1/object/public/projeto-arquivos/climatizaca.jpg" 
                          className={`absolute inset-0 w-full h-full object-contain mix-blend-screen transition-opacity duration-500 pointer-events-none ${layers.clima ? 'opacity-100' : 'opacity-0'}`}
                        />

                        {/* Hotspots */}
                        {hotspots.map(h => (
                          <div 
                            key={h.id}
                            style={{ left: `${h.pos_x}%`, top: `${h.pos_y}%` }}
                            className="absolute z-50 transform -translate-x-1/2 -translate-y-1/2 group/hotspot"
                          >
                            <button
                              onClick={() => setShowRaioX({ tit: h.nome_comodo, url: h.url_foto_interna })}
                              className="w-6 h-6 bg-[#ffb7c5] rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,183,197,0.5)] animate-pulse"
                            />
                            {user.role === 'ADMIN' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteHotspot(h.id);
                                }}
                                className="absolute -top-4 -right-4 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/hotspot:opacity-100 transition-opacity shadow-lg"
                              >
                                <X size={10} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Layer Controls */}
                      <div className="absolute top-6 right-6 z-50 bg-black/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl">
                        <p className="text-[9px] font-black text-[#ffb7c5] mb-4 uppercase tracking-widest">Filtros Técnicos</p>
                        <div className="flex flex-col gap-3">
                          {(['hidraulica', 'eletrica', 'clima'] as const).map(l => (
                            <label key={l} className="flex items-center gap-3 text-[10px] uppercase font-bold cursor-pointer group">
                              <div className={`w-4 h-4 rounded border border-white/20 flex items-center justify-center transition-all ${layers[l] ? 'bg-[#ffb7c5] border-[#ffb7c5]' : 'group-hover:border-[#ffb7c5]'}`}>
                                {layers[l] && <X size={10} className="text-black" />}
                              </div>
                              <input type="checkbox" className="hidden" onChange={() => toggleLayer(l)} checked={layers[l]} />
                              {l}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cronograma Sidebar */}
                    <div className="bg-[#14161a] p-8 rounded-[2rem] border border-white/5 border-r-8 border-[#ffb7c5]/20">
                      <h3 className="text-[#ffb7c5] text-[11px] font-black uppercase mb-8 tracking-widest flex items-center gap-2">
                        <Calendar size={14} /> Cronograma
                      </h3>
                      <div className="space-y-6">
                        {cronograma.map(item => (
                          <div 
                            key={item.id} 
                            className={`group cursor-pointer p-2 rounded-xl transition-all ${user.role === 'ADMIN' ? 'hover:bg-white/5' : ''}`}
                            onClick={() => user.role === 'ADMIN' && setEditingCrono(item)}
                          >
                            <div className="flex justify-between mb-2">
                              <span className="text-[10px] uppercase text-gray-400 font-bold">{item.etapa}</span>
                              <span className="text-[10px] text-[#ffb7c5] font-black">{item.progresso}%</span>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${item.progresso}%` }}
                                className="bg-[#ffb7c5] h-full shadow-[0_0_10px_rgba(255,183,197,0.3)]"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-10 pt-6 border-t border-white/5">
                        <p className="text-[11px] text-gray-500 uppercase font-bold tracking-widest">Total Concluído</p>
                        <p className="text-4xl font-black text-[#ffb7c5] italic tracking-tighter">
                          {(cronograma.reduce((acc, curr) => acc + curr.progresso, 0) / (cronograma.length || 1)).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}

              {activeTab === 'financeiro' && (
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
                        onClick={generateFinanceiroReport}
                        className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-white/10 transition-all"
                      >
                        <Download size={14} /> Relatório
                      </button>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Investimento Total</p>
                        <p className="text-3xl md:text-4xl font-black text-[#ffb7c5] italic">
                          R$ {financeiro.reduce((acc, curr) => acc + curr.valor_pago, 0).toLocaleString('pt-br')}
                        </p>
                      </div>
                    </div>
                  </div>
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
                          {financeiro.map(f => (
                            <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-6 text-xs text-gray-500">{new Date(f.created_at).toLocaleDateString()}</td>
                              <td className="p-6 text-xs font-bold uppercase tracking-wider">{f.descricao}</td>
                              <td className="p-6 text-[#ffb7c5] font-black">R$ {f.valor_pago.toLocaleString('pt-br')}</td>
                              <td className="p-6">
                                <a href={f.cupom_url} target="_blank" className="text-[9px] bg-white/5 px-3 py-2 rounded-lg font-black hover:bg-white/10 transition-all">VER COMPROVANTE</a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.section>
              )}

              {activeTab === 'diario' && (
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
                      <button onClick={() => setShowDiarioModal(true)} className="bg-[#ffb7c5] text-black px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition-all">
                        Novo Relato
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {diario.map(item => (
                      <div key={item.id} className="bg-[#14161a] p-8 rounded-[2rem] border border-white/5 group hover:border-[#ffb7c5]/30 transition-all">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-full bg-[#ffb7c5]/10 flex items-center justify-center text-[#ffb7c5] font-black text-[10px]">
                            {item.autor[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-[#ffb7c5] uppercase tracking-widest">{item.autor.split('@')[0]}</p>
                            <p className="text-[9px] text-gray-500 uppercase font-bold">{new Date(item.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <p className="text-gray-300 mb-6 text-sm leading-relaxed">{item.descricao}</p>
                        {item.midia_url && (
                          <img src={item.midia_url} className="w-full h-48 object-cover rounded-2xl border border-white/5" />
                        )}
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {activeTab === 'pedidos' && (
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
                        onClick={generateMateriaisReport}
                        className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-white/10 transition-all"
                      >
                        <Download size={14} /> Relatório
                      </button>
                      {user.role === 'ADMIN' && (
                        <button onClick={() => setShowPedidoModal(true)} className="bg-[#ffb7c5] text-black px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition-all">
                          Solicitar
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {pedidos.map(p => (
                      <div 
                        key={p.id} 
                        className={`bg-[#14161a] p-8 rounded-[2rem] border border-white/5 relative overflow-hidden transition-all hover:border-[#ffb7c5]/20 ${
                          p.urgencia === 'critica' ? 'border-l-4 border-l-red-500' : 
                          p.urgencia === 'media' ? 'border-l-4 border-l-amber-500' : 
                          'border-l-4 border-l-emerald-500'
                        }`}
                      >
                        <p className="font-black text-white uppercase text-sm mb-1 tracking-tight">{p.material}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black mb-6 tracking-widest">Qtd: {p.quantidade}</p>
                        <div className="flex items-center justify-between mb-4">
                          <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${
                            p.status === 'aprovado' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-400'
                          }`}>
                            {p.status}
                          </span>
                          <span className="text-[8px] text-gray-600 font-bold">{new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        {user.role === 'ADMIN' && p.status === 'pendente' && (
                          <div className="flex gap-2 pt-4 border-t border-white/5">
                            <button 
                              onClick={() => setApprovingPedido(p)}
                              className="flex-1 bg-emerald-500/10 text-emerald-500 p-2 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                            >
                              <CheckCircle size={16} className="mx-auto" />
                            </button>
                            <button 
                              onClick={() => handleDeletePedido(p.id)}
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
              )}
            </AnimatePresence>
          </main>

          {/* Mobile Navigation Bar */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0b0d]/95 backdrop-blur-2xl border-t border-white/5 flex justify-around items-center p-4 z-[1000]">
            {[
              { id: 'projeto3d', icon: Camera },
              { id: 'financeiro', icon: DollarSign },
              { id: 'diario', icon: FileText },
              { id: 'pedidos', icon: Package },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`p-3 rounded-2xl transition-all ${
                  activeTab === item.id ? 'bg-[#ffb7c5] text-black scale-110' : 'text-gray-500'
                }`}
              >
                <item.icon size={20} />
              </button>
            ))}
            <button onClick={() => setChatOpen(true)} className="p-3 text-gray-500 relative">
              <MessageSquare size={20} />
              <div className="absolute top-2 right-2 w-2 h-2 bg-[#ffb7c5] rounded-full"></div>
            </button>
          </nav>

          {/* Chat Widget */}
          <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[110]">
            <button 
              onClick={() => setChatOpen(!chatOpen)}
              className="w-16 h-16 bg-[#ffb7c5] rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all"
            >
              {chatOpen ? <X size={28} className="text-black" /> : <MessageSquare size={28} className="text-black" />}
            </button>

            <AnimatePresence>
              {chatOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  className="absolute bottom-20 right-0 w-[90vw] md:w-[380px] h-[550px] bg-[#14161a] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden"
                >
                  <div className="p-6 bg-[#ffb7c5] text-black flex justify-between items-center">
                    <div>
                      <h4 className="font-black uppercase text-xs tracking-widest">Canal de Obra</h4>
                      <p className="text-[9px] font-bold opacity-60">Tempo Real Ativo</p>
                    </div>
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-[#ffb7c5] bg-black/20 overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?u=${i}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-black/20">
                    {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-gray-600 text-center p-10">
                        <MessageSquare size={40} className="mb-4 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma mensagem ainda</p>
                      </div>
                    )}
                    {messages.map((msg) => {
                      const isMe = msg.autor === user.email;
                      return (
                        <div key={msg.id || Math.random()} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <p className="text-[8px] font-black text-gray-500 uppercase mb-1 px-2">
                            {msg.autor.split('@')[0]}
                          </p>
                          <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                            isMe ? 'bg-[#ffb7c5] text-black rounded-tr-none' : 'bg-white/5 text-white rounded-tl-none'
                          } ${msg.isOptimistic ? 'opacity-50' : 'opacity-100'}`}>
                            {msg.midia_url ? (
                              <img src={msg.midia_url} className="rounded-lg max-w-full mb-1" alt="Chat" />
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
                    <input 
                      type="file"
                      id="chat-photo-input"
                      className="hidden"
                      accept="image/*"
                      onChange={handleChatPhoto}
                    />
                    <button 
                      type="button"
                      onClick={() => document.getElementById('chat-photo-input')?.click()}
                      className="text-gray-500 hover:text-[#ffb7c5] transition-all"
                    >
                      <Camera size={18} />
                    </button>
                    <input 
                      name="message"
                      autoComplete="off"
                      placeholder="Sua mensagem..." 
                      className="flex-1 bg-transparent outline-none text-xs font-medium"
                    />
                    <button type="submit" className="text-[#ffb7c5] p-2 hover:scale-110 transition-all">
                      <Send size={18} />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Modal */}
          <AnimatePresence>
            {showProfile && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/95 z-[4000] flex items-center justify-center p-6"
              >
                <div className="bg-[#14161a] p-10 rounded-[2.5rem] max-w-sm w-full text-center border border-white/5">
                  <img src={user.avatar || ''} className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-[#ffb7c5] object-cover" />
                  <h3 className="font-black uppercase tracking-widest">{user.email.split('@')[0]}</h3>
                  <p className="text-[10px] text-gray-500 mb-8">{user.email}</p>
                  
                  <div className="space-y-3">
                    <button className="w-full p-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                      Alterar Foto
                    </button>
                    
                    <div className="pt-6 border-t border-white/5 space-y-3">
                      <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Segurança & Alertas</p>
                      
                      <button 
                        onClick={requestNotificationPermission}
                        className="w-full p-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                      >
                        <Bell size={14} /> Ativar Notificações
                      </button>

                      <input 
                        type="password"
                        placeholder="NOVA SENHA"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-4 bg-white/5 rounded-2xl text-xs outline-none focus:ring-1 ring-[#ffb7c5]/30"
                      />
                      <button 
                        onClick={handleUpdatePassword}
                        className="w-full p-4 bg-[#ffb7c5]/10 text-[#ffb7c5] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#ffb7c5] hover:text-black transition-all"
                      >
                        Trocar Senha
                      </button>
                    </div>

                    <button onClick={handleLogout} className="w-full p-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                      <LogOut size={14} className="inline mr-2" /> Sair do Sistema
                    </button>
                  </div>
                  <button onClick={() => setShowProfile(false)} className="mt-8 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                    Fechar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Raio-X Modal */}
          <AnimatePresence>
            {showRaioX && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 bg-black/98 z-[6000] flex flex-col items-center justify-center p-6"
              >
                <button onClick={() => setShowRaioX(null)} className="absolute top-10 right-10 text-[#ffb7c5] font-black flex items-center gap-2">
                  FECHAR <X size={20} />
                </button>
                <h3 className="text-2xl font-black text-[#ffb7c5] mb-8 italic uppercase tracking-tighter">{showRaioX.tit}</h3>
                <div className="relative max-w-4xl w-full">
                  <img src={showRaioX.url} className="w-full rounded-[2rem] shadow-2xl border-2 border-[#ffb7c5]/20" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-[2rem]"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cronograma Edit Modal */}
          <AnimatePresence>
            {editingCrono && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 z-[5000] flex items-center justify-center p-6"
              >
                <div className="bg-[#14161a] p-10 rounded-[2.5rem] max-w-sm w-full border border-white/5">
                  <h3 className="text-xl font-black text-[#ffb7c5] uppercase mb-6 italic">Atualizar Etapa</h3>
                  <p className="text-[10px] text-gray-500 uppercase font-black mb-8">{editingCrono.etapa}</p>
                  <form onSubmit={handleUpdateCronograma} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Progresso (%)</label>
                      <input 
                        name="progresso"
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={editingCrono.progresso}
                        className="w-full p-5 bg-white/5 rounded-2xl outline-none text-2xl font-black text-[#ffb7c5] text-center"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setEditingCrono(null)} className="flex-1 text-gray-500 font-black uppercase text-[10px]">Cancelar</button>
                      <button type="submit" className="flex-1 bg-[#ffb7c5] text-black p-4 rounded-xl font-black uppercase text-[10px]">Salvar</button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Finalizar Compra Modal */}
          <AnimatePresence>
            {approvingPedido && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/95 z-[5000] flex items-center justify-center p-6"
              >
                <div className="bg-[#14161a] p-10 rounded-[2.5rem] max-w-md w-full border border-white/5">
                  <h3 className="text-xl font-black text-[#ffb7c5] uppercase mb-2 italic">Finalizar Compra</h3>
                  <p className="text-[10px] text-gray-500 uppercase font-black mb-8">{approvingPedido.material}</p>
                  
                  <form onSubmit={handleFinalizarCompra} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Valor Pago (R$)</label>
                      <input 
                        name="valor"
                        type="number"
                        step="0.01"
                        required
                        placeholder="0,00"
                        className="w-full p-5 bg-white/5 rounded-2xl outline-none text-2xl font-black text-[#ffb7c5] text-center"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Cupom Fiscal</label>
                      <input 
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setCupomBase64(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full p-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase text-gray-500"
                      />
                      {cupomBase64 && <p className="text-[9px] text-emerald-500 font-black uppercase text-center">✓ Imagem carregada</p>}
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setApprovingPedido(null)} className="flex-1 text-gray-500 font-black uppercase text-[10px]">Cancelar</button>
                      <button type="submit" className="flex-1 bg-[#ffb7c5] text-black p-4 rounded-xl font-black uppercase text-[10px]">Confirmar & Lançar</button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Diario Modal */}
          <AnimatePresence>
            {showDiarioModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/95 z-[3000] flex items-center justify-center p-6"
              >
                <div className="bg-[#14161a] p-10 rounded-[2.5rem] max-w-lg w-full border border-white/5">
                  <h3 className="text-2xl font-black mb-6 text-[#ffb7c5] italic uppercase tracking-tighter">Novo Relato</h3>
                  <textarea 
                    id="texto-diario"
                    className="w-full h-44 bg-white/5 rounded-2xl p-5 mb-4 outline-none text-white text-sm" 
                    placeholder="O que foi feito hoje?"
                  ></textarea>
                  <div className="flex gap-4">
                    <button onClick={() => setShowDiarioModal(false)} className="flex-1 text-gray-500 font-black uppercase text-[12px]">Cancelar</button>
                    <button 
                      onClick={async () => {
                        const t = (document.getElementById('texto-diario') as HTMLTextAreaElement).value;
                        if (!t || !user) return;
                        await sb.from('diario_obra').insert([{ autor: user.email, descricao: t }]);
                        setShowDiarioModal(false);
                        loadAllData();
                        addNotification("Relato publicado!", 'success');
                      }}
                      className="flex-1 bg-[#ffb7c5] text-black p-5 rounded-2xl font-black uppercase text-xs"
                    >
                      Publicar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pedido Modal */}
          <AnimatePresence>
            {showPedidoModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/95 z-[3000] flex items-center justify-center p-6"
              >
                <div className="bg-[#14161a] p-10 rounded-[2.5rem] max-w-lg w-full border border-white/5">
                  <h3 className="text-2xl font-black mb-6 text-[#ffb7c5] italic uppercase tracking-tighter">Solicitar Material</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const m = (e.target as any).material.value;
                    const q = (e.target as any).qtd.value;
                    const u = (e.target as any).urgencia.value;
                    if (!user) return;
                    await sb.from('pedidos_materiais').insert([{ material: m, quantidade: q, status: 'pendente', urgencia: u }]);
                    setShowPedidoModal(false);
                    loadAllData();
                    addNotification("Solicitação enviada!", 'success');
                  }} className="space-y-4">
                    <input name="material" placeholder="NOME DO MATERIAL" required className="w-full p-5 bg-white/5 rounded-2xl outline-none text-xs font-bold" />
                    <input name="qtd" placeholder="QUANTIDADE" required className="w-full p-5 bg-white/5 rounded-2xl outline-none text-xs font-bold" />
                    <select name="urgencia" className="w-full p-5 bg-white/5 rounded-2xl outline-none text-xs font-bold text-gray-400">
                      <option value="planeada">PLANEADA</option>
                      <option value="media">MÉDIA</option>
                      <option value="critica">CRÍTICA</option>
                    </select>
                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowPedidoModal(false)} className="flex-1 text-gray-500 font-black uppercase text-[12px]">Cancelar</button>
                      <button type="submit" className="flex-1 bg-[#ffb7c5] text-black p-5 rounded-2xl font-black uppercase text-xs">Enviar</button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
