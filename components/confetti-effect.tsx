"use client"

import { useEffect, useState } from "react"

interface ConfettiEffectProps {
  trigger: boolean
  duration?: number
}

export function ConfettiEffect({ trigger, duration = 3000 }: ConfettiEffectProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>(
    [],
  )

  useEffect(() => {
    if (!trigger) return

    const colors = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"]
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
    }))

    setParticles(newParticles)

    const timer = setTimeout(() => {
      setParticles([])
    }, duration)

    return () => clearTimeout(timer)
  }, [trigger, duration])

  if (particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full animate-bounce"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}s`,
            animationDuration: "2s",
          }}
        />
      ))}
    </div>
  )
}
