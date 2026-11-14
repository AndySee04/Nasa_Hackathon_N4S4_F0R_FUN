import { Html, OrbitControls, Stars } from '@react-three/drei'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { BODIES, type Body } from '../data/planets'

/**
 * Procedural planet textures drawn on a canvas, so the scene needs no large image downloads.
 * (Swap in real NASA texture maps from /public/textures later if bandwidth allows.)
 */
function makeTexture(body: Body): THREE.CanvasTexture {
  const w = 256
  const h = 128
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const [a, b] = body.colors
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, a)
  grad.addColorStop(0.5, b)
  grad.addColorStop(1, a)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Deterministic pseudo-random so textures look the same on every visit.
  let seed = body.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  if (body.banded) {
    for (let y = 0; y < h; y += 4 + Math.floor(rand() * 8)) {
      ctx.fillStyle = rand() > 0.5 ? `${a}55` : `${b}66`
      ctx.fillRect(0, y, w, 2 + rand() * 6)
    }
    if (body.id === 'jupiter') {
      ctx.fillStyle = '#c2553a'
      ctx.beginPath()
      ctx.ellipse(170, 78, 16, 8, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (body.id === 'earth') {
    ctx.fillStyle = '#3fae6a'
    for (let i = 0; i < 14; i++) {
      ctx.beginPath()
      ctx.ellipse(rand() * w, 25 + rand() * 78, 10 + rand() * 26, 6 + rand() * 14, rand() * 3, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, 7)
    ctx.fillRect(0, h - 7, w, 7)
  } else if (body.id !== 'sun') {
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = `rgba(0,0,0,${0.08 + rand() * 0.15})`
      ctx.beginPath()
      ctx.arc(rand() * w, rand() * h, 1 + rand() * 6, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

interface PlanetProps {
  body: Body
  selected: boolean
  onSelect?: (id: string) => void
  motionScale: number
}

function Planet({ body, selected, onSelect, motionScale }: PlanetProps) {
  const group = useRef<THREE.Group>(null)
  const mesh = useRef<THREE.Mesh>(null)
  const moonPivot = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const texture = useMemo(() => makeTexture(body), [body])
  // Start each planet at a different point on its orbit.
  const startAngle = useMemo(() => (body.orbit * 1.7) % (Math.PI * 2), [body.orbit])

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime() * 0.12 * motionScale
    if (group.current && body.orbit > 0) {
      const angle = startAngle + t * body.speed
      group.current.position.set(Math.cos(angle) * body.orbit, 0, Math.sin(angle) * body.orbit)
    }
    if (mesh.current) mesh.current.rotation.y += delta * 0.3 * motionScale
    if (moonPivot.current) moonPivot.current.rotation.y += delta * 0.8 * motionScale
  })

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect?.(body.id)
  }

  const isSun = body.id === 'sun'

  return (
    <>
      {body.orbit > 0 && (
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={[body.orbit - 0.02, body.orbit + 0.02, 128]} />
          <meshBasicMaterial color={selected ? '#22d3ee' : '#7f8bc4'} transparent opacity={selected ? 0.7 : 0.18} side={THREE.DoubleSide} />
        </mesh>
      )}
      <group ref={group}>
        <mesh
          ref={mesh}
          onClick={handleClick}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
            document.body.style.cursor = onSelect ? 'pointer' : 'auto'
          }}
          onPointerOut={() => {
            setHovered(false)
            document.body.style.cursor = 'auto'
          }}
          scale={hovered || selected ? 1.12 : 1}
        >
          <sphereGeometry args={[body.size, 40, 40]} />
          {isSun ? (
            <meshBasicMaterial map={texture} color="#ffd36b" />
          ) : (
            <meshStandardMaterial map={texture} roughness={0.85} metalness={0.05} />
          )}
        </mesh>

        {isSun && (
          <mesh>
            <sphereGeometry args={[body.size * 1.35, 32, 32]} />
            <meshBasicMaterial color="#ff9d2e" transparent opacity={0.12} depthWrite={false} />
          </mesh>
        )}

        {body.rings && (
          <mesh rotation={[-Math.PI / 2.4, 0, 0]}>
            <ringGeometry args={[body.size * 1.35, body.size * 2.2, 64]} />
            <meshBasicMaterial color="#e6d3a3" transparent opacity={0.55} side={THREE.DoubleSide} />
          </mesh>
        )}

        {body.id === 'earth' && (
          <group ref={moonPivot}>
            <mesh position={[1.15, 0.1, 0]} onClick={(e) => { e.stopPropagation(); onSelect?.('moon') }}>
              <sphereGeometry args={[0.18, 24, 24]} />
              <meshStandardMaterial color="#c9c9cf" roughness={1} />
            </mesh>
          </group>
        )}

        {(hovered || selected) && (
          <Html center distanceFactor={18} position={[0, body.size + 0.9, 0]} style={{ pointerEvents: 'none' }}>
            <div className="whitespace-nowrap rounded-full border border-cyan/50 bg-space-900/90 px-3 py-1 font-display text-sm font-semibold text-ink">
              {body.name}
            </div>
          </Html>
        )}
      </group>
    </>
  )
}

interface SceneProps {
  selectedId?: string | null
  onSelect?: (id: string) => void
  /** Hero mode: slow auto-rotation and no zoom, so the page can still scroll. */
  hero?: boolean
  className?: string
}

export default function SpaceScene({ selectedId = null, onSelect, hero = false, className = '' }: SceneProps) {
  const motionScale = prefersReducedMotion() ? 0 : 1
  return (
    <div className={className}>
      <Canvas
        camera={{ position: hero ? [0, 13, 26] : [0, 16, 30], fov: 45 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onPointerMissed={() => onSelect?.('')}
      >
        <color attach="background" args={['#050816']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[0, 0, 0]} intensity={600} distance={120} decay={2} color="#fff1d6" />
        <Stars radius={90} depth={40} count={hero ? 2000 : 3000} factor={4} saturation={0} fade speed={motionScale} />
        {BODIES.map((body) => (
          <Planet key={body.id} body={body} selected={selectedId === body.id} onSelect={onSelect} motionScale={motionScale} />
        ))}
        <OrbitControls
          enablePan={false}
          enableZoom={!hero}
          minDistance={8}
          maxDistance={55}
          autoRotate={hero && motionScale > 0}
          autoRotateSpeed={0.35}
          maxPolarAngle={Math.PI * 0.48}
        />
      </Canvas>
    </div>
  )
}
