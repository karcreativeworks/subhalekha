"use client"

import { Canvas } from "@react-three/fiber"

import { LandingThreeAtmosphere } from "@/components/site/landing/landing-three-atmosphere"

export function LandingThreeCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      style={{ pointerEvents: "none" }}
    >
      <LandingThreeAtmosphere />
    </Canvas>
  )
}
