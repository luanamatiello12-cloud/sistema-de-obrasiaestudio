import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { Lightbulb, Layers, Paintbrush, Sofa } from 'lucide-react';
import { APT, CENTER_OFFSET, FURNITURE, ROOMS, WALLS, type Piece, type Room } from '../lib/apartmentModel';
import type { Hotspot } from '../types';

interface Finishes {
  piso: boolean;
  pintura: boolean;
  mobilia: boolean;
  iluminacao: boolean;
}

function Wall({ seg, painted }: { seg: [number, number, number, number]; painted: boolean }) {
  const [x1, z1, x2, z2] = seg;
  const horizontal = z1 === z2;
  const len = horizontal ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const size: [number, number, number] = horizontal
    ? [len, APT.wallHeight, APT.wallThickness]
    : [APT.wallThickness, APT.wallHeight, len];

  return (
    <mesh position={[cx, APT.wallHeight / 2, cz]} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={painted ? '#efece6' : '#8a8f98'}
        transparent
        opacity={painted ? 0.6 : 0.32}
        roughness={0.7}
        metalness={0.05}
      />
    </mesh>
  );
}

function RoomFloor({ room, piso }: { room: Room; piso: boolean }) {
  const [x1, z1, x2, z2] = room.rect;
  const w = Math.abs(x2 - x1);
  const d = Math.abs(z2 - z1);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  return (
    <mesh position={[cx, 0.02, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[w - 0.08, d - 0.08]} />
      <meshStandardMaterial
        color={piso ? room.piso : room.cor}
        transparent
        opacity={piso ? 0.95 : 0.28}
        roughness={0.85}
      />
    </mesh>
  );
}

function Furniture({ piece }: { piece: Piece }) {
  const [x, z] = piece.pos;
  const [w, h, d] = piece.size;
  const y = piece.y ?? h / 2;
  return (
    <mesh position={[x, y, z]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={piece.cor} roughness={0.7} metalness={0.1} />
    </mesh>
  );
}

function RoomLight({ room }: { room: Room }) {
  const [x1, z1, x2, z2] = room.rect;
  return (
    <pointLight
      position={[(x1 + x2) / 2, 2.35, (z1 + z2) / 2]}
      intensity={7}
      distance={6}
      decay={2}
      color="#ffe6bf"
    />
  );
}

function HotspotPin({ h, onOpen }: { h: Hotspot; onOpen: (tit: string, url: string) => void }) {
  const x = (Number(h.pos_x) / 100) * APT.width;
  const z = (Number(h.pos_y) / 100) * APT.depth;
  return (
    <Html position={[x, 1.7, z]} center distanceFactor={12}>
      <button
        onClick={() => onOpen(h.nome_comodo, h.url_foto_interna)}
        title={`Ver foto de ${h.nome_comodo}`}
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#ffb7c5',
          border: '2px solid #fff',
          boxShadow: '0 0 14px rgba(255,183,197,.8)',
          cursor: 'pointer',
          display: 'block',
        }}
      />
    </Html>
  );
}

const FINISH_ITEMS: { key: keyof Finishes; label: string; Icon: typeof Layers }[] = [
  { key: 'piso', label: 'Piso', Icon: Layers },
  { key: 'pintura', label: 'Pintura', Icon: Paintbrush },
  { key: 'mobilia', label: 'Mobília', Icon: Sofa },
  { key: 'iluminacao', label: 'Iluminação', Icon: Lightbulb },
];

interface Props {
  hotspots: Hotspot[];
  onOpenRaioX: (tit: string, url: string) => void;
}

export default function Planta3D({ hotspots, onOpenRaioX }: Props) {
  const [fin, setFin] = useState<Finishes>({ piso: true, pintura: true, mobilia: true, iluminacao: true });
  const toggle = (k: keyof Finishes) => setFin((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="relative w-full h-[400px] md:h-[600px] rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#0d0e12] to-[#14161a] border border-white/5">
      <Canvas shadows camera={{ position: [0, 10, 12], fov: 38 }} dpr={[1, 2]}>
        <color attach="background" args={['#0a0b0d']} />
        <ambientLight intensity={fin.iluminacao ? 0.5 : 0.65} />
        <directionalLight position={[8, 14, 6]} intensity={fin.iluminacao ? 0.8 : 1.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <directionalLight position={[-6, 8, -4]} intensity={0.3} color="#ffb7c5" />

        <group position={CENTER_OFFSET}>
          {/* Contrapiso base */}
          <mesh position={[APT.width / 2, 0, APT.depth / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[APT.width, APT.depth]} />
            <meshStandardMaterial color="#15171c" roughness={0.95} />
          </mesh>

          {ROOMS.map((r) => (
            <RoomFloor key={r.nome} room={r} piso={fin.piso} />
          ))}

          {WALLS.map((seg, i) => (
            <Wall key={i} seg={seg} painted={fin.pintura} />
          ))}

          {fin.mobilia && FURNITURE.map((p, i) => <Furniture key={i} piece={p} />)}

          {fin.iluminacao && ROOMS.map((r) => <RoomLight key={r.nome} room={r} />)}

          {hotspots.map((h) => (
            <HotspotPin key={h.id} h={h} onOpen={onOpenRaioX} />
          ))}
        </group>

        <OrbitControls enablePan minDistance={6} maxDistance={26} maxPolarAngle={Math.PI / 2.15} target={[0, 0, 0]} />
      </Canvas>

      {/* Botões de acabamento (etapas) */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md p-3 rounded-2xl border border-white/10">
        <p className="text-[9px] font-black text-[#ffb7c5] uppercase tracking-widest mb-3">Acabamentos</p>
        <div className="flex flex-col gap-2">
          {FINISH_ITEMS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                fin[key] ? 'bg-[#ffb7c5] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Dica de navegação */}
      <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-2 rounded-xl">
        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Arraste para girar · role para zoom</p>
      </div>
    </div>
  );
}
