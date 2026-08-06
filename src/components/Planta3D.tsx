import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Html, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CalendarClock, ChevronLeft, ChevronRight, Home, Upload } from 'lucide-react';
import { getModel3dUrl, setModel3dUrl, uploadModel } from '../lib/model3d';
import {
  APT,
  CENTER_OFFSET,
  DOORS,
  FURNITURE,
  INSTALACOES,
  PHASES,
  PORCH_COLUMNS,
  ROOMS,
  WALLS,
  WINDOWS,
  type Janela,
  type Piece,
  type Porta,
  type Room,
  type Tubo,
} from '../lib/apartmentModel';
import type { CronogramaItem, Hotspot } from '../types';

type WallStage = 'bloco' | 'reboco' | 'pintura';

const WALL_MAT: Record<WallStage, { color: string; roughness: number }> = {
  bloco: { color: '#a58c78', roughness: 0.98 },
  reboco: { color: '#bcb8b0', roughness: 0.9 },
  pintura: { color: '#efece6', roughness: 0.65 },
};

/** Etapa da obra (0..8) derivada do progresso médio do cronograma. */
function stepFromCronograma(cronograma: CronogramaItem[]): number {
  if (!cronograma.length) return PHASES.length - 1;
  const avg = cronograma.reduce((a, c) => a + c.progresso, 0) / cronograma.length;
  return Math.max(0, Math.min(PHASES.length - 1, Math.round((avg / 100) * (PHASES.length - 1))));
}

function Wall({ seg, stage }: { seg: [number, number, number, number]; stage: WallStage }) {
  const [x1, z1, x2, z2] = seg;
  const horizontal = z1 === z2;
  const len = horizontal ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const size: [number, number, number] = horizontal
    ? [len, APT.wallHeight, APT.wallThickness]
    : [APT.wallThickness, APT.wallHeight, len];
  const m = WALL_MAT[stage];
  return (
    <mesh position={[cx, APT.wallHeight / 2, cz]} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={m.color} roughness={m.roughness} metalness={0.02} />
    </mesh>
  );
}

/** Baldrame / fundação sob as paredes. */
function Footing({ seg }: { seg: [number, number, number, number] }) {
  const [x1, z1, x2, z2] = seg;
  const horizontal = z1 === z2;
  const len = horizontal ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const t = APT.wallThickness + 0.14;
  const size: [number, number, number] = horizontal ? [len, 0.3, t] : [t, 0.3, len];
  return (
    <mesh position={[cx, 0.15, cz]} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#4b4e56" roughness={0.95} />
    </mesh>
  );
}

function RoomFloor({ room }: { room: Room }) {
  const [x1, z1, x2, z2] = room.rect;
  const w = Math.abs(x2 - x1);
  const d = Math.abs(z2 - z1);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  return (
    <mesh position={[cx, 0.03, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[w - 0.08, d - 0.08]} />
      <meshStandardMaterial color={room.piso} roughness={0.8} metalness={0.05} />
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

function Pipe({ t }: { t: Tubo }) {
  return (
    <mesh position={t.pos} castShadow>
      <boxGeometry args={t.size} />
      <meshStandardMaterial color={t.cor} roughness={0.4} metalness={0.2} emissive={t.cor} emissiveIntensity={0.15} />
    </mesh>
  );
}

/** Telhado de duas águas (Craftsman) sobre a casa fechada. */
function GableRoof() {
  const zF = 1.4;
  const zB = APT.depth; // 8.5
  const ridgeZ = (zF + zB) / 2;
  const eaveY = APT.wallHeight;
  const ridgeY = APT.wallHeight + 1.6;
  const a = Math.atan2(ridgeY - eaveY, ridgeZ - zF);
  const slopeLen = Math.hypot(ridgeZ - zF, ridgeY - eaveY) + 0.25;
  const W = APT.width + 0.8;
  const xc = APT.width / 2;
  const telha = '#7a4e39';

  const gable = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(zF, eaveY);
    s.lineTo(zB, eaveY);
    s.lineTo(ridgeZ, ridgeY);
    s.closePath();
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <group>
      {/* Águas */}
      <mesh position={[xc, (eaveY + ridgeY) / 2, (zF + ridgeZ) / 2]} rotation={[-a, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, 0.16, slopeLen]} />
        <meshStandardMaterial color={telha} roughness={0.88} />
      </mesh>
      <mesh position={[xc, (eaveY + ridgeY) / 2, (ridgeZ + zB) / 2]} rotation={[a, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, 0.16, slopeLen]} />
        <meshStandardMaterial color={telha} roughness={0.88} />
      </mesh>
      {/* Frontões (empenas triangulares) */}
      {[0.05, APT.width - 0.05].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow>
          <shapeGeometry args={[gable]} />
          <meshStandardMaterial color="#9aa0a8" roughness={0.9} side={2} />
        </mesh>
      ))}
    </group>
  );
}

/** Estrutura da varanda: piso, guarda-corpo e colunas. */
function Porch() {
  return (
    <group>
      <mesh position={[APT.width / 2, 0.06, APT.porchDepth / 2]} receiveShadow>
        <boxGeometry args={[APT.width - 0.8, 0.12, APT.porchDepth]} />
        <meshStandardMaterial color="#8a6d4f" roughness={0.85} />
      </mesh>
      <mesh position={[APT.width / 2, 0.5, 0.15]} castShadow>
        <boxGeometry args={[APT.width - 0.8, 0.8, 0.12]} />
        <meshStandardMaterial color="#e7e2d6" roughness={0.85} />
      </mesh>
      {PORCH_COLUMNS.map((x, i) => (
        <mesh key={i} position={[x, APT.wallHeight / 2, 0.3]} castShadow>
          <boxGeometry args={[0.22, APT.wallHeight, 0.22]} />
          <meshStandardMaterial color="#eef0f2" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** Telhado da varanda (alpendre). */
function PorchRoof() {
  return (
    <mesh position={[APT.width / 2, APT.wallHeight + 0.1, APT.porchDepth / 2 - 0.1]} castShadow receiveShadow>
      <boxGeometry args={[APT.width - 0.2, 0.14, APT.porchDepth + 0.5]} />
      <meshStandardMaterial color="#7a4e39" roughness={0.88} />
    </mesh>
  );
}

function WindowPane({ j, glass }: { j: Janela; glass: boolean }) {
  const [x, z] = j.pos;
  const y = j.sill + j.h / 2;
  const glassSize: [number, number, number] = j.axis === 'x' ? [j.w, j.h, 0.06] : [0.06, j.h, j.w];
  const frame: [number, number, number] = j.axis === 'x' ? [j.w + 0.12, j.h + 0.12, 0.1] : [0.1, j.h + 0.12, j.w + 0.12];
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={frame} />
        <meshStandardMaterial color="#2b2f36" roughness={0.5} metalness={0.3} />
      </mesh>
      {glass && (
        <mesh>
          <boxGeometry args={glassSize} />
          <meshStandardMaterial color="#a9c7e0" transparent opacity={0.4} roughness={0.05} metalness={0.2} depthWrite={false} />
        </mesh>
      )}
    </group>
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

function CeilingFixture({ room, lit }: { room: Room; lit: boolean }) {
  const [x1, z1, x2, z2] = room.rect;
  return (
    <mesh position={[(x1 + x2) / 2, APT.wallHeight - 0.06, (z1 + z2) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.18, 20]} />
      <meshStandardMaterial color={lit ? '#fff3d6' : '#c7ccd1'} emissive={lit ? '#ffcf87' : '#000000'} emissiveIntensity={lit ? 1.4 : 0} />
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
  return <pointLight position={[(x1 + x2) / 2, 2.35, (z1 + z2) / 2]} intensity={6} distance={6} decay={2} color="#ffe6bf" />;
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
          width: 20,
          height: 20,
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

/** Modelo 3D real do projeto (.glb/.gltf), centralizado e escalado para caber. */
function RealModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const ref = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.z) || 1;
    const scale = 11 / maxDim; // caber ~11 m de largura, como o apê gerado
    cloned.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        (o as THREE.Mesh).castShadow = true;
        (o as THREE.Mesh).receiveShadow = true;
      }
    });
    if (ref.current) {
      ref.current.scale.setScalar(scale);
      ref.current.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    }
  }, [cloned]);

  return (
    <group ref={ref}>
      <primitive object={cloned} />
    </group>
  );
}

interface Props {
  hotspots: Hotspot[];
  cronograma: CronogramaItem[];
  onOpenRaioX: (tit: string, url: string) => void;
  canUpload: boolean;
}

export default function Planta3D({ hotspots, cronograma, onOpenRaioX, canUpload }: Props) {
  // Abre na casa pronta (última fase). O cliente arrasta para "voltar no tempo".
  const [step, setStep] = useState(PHASES.length - 1);
  const [teto, setTeto] = useState(true);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modo, setModo] = useState<'gerado' | 'real'>('gerado');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getModel3dUrl().then((url) => {
      // Padrão: a casa Craftsman (mesma da "Casa Realista"). O engenheiro pode
      // subir o modelo real dele, ou usar a aba "Gerado" (linha do tempo da obra).
      setModelUrl(url ?? '/modelo-exemplo.gltf');
      setModo('real');
    });
  }, []);

  const carregarModelo = async (url: string) => {
    setModelUrl(url);
    setModo('real');
    await setModel3dUrl(url);
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadModel(file);
      await carregarModelo(url);
    } finally {
      setBusy(false);
    }
  };

  const fase = PHASES[step];
  const wallStage: WallStage = step >= 7 ? 'pintura' : step >= 5 ? 'reboco' : 'bloco';

  const showFooting = step >= 1;
  const showWalls = step >= 2;
  const showRoof = step >= 3;
  const showPipes = step === 4;
  const showFloor = step >= 6;
  const showFixtures = step >= 5;
  const fixturesLit = step >= 7;
  const showLights = step >= 7;
  const showWindows = step >= 7;
  const showGlass = step >= 8;
  const showDoors = step >= 8;
  const showFurniture = step >= 8;
  const showPins = step >= 2;
  const padConcrete = step >= 1;

  const go = (delta: number) => setStep((s) => Math.max(0, Math.min(PHASES.length - 1, s + delta)));

  return (
    <div className="relative w-full h-[400px] md:h-[600px] rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#0d0e12] to-[#14161a] border border-white/5">
      <Canvas shadows camera={{ position: [10, 6.5, 12], fov: 36 }} dpr={[1, 2]} gl={{ antialias: true, toneMappingExposure: 1.15 }}>
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

        {/* Terreno do entorno */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color="#0c0d11" roughness={1} />
        </mesh>

        <ContactShadows position={[0, 0.02, 0]} scale={17} resolution={1024} blur={2.6} opacity={0.55} far={7} />

        {modo === 'real' && modelUrl ? (
          <Suspense fallback={null}>
            <RealModel url={modelUrl} />
          </Suspense>
        ) : (
          <group position={CENTER_OFFSET}>
            {/* Lote / contrapiso da obra */}
            <mesh position={[APT.width / 2, 0, APT.depth / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[APT.width, APT.depth]} />
              <meshStandardMaterial color={padConcrete ? '#3a3d44' : '#5a4a38'} roughness={0.98} />
            </mesh>

            {showFooting && WALLS.map((seg, i) => <Footing key={i} seg={seg} />)}
            {showFloor && ROOMS.map((r) => <RoomFloor key={r.nome} room={r} />)}
            {showWalls && WALLS.map((seg, i) => <Wall key={i} seg={seg} stage={wallStage} />)}
            {showWalls && <Porch />}
            {showPipes && INSTALACOES.map((t, i) => <Pipe key={i} t={t} />)}
            {showWindows && WINDOWS.map((j, i) => <WindowPane key={i} j={j} glass={showGlass} />)}
            {showDoors && DOORS.map((d, i) => <DoorLeaf key={i} d={d} />)}

            {showRoof && teto && (
              <>
                <GableRoof />
                <PorchRoof />
              </>
            )}
            {showFixtures && ROOMS.map((r) => <CeilingFixture key={r.nome} room={r} lit={fixturesLit} />)}

            {showFurniture && (
              <>
                {FURNITURE.map((p, i) => (
                  <Furniture key={i} piece={p} />
                ))}
                <Plant pos={[0.5, 0.5]} />
                <Plant pos={[7.4, 3.6]} />
                <Plant pos={[11.4, 0.5]} />
              </>
            )}

            {showLights && ROOMS.map((r) => <RoomLight key={r.nome} room={r} />)}
            {/* pontos de foto só aparecem com o teto aberto (senão flutuam sobre o telhado) */}
            {showPins && !teto && hotspots.map((h) => <HotspotPin key={h.id} h={h} onOpen={onOpenRaioX} />)}
          </group>
        )}

        <OrbitControls enablePan minDistance={6} maxDistance={26} maxPolarAngle={Math.PI / 2.15} target={[0, 0, 0]} />
      </Canvas>

      {/* Painel: linha do tempo (gerado) ou modelo real, + upload do Engenheiro */}
      <div className="absolute top-3 left-3 w-[240px] max-w-[calc(100%-1.5rem)] bg-black/75 backdrop-blur-md p-3 rounded-2xl border border-white/10">
        {modelUrl && (
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl mb-3">
            {(['gerado', 'real'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setModo(m)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  modo === m ? 'bg-[#ffb7c5] text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {m === 'gerado' ? 'Gerado' : 'Modelo real'}
              </button>
            ))}
          </div>
        )}

        {modo === 'gerado' ? (
          <>
            <p className="text-[9px] font-black text-[#ffb7c5] uppercase tracking-widest mb-2">Acompanhe a obra</p>

            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => go(-1)}
                disabled={step === 0}
                aria-label="Etapa anterior"
                className="shrink-0 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">
                  Etapa {step + 1} de {PHASES.length}
                </p>
                <p className="text-sm font-black uppercase italic tracking-tight text-white truncate">{fase.nome}</p>
                <p className="text-[9px] text-gray-400 font-medium leading-tight">{fase.desc}</p>
              </div>
              <button
                onClick={() => go(1)}
                disabled={step === PHASES.length - 1}
                aria-label="Próxima etapa"
                className="shrink-0 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <input
              type="range"
              min={0}
              max={PHASES.length - 1}
              value={step}
              onChange={(e) => setStep(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: '#ffb7c5' }}
              aria-label="Fase da obra"
            />

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => setStep(stepFromCronograma(cronograma))}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-500/90 text-black hover:bg-emerald-400 transition-all"
              >
                <CalendarClock size={12} /> Obra hoje
              </button>
              <button
                onClick={() => setTeto((t) => !t)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  teto ? 'bg-[#ffb7c5] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Home size={12} /> Teto
              </button>
            </div>
          </>
        ) : (
          <div>
            <p className="text-[9px] font-black text-[#ffb7c5] uppercase tracking-widest mb-1">Modelo do projeto</p>
            <p className="text-[10px] text-gray-400 font-medium leading-snug">Modelo 3D real carregado. Arraste para girar e role para dar zoom.</p>
          </div>
        )}

        {canUpload && (
          <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
            <label className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 transition-all">
              <input type="file" accept=".glb,.gltf" className="hidden" onChange={onUpload} />
              <Upload size={12} /> {busy ? 'Enviando...' : 'Subir .glb'}
            </label>
            <button
              onClick={() => carregarModelo('/modelo-exemplo.gltf')}
              className="px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white/5 text-gray-300 hover:bg-white/10 transition-all"
            >
              Exemplo
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-2 rounded-xl">
        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Arraste para girar · role para zoom</p>
      </div>
    </div>
  );
}
