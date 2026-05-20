"use client"

import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"

const PARTICLE_COUNT = 180

function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const speeds = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2
      speeds[i] = 0.002 + Math.random() * 0.006
    }

    return { positions, speeds }
  }, [])

  useFrame((_, delta) => {
    const points = pointsRef.current
    if (!points) return

    const pos = points.geometry.attributes.position
    if (!pos) return

    const arr = pos.array as Float32Array

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const speed = speeds[i] ?? 0.004
      const y = arr[i * 3 + 1] ?? 0
      arr[i * 3 + 1] = y + speed * delta * 60
      if (arr[i * 3 + 1]! > 8) {
        arr[i * 3 + 1] = -8
        arr[i * 3] = (Math.random() - 0.5) * 24
      }
    }

    pos.needsUpdate = true
    points.rotation.y += delta * 0.015
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={PARTICLE_COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#fff8f0"
        size={0.045}
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

export function LandingThreeAtmosphere() {
  return (
    <group>
      <ambientLight intensity={0.4} />
      <FloatingParticles />
    </group>
  )
}
