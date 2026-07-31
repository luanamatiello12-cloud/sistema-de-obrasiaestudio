import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Html, OrbitControls } from '@react-three/drei';
import type { Mesh } from 'three';
import { CalendarClock, Lightbulb, Layers, Paintbrush, Sofa } from 'lucide-react';
import { APT, CENTER_OFFSET, DOORS, FURNITURE, ROOMS, WALLS, WINDOWS, type Janela, type Piece, type Porta, type Room } from '../lib/apartmentModel';
import type { CronogramaItem, Hotspot } from '../types';

interface Finishes {
  piso: boolean;
  pintura: boolean;
  mobilia: boolean;
  iluminacao: boolean;
}

/** Deriva os acabamentos a partir do progresso real das etapas do cronograma. */
function finishesFromCronograma(cronograma: CronogramaItem[]): Finishes {
  const prog = (part: string) =>
    cronograma.find((c) => c.etapa.toLowerCase().includes(part))?.progresso ?? 0;
  return {
    piso: prog('contrapiso') >= 80,
    pintura: prog('pintura') >= 40,
    mobilia: prog('marcenaria') >= 40,
    iluminacao: prog('elétr') >= 40 || prog('eletr') >= 40,
  };
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
        opacity={painted ? 0.78 : 0.32}
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

/** Teto sólido que some quando a câmera olha de cima (para inspecionar por dentro). */
function SmartCeiling() {
  const ref = useRef<Mesh>(null);
  useFrame(({ camera }) => {
    if (!ref.current) return;
    const d = camera.position.length() || 1;
    const topness = camera.position.y / d; // 0 = de lado, 1 = de cima
    ref.current.visible = topness < 0.52;
  });
  return (
    <mesh ref={ref} position={[APT.width / 2, APT.wallHeight + 0.02, APT.depth / 2]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[APT.width, APT.depth]} />
      <meshStandardMaterial color="#e7e4de" roughness={0.92} side={2} />
    </mesh>
  );
}

function DoorLeaf({ d }: { d: Porta }) {
  const base = d.axis === 'x' ? 0 : Math.PI / 2;
  return (
    <group position={[d.hinge[0], 0, d.hinge[1]]} rotation={[0, base + d.swing, 0]}>
      <mesh position={[d.w / 2, 1.03, 0]} castShadow>
        <boxGeometry args={[d.w, 2.05, 0.05]} />
        <meshStandardMaterial color="#6b5136" roughness={0.6} metalness={0.05} />
      </mesh>
    </group>
  );
}

function WindowPane({ j }: { j: Janela }) {
  const [x, z] = j.pos;
  const size: [number, number, number] = j.axis === 'x' ? [j.w, j.h, 0.06] : [0.06, j.h, j.w];
  return (
    <mesh position={[x, j.sill + j.h / 2, z]}>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#a9c7e0" transparent opacity={0.35} roughness={0.05} metalness={0.2} depthWrite={false} />
    </mesh>
  );
}

function CeilingFixture({ room, on }: { room: Room; on: boolean }) {
  const [x1, z1, x2, z2] = room.rect;
  return (
    <mesh position={[(x1 + x2) / 2, APT.wallHeight - 0.06, (z1 + z2) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.18, 20]} />
      <meshStandardMaterial
        color={on ? '#fff3d6' : '#c7ccd1'}
        emissive={on ? '#ffcf87' : '#000000'}
        emissiveIntensity={on ? 1.4 : 0}
      />
    </mesh>
  );
}

function Plant({ pos }: { pos: [number, number] }) {
  const [x, z] = pos;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.12, 0.44, 14]} />
        <meshStandardMaterial color="#8a6d4f" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.36, 14, 14]} />
        <meshStandardMaterial color="#3f6f4a" roughness={0.9} />
      </mesh>
    </group>
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
    <Html position={[x, 1.7, z]} center distanceFactor={12} zIndexRange={[500, 0]}>
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
  cronograma: CronogramaItem[];
  onOpenRaioX: (tit: string, url: string) => void;
}

export default function Planta3D({ hotspots, cronograma, onOpenRaioX }: Props) {
  const [manual, setManual] = useState<Finishes>({ piso: true, pintura: true, mobilia: true, iluminacao: true });
  // Abre mostrando a casa pronta (mais bonito). O usuário liga "Seguindo
  // cronograma" para ver o estágio real da obra.
  const [auto, setAuto] = useState(false);
  const toggle = (k: keyof Finishes) => setManual((p) => ({ ...p, [k]: !p[k] }));

  // Em modo automático, os acabamentos vêm do progresso real das etapas.
  const fin = auto ? finishesFromCronograma(cronograma) : manual;

  return (
    <div className="relative w-full h-[400px] md:h-[600px] rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#0d0e12] to-[#14161a] border border-white/5">
      <Canvas
        shadows
        camera={{ position: [4, 11, 11], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, toneMappingExposure: 1.15 }}
      >
        <color attach="background" args={['#0b0c10']} />
        <fog attach="fog" args={['#0b0c10', 22, 42]} />
        <hemisphereLight args={['#ffffff', '#2b2d36', 0.75]} />
        <ambientLight intensity={0.2} />
        <directionalLight
          position={[9, 16, 7]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={45}
          shadow-camera-left={-14}
          shadow-camera-right={14}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[-7, 9, -5]} intensity={0.35} color="#ffd9b0" />

        {/* Chão do entorno (aterra) para ancorar a casa */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color="#0c0d11" roughness={1} />
        </mesh>

        <group position={CENTER_OFFSET}>
          {/* Sombra de contato sob a casa */}
          <ContactShadows
            position={[APT.width / 2, 0.015, APT.depth / 2]}
            scale={17}
            resolution={1024}
            blur={2.6}
            opacity={0.55}
            far={7}
          />

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

          {WINDOWS.map((j, i) => (
            <WindowPane key={i} j={j} />
          ))}

          {DOORS.map((d, i) => (
            <DoorLeaf key={i} d={d} />
          ))}

          {/* Teto / forro sólido (some ao olhar de cima) — surge com a pintura pronta */}
          {fin.pintura && (
            <>
              <SmartCeiling />
              {ROOMS.map((r) => (
                <CeilingFixture key={r.nome} room={r} on={fin.iluminacao} />
              ))}
            </>
          )}

          {fin.mobilia && (
            <>
              {FURNITURE.map((p, i) => (
                <Furniture key={i} piece={p} />
              ))}
              <Plant pos={[0.5, 0.5]} />
              <Plant pos={[7.4, 3.6]} />
              <Plant pos={[11.4, 0.5]} />
            </>
          )}

          {fin.iluminacao && ROOMS.map((r) => <RoomLight key={r.nome} room={r} />)}

          {hotspots.map((h) => (
            <HotspotPin key={h.id} h={h} onOpen={onOpenRaioX} />
          ))}
        </group>

        <OrbitControls enablePan minDistance={6} maxDistance={26} maxPolarAngle={Math.PI / 2.15} target={[0, 0, 0]} />
      </Canvas>

      {/* Botões de acabamento (etapas) */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md p-3 rounded-2xl border border-white/10 w-[178px]">
        <p className="text-[9px] font-black text-[#ffb7c5] uppercase tracking-widest mb-3">Acabamentos</p>

        <button
          onClick={() => setAuto((a) => !a)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all mb-2 ${
            auto ? 'bg-emerald-500/90 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <CalendarClock size={13} /> {auto ? 'Seguindo cronograma' : 'Modo manual'}
        </button>

        <div className="flex flex-col gap-2">
          {FINISH_ITEMS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => !auto && toggle(key)}
              disabled={auto}
              title={auto ? 'Controlado pelo cronograma' : undefined}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                fin[key] ? 'bg-[#ffb7c5] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              } ${auto ? 'cursor-default opacity-90' : ''}`}
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
