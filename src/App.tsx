import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { MessageSquare } from 'lucide-react';
import * as db from './lib/data';
import { getStoredSession, logout as doLogout, storeSession, updatePassword } from './lib/auth';
import { useObraData } from './hooks/useObraData';
import { uid } from './utils';
import Login from './components/Login';
import Notifications from './components/Notifications';
import Header, { TABS } from './components/Header';
import ChatWidget from './components/ChatWidget';
import Projeto from './components/tabs/Projeto';
import Financeiro from './components/tabs/Financeiro';
import Diario from './components/tabs/Diario';
import Pedidos from './components/tabs/Pedidos';
import { SkeletonCards, SkeletonProjeto } from './components/Skeleton';
import {
  CompraModal,
  ConfirmModal,
  CronoModal,
  DiarioModal,
  HotspotModal,
  PedidoModal,
  ProfileModal,
  RaioXModal,
  type ConfirmState,
} from './components/Modals';
import type { CronogramaItem, Notification, PedidoMaterial, UserState } from './types';

export default function App() {
  const [user, setUser] = useState<UserState | null>(() => getStoredSession());
  const [activeTab, setActiveTab] = useState('projeto3d');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // Modais
  const [showProfile, setShowProfile] = useState(false);
  const [showDiarioModal, setShowDiarioModal] = useState(false);
  const [showPedidoModal, setShowPedidoModal] = useState(false);
  const [showRaioX, setShowRaioX] = useState<{ tit: string; url: string } | null>(null);
  const [editingCrono, setEditingCrono] = useState<CronogramaItem | null>(null);
  const [approvingPedido, setApprovingPedido] = useState<PedidoMaterial | null>(null);
  const [placingHotspot, setPlacingHotspot] = useState<{ x: number; y: number } | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const chatOpenRef = useRef(chatOpen);
  chatOpenRef.current = chatOpen;

  const playAlertSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.error('Erro ao tocar som:', e);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    if (window.Notification.permission === 'default') {
      await window.Notification.requestPermission();
    }
  };

  const addNotification = (message: string, type: Notification['type'] = 'info') => {
    const id = uid();
    setNotifications((prev) => [...prev, { id, message, type }]);
    playAlertSound();
    if ('Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification('GP OBRA', { body: message, tag: 'gp-obra-alert' });
    }
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 5000);
  };

  const data = useObraData({
    user,
    onError: (msg) => addNotification(msg, 'warning'),
    onNewChatMessage: (msg) => {
      if (msg.autor !== user?.email) {
        addNotification(`Nova mensagem de ${msg.autor.split('@')[0]}`, 'info');
        if (!chatOpenRef.current) setUnread((u) => u + 1);
      }
    },
  });

  useEffect(() => {
    if (user) requestNotificationPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = (u: UserState, demo: boolean) => {
    setUser(u);
    addNotification(`Bem-vindo, ${u.email.split('@')[0]}!`, 'success');
    if (demo) {
      addNotification('Modo demo: autenticação real ainda não configurada', 'warning');
    }
    requestNotificationPermission();
  };

  const handleLogout = async () => {
    await doLogout();
    setUser(null);
    setShowProfile(false);
  };

  const handleUpdatePassword = async (newPassword: string) => {
    if (newPassword.length < 6) {
      addNotification('A senha deve ter no mínimo 6 caracteres.', 'warning');
      return;
    }
    const err = await updatePassword(newPassword);
    if (err) addNotification(err, 'warning');
    else addNotification('Senha atualizada com sucesso!', 'success');
  };

  const handleAvatarChange = (base64: string) => {
    if (!user) return;
    const updated = { ...user, avatar: base64 };
    setUser(updated);
    storeSession(updated);
    addNotification('Foto de perfil atualizada!', 'success');
  };

  const handleSaveCrono = async (progresso: number) => {
    if (!editingCrono) return;
    const { error } = await db.updateCronograma(editingCrono.id, progresso);
    if (error) {
      addNotification('Erro ao atualizar cronograma: ' + error, 'warning');
    } else {
      addNotification('Cronograma atualizado!', 'success');
      setEditingCrono(null);
      data.reloadCronograma();
    }
  };

  const handleFinalizarCompra = async (valor: number, cupomUrl: string) => {
    if (!approvingPedido) return;
    const { error } = await db.finalizarCompra(approvingPedido, valor, cupomUrl);
    if (error) {
      addNotification('Erro ao finalizar compra: ' + error, 'warning');
      return;
    }
    addNotification('Compra finalizada e lançada no financeiro!', 'success');
    setApprovingPedido(null);
    data.reloadPedidos();
    data.reloadFinanceiro();
  };

  const handleDeletePedido = (id: number) => {
    setConfirmState({
      title: 'Excluir Pedido',
      message: 'Deseja realmente excluir este pedido de material?',
      onConfirm: async () => {
        const { error } = await db.deletePedido(id);
        if (error) addNotification('Erro ao excluir pedido: ' + error, 'warning');
        else {
          addNotification('Pedido excluído!', 'success');
          data.reloadPedidos();
        }
      },
    });
  };

  const handleDeleteHotspot = (id: number) => {
    setConfirmState({
      title: 'Excluir Ponto',
      message: 'Deseja realmente excluir este ponto de Raio-X?',
      onConfirm: async () => {
        const { error } = await db.deleteHotspot(id);
        if (error) addNotification('Erro ao excluir ponto: ' + error, 'warning');
        else {
          addNotification('Ponto de Raio-X excluído!', 'success');
          data.reloadHotspots();
        }
      },
    });
  };

  const handleCreateHotspot = async (nome: string, fotoUrl: string) => {
    if (!placingHotspot) return;
    const { error } = await db.createHotspot({
      nome_comodo: nome,
      url_foto_interna: fotoUrl,
      pos_x: placingHotspot.x,
      pos_y: placingHotspot.y,
    });
    if (error) {
      addNotification('Erro ao criar ponto: ' + error, 'warning');
    } else {
      addNotification('Ponto de Raio-X criado!', 'success');
      setPlacingHotspot(null);
      data.reloadHotspots();
    }
  };

  const handlePublishDiario = async (texto: string, midiaUrl: string | null) => {
    if (!user) return;
    const { error } = await db.createDiario({
      autor: user.email,
      descricao: texto,
      ...(midiaUrl ? { midia_url: midiaUrl } : {}),
    });
    if (error) {
      addNotification('Erro ao publicar relato: ' + error, 'warning');
    } else {
      addNotification('Relato publicado!', 'success');
      setShowDiarioModal(false);
      data.reloadDiario();
    }
  };

  const handleCreatePedido = async (material: string, quantidade: string, urgencia: string) => {
    const { error } = await db.createPedido({ material, quantidade, status: 'pendente', urgencia });
    if (error) {
      addNotification('Erro ao enviar solicitação: ' + error, 'warning');
    } else {
      addNotification('Solicitação enviada!', 'success');
      setShowPedidoModal(false);
      data.reloadPedidos();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white font-['Montserrat'] overflow-x-hidden pb-20 md:pb-0">
      <Notifications items={notifications} />

      <AnimatePresence>{!user && <Login onLogin={handleLogin} onNotify={addNotification} />}</AnimatePresence>

      {user && (
        <div className="flex flex-col min-h-screen">
          <Header user={user} activeTab={activeTab} onTabChange={setActiveTab} onOpenProfile={() => setShowProfile(true)} />

          <main className="flex-1 p-6 md:p-12 max-w-[1600px] mx-auto w-full">
            <AnimatePresence mode="wait">
              {data.loading ? (
                activeTab === 'projeto3d' ? (
                  <SkeletonProjeto key="skel-proj" />
                ) : (
                  <SkeletonCards key="skel-cards" />
                )
              ) : (
                <>
                  {activeTab === 'projeto3d' && (
                    <Projeto
                      key="projeto"
                      user={user}
                      hotspots={data.hotspots}
                      cronograma={data.cronograma}
                      onOpenRaioX={(tit, url) => setShowRaioX({ tit, url })}
                      onEditCrono={setEditingCrono}
                      onDeleteHotspot={handleDeleteHotspot}
                      onPlaceHotspot={(x, y) => setPlacingHotspot({ x, y })}
                    />
                  )}
                  {activeTab === 'financeiro' && (
                    <Financeiro key="financeiro" financeiro={data.financeiro} onNotify={addNotification} />
                  )}
                  {activeTab === 'diario' && (
                    <Diario key="diario" user={user} diario={data.diario} onNewRelato={() => setShowDiarioModal(true)} />
                  )}
                  {activeTab === 'pedidos' && (
                    <Pedidos
                      key="pedidos"
                      user={user}
                      pedidos={data.pedidos}
                      onNewPedido={() => setShowPedidoModal(true)}
                      onApprove={setApprovingPedido}
                      onDelete={handleDeletePedido}
                      onNotify={addNotification}
                    />
                  )}
                </>
              )}
            </AnimatePresence>
          </main>

          {/* Navegação mobile */}
          <nav
            className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0b0d] border-t border-white/5 flex justify-around items-center p-4 z-[1000]"
            aria-label="Navegação principal"
          >
            {TABS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-label={item.label}
                className={`p-3 rounded-2xl transition-all ${
                  activeTab === item.id ? 'bg-[#ffb7c5] text-black scale-110' : 'text-gray-500'
                }`}
              >
                <item.icon size={20} />
              </button>
            ))}
            <button onClick={() => setChatOpen(true)} aria-label="Abrir chat" className="p-3 text-gray-500 relative">
              <MessageSquare size={20} />
              {unread > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          </nav>

          <ChatWidget
            user={user}
            open={chatOpen}
            onToggle={() => {
              setChatOpen((o) => {
                if (!o) setUnread(0);
                return !o;
              });
            }}
            messages={data.messages}
            setMessages={data.setMessages}
            unread={unread}
            onNotify={addNotification}
          />

          <AnimatePresence>
            {showProfile && (
              <ProfileModal
                user={user}
                onClose={() => setShowProfile(false)}
                onLogout={handleLogout}
                onAvatarChange={handleAvatarChange}
                onUpdatePassword={handleUpdatePassword}
                onRequestNotifications={requestNotificationPermission}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showRaioX && <RaioXModal tit={showRaioX.tit} url={showRaioX.url} onClose={() => setShowRaioX(null)} />}
          </AnimatePresence>

          <AnimatePresence>
            {editingCrono && <CronoModal item={editingCrono} onClose={() => setEditingCrono(null)} onSave={handleSaveCrono} />}
          </AnimatePresence>

          <AnimatePresence>
            {approvingPedido && (
              <CompraModal
                pedido={approvingPedido}
                onClose={() => setApprovingPedido(null)}
                onConfirm={handleFinalizarCompra}
                onNotify={addNotification}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showDiarioModal && (
              <DiarioModal onClose={() => setShowDiarioModal(false)} onPublish={handlePublishDiario} onNotify={addNotification} />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showPedidoModal && <PedidoModal onClose={() => setShowPedidoModal(false)} onSubmit={handleCreatePedido} />}
          </AnimatePresence>

          <AnimatePresence>
            {placingHotspot && (
              <HotspotModal
                pos={placingHotspot}
                onClose={() => setPlacingHotspot(null)}
                onSubmit={handleCreateHotspot}
                onNotify={addNotification}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {confirmState && <ConfirmModal confirm={confirmState} onClose={() => setConfirmState(null)} />}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
