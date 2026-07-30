import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { APT, CENTER_OFFSET, ROOMS, WALLS, type Room } from '../lib/apartmentModel';

function Wall({ seg }: { seg: [number, number, number, number] }) {
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
      <meshStandardMaterial color="#e8e8ea" transparent opacity={0.45} roughness={0.6} metalness={0.1} />
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
    <group>
      {/* Piso tingido do cômodo */}
      <mesh position={[cx, 0.02, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w - 0.1, d - 0.1]} />
        <meshStandardMaterial color={room.cor} transparent opacity={0.28} />
      </mesh>
      {/* Rótulo flutuante */}
      <Html position={[cx, 0.9, cz]} center distanceFactor={14}>
        <div
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 800,
            fontSize: '12px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: '#fff',
            whiteSpace: 'nowrap',
            textShadow: '0 2px 8px rgba(0,0,0,.8)',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          {room.nome}
        </div>
      </Html>
    </group>
  );
}

export default function Planta3D() {
  return (
    <div className="w-full h-[400px] md:h-[600px] rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#0d0e12] to-[#14161a] border border-white/5">
      <Canvas shadows camera={{ position: [0, 10, 12], fov: 38 }} dpr={[1, 2]}>
        <color attach="background" args={['#0a0b0d']} />
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[8, 14, 6]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-6, 8, -4]} intensity={0.35} color="#ffb7c5" />

        <group position={CENTER_OFFSET}>
          {/* Piso base */}
          <mesh position={[APT.width / 2, 0, APT.depth / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[APT.width, APT.depth]} />
            <meshStandardMaterial color="#1a1c22" roughness={0.9} />
          </mesh>

          {ROOMS.map((r) => (
            <RoomFloor key={r.nome} room={r} />
          ))}

          {WALLS.map((seg, i) => (
            <Wall key={i} seg={seg} />
          ))}
        </group>

        <OrbitControls
          enablePan
          minDistance={6}
          maxDistance={26}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
