import React, { lazy, Suspense, useState } from 'react';
import { motion } from 'motion/react';
import { Box, Calendar, Map, Plus, X } from 'lucide-react';
import { plantaAssets } from '../../lib/assets';
import { can } from '../../lib/permissions';
import type { CronogramaItem, Hotspot, UserState } from '../../types';

// Vista 3D (Three.js) carregada sob demanda — só baixa quando o usuário abre o 3D.
const Planta3D = lazy(() => import('../Planta3D'));

const LAYERS = [
  { key: 'hidraulica', label: 'Hidráulica' },
  { key: 'eletrica', label: 'Elétrica' },
  { key: 'clima', label: 'Climatização' },
] as const;

type LayerKey = (typeof LAYERS)[number]['key'];

interface Props {
  user: UserState;
  hotspots: Hotspot[];
  cronograma: CronogramaItem[];
  onOpenRaioX: (tit: string, url: string) => void;
  onEditCrono: (item: CronogramaItem) => void;
  onDeleteHotspot: (id: number) => void;
  onPlaceHotspot: (posX: number, posY: number) => void;
}

export default function Projeto({
  user,
  hotspots,
  cronograma,
  onOpenRaioX,
  onEditCrono,
  onDeleteHotspot,
  onPlaceHotspot,
}: Props) {
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    hidraulica: false,
    eletrica: false,
    clima: false,
  });
  const [placing, setPlacing] = useState(false);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const planta = plantaAssets();

  const isAnyLayerActive = layers.hidraulica || layers.eletrica || layers.clima;
  const totalProgress = (cronograma.reduce((acc, c) => acc + c.progresso, 0) / (cronograma.length || 1)).toFixed(1);

  const handlePlantClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const posX = ((e.clientX - rect.left) / rect.width) * 100;
    const posY = ((e.clientY - rect.top) / rect.height) * 100;
    setPlacing(false);
    onPlaceHotspot(Math.round(posX * 10) / 10, Math.round(posY * 10) / 10);
  };

  return (
    <motion.section
      key="projeto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">Visão Geral</h2>
        {can(user, 'manage_hotspots') && (
          <button
            onClick={() => setPlacing((p) => !p)}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${
              placing ? 'bg-amber-500 text-black animate-pulse' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {placing ? (
              <>
                <X size={14} /> Clique na planta (ou cancele)
              </>
            ) : (
              <>
                <Plus size={14} /> Novo Ponto Raio-X
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {/* Seletor Planta 2D / Vista 3D */}
          <div className="flex gap-1 bg-[#14161a] p-1.5 rounded-2xl border border-white/5 w-fit">
            {(['2d', '3d'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  view === v ? 'bg-[#ffb7c5] text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {v === '2d' ? <Map size={13} /> : <Box size={13} />}
                {v === '2d' ? 'Planta 2D' : 'Vista 3D'}
              </button>
            ))}
          </div>

          {view === '3d' ? (
            <Suspense
              fallback={
                <div className="w-full h-[400px] md:h-[600px] rounded-[2rem] bg-[#14161a] border border-white/5 flex flex-col items-center justify-center gap-4">
                  <Box size={40} className="text-[#ffb7c5] animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Carregando modelo 3D...</p>
                </div>
              }
            >
              <Planta3D hotspots={hotspots} cronograma={cronograma} onOpenRaioX={onOpenRaioX} canUpload={user.role === 'ADMIN'} />
            </Suspense>
          ) : (
          <div className="bg-[#14161a] rounded-[2rem] relative p-4 min-h-[400px] md:min-h-[600px] overflow-hidden border border-white/5">
          <div
            className={`relative w-full h-full flex items-center justify-center ${placing ? 'cursor-crosshair ring-2 ring-amber-500/50 rounded-2xl' : ''}`}
            onClick={handlePlantClick}
          >
            <img
              src={planta.base}
              alt="Planta baixa da obra"
              className={`max-w-full max-h-[600px] object-contain transition-opacity duration-500 ${
                isAnyLayerActive ? 'opacity-20' : 'opacity-100'
              }`}
            />

            {LAYERS.map((l) => (
              <img
                key={l.key}
                src={planta[l.key]}
                alt={`Camada ${l.label}`}
                className={`absolute inset-0 w-full h-full object-contain mix-blend-screen transition-opacity duration-500 pointer-events-none ${
                  layers[l.key] ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}

            {hotspots.map((h) => (
              <div
                key={h.id}
                style={{ left: `${h.pos_x}%`, top: `${h.pos_y}%` }}
                className="absolute z-50 transform -translate-x-1/2 -translate-y-1/2 group/hotspot"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenRaioX(h.nome_comodo, h.url_foto_interna);
                  }}
                  aria-label={`Ver foto de ${h.nome_comodo}`}
                  className="w-6 h-6 bg-[#ffb7c5] rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,183,197,0.5)] animate-pulse"
                />
                {can(user, 'manage_hotspots') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteHotspot(h.id);
                    }}
                    aria-label={`Excluir ponto ${h.nome_comodo}`}
                    className="absolute -top-4 -right-4 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/hotspot:opacity-100 transition-opacity shadow-lg"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="absolute top-6 right-6 z-50 bg-black/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl">
            <p className="text-[9px] font-black text-[#ffb7c5] mb-4 uppercase tracking-widest">Filtros Técnicos</p>
            <div className="flex flex-col gap-3">
              {LAYERS.map((l) => (
                <label key={l.key} className="flex items-center gap-3 text-[10px] uppercase font-bold cursor-pointer group">
                  <div
                    className={`w-4 h-4 rounded border border-white/20 flex items-center justify-center transition-all ${
                      layers[l.key] ? 'bg-[#ffb7c5] border-[#ffb7c5]' : 'group-hover:border-[#ffb7c5]'
                    }`}
                  >
                    {layers[l.key] && <X size={10} className="text-black" />}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    onChange={() => setLayers((prev) => ({ ...prev, [l.key]: !prev[l.key] }))}
                    checked={layers[l.key]}
                  />
                  {l.label}
                </label>
              ))}
            </div>
          </div>
          </div>
          )}
        </div>

        <div className="bg-[#14161a] p-8 rounded-[2rem] border border-white/5 border-r-8 border-[#ffb7c5]/20">
          <h3 className="text-[#ffb7c5] text-[11px] font-black uppercase mb-8 tracking-widest flex items-center gap-2">
            <Calendar size={14} aria-hidden="true" /> Cronograma
          </h3>
          <div className="space-y-6">
            {cronograma.map((item) => (
              <div
                key={item.id}
                className={`group p-2 rounded-xl transition-all ${
                  can(user, 'edit_cronograma') ? 'cursor-pointer hover:bg-white/5' : ''
                }`}
                onClick={() => can(user, 'edit_cronograma') && onEditCrono(item)}
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
            <p className="text-4xl font-black text-[#ffb7c5] italic tracking-tighter">{totalProgress}%</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
