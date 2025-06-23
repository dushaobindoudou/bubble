import React, { useEffect, useState, useCallback, useRef } from 'react'
import { AnimatedBubble } from './AnimatedBubble'

interface BubbleInstance {
  id: number
  x: number
  y: number
  size: number
  gradient: 'pink' | 'purple' | 'blue' | 'cyan'
  speed: number
  horizontalDrift: number
  opacity: number
  rotation: number
}

interface FullscreenBubbleEffectProps {
  intensity?: 'low' | 'medium' | 'high'
  interactive?: boolean
  className?: string
}

export const FullscreenBubbleEffect: React.FC<FullscreenBubbleEffectProps> = ({
  intensity = 'medium',
  interactive = true,
  className = ''
}) => {
  const [bubbles, setBubbles] = useState<BubbleInstance[]>([])
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const nextIdRef = useRef(0)

  const intensitySettings = {
    low: { maxBubbles: 8, spawnRate: 3000 },
    medium: { maxBubbles: 12, spawnRate: 2000 },
    high: { maxBubbles: 18, spawnRate: 1500 }
  }

  const settings = intensitySettings[intensity]

  const createBubble = useCallback((): BubbleInstance => {
    const gradients: Array<'pink' | 'purple' | 'blue' | 'cyan'> = ['pink', 'purple', 'blue', 'cyan']
    
    return {
      id: nextIdRef.current++,
      x: Math.random() * 100,
      y: 110 + Math.random() * 20, // Start below screen
      size: 12 + Math.random() * 36,
      gradient: gradients[Math.floor(Math.random() * gradients.length)],
      speed: 0.5 + Math.random() * 1.5,
      horizontalDrift: (Math.random() - 0.5) * 80,
      opacity: 0.3 + Math.random() * 0.4,
      rotation: Math.random() * 360
    }
  }, [])

  const updateBubbles = useCallback(() => {
    setBubbles(prev => {
      const updated = prev
        .map(bubble => ({
          ...bubble,
          y: bubble.y - bubble.speed,
          rotation: bubble.rotation + bubble.speed * 2
        }))
        .filter(bubble => bubble.y > -20) // Remove bubbles that have floated off screen

      // Add new bubbles if needed
      if (updated.length < settings.maxBubbles && Math.random() < 0.3) {
        updated.push(createBubble())
      }

      return updated
    })
  }, [createBubble, settings.maxBubbles])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!interactive || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    })
  }, [interactive])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!interactive || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const clickX = ((e.clientX - rect.left) / rect.width) * 100
    const clickY = ((e.clientY - rect.top) / rect.height) * 100

    // Create burst of bubbles at click position
    const burstBubbles = Array.from({ length: 5 }, () => ({
      ...createBubble(),
      x: clickX + (Math.random() - 0.5) * 20,
      y: clickY,
      size: 8 + Math.random() * 16,
      speed: 1 + Math.random() * 2,
      opacity: 0.6 + Math.random() * 0.3
    }))

    setBubbles(prev => [...prev, ...burstBubbles])
  }, [interactive, createBubble])

  // Initialize bubbles
  useEffect(() => {
    const initialBubbles = Array.from({ length: settings.maxBubbles / 2 }, createBubble)
    setBubbles(initialBubbles)
  }, [createBubble, settings.maxBubbles])

  // Animation loop
  useEffect(() => {
    const interval = setInterval(updateBubbles, 50) // 20 FPS for smooth animation
    return () => clearInterval(interval)
  }, [updateBubbles])

  // Spawn new bubbles periodically
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      setBubbles(prev => {
        if (prev.length < settings.maxBubbles) {
          return [...prev, createBubble()]
        }
        return prev
      })
    }, settings.spawnRate + Math.random() * 1000)

    return () => clearInterval(spawnInterval)
  }, [createBubble, settings])

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}
      onMouseMove={interactive ? handleMouseMove : undefined}
      onClick={interactive ? handleClick : undefined}
      style={{ pointerEvents: interactive ? 'auto' : 'none' }}
    >
      {bubbles.map(bubble => {
        // Calculate influence of mouse position on bubble movement
        const mouseInfluence = interactive ? {
          x: (mousePosition.x - bubble.x) * 0.1,
          y: (mousePosition.y - bubble.y) * 0.1
        } : { x: 0, y: 0 }

        return (
          <div
            key={bubble.id}
            className="absolute transition-transform duration-100 ease-out"
            style={{
              left: `${bubble.x + mouseInfluence.x}%`,
              top: `${bubble.y + mouseInfluence.y}%`,
              transform: `translate(-50%, -50%) rotate(${bubble.rotation}deg)`,
              zIndex: Math.floor(bubble.size / 10)
            }}
          >
            <AnimatedBubble
              size={bubble.size}
              gradient={bubble.gradient}
              opacity={bubble.opacity}
              animationType="static"
              glowIntensity="low"
            />
          </div>
        )
      })}

      {/* Interactive cursor effect */}
      {interactive && (
        <div
          className="absolute pointer-events-none transition-all duration-300 ease-out"
          style={{
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
        </div>
      )}
    </div>
  )
}

// Preset configurations
export const LowIntensityBubbles: React.FC<{ className?: string }> = ({ className }) => (
  <FullscreenBubbleEffect intensity="low" interactive={false} className={className} />
)

export const MediumIntensityBubbles: React.FC<{ className?: string }> = ({ className }) => (
  <FullscreenBubbleEffect intensity="medium" interactive={true} className={className} />
)

export const HighIntensityBubbles: React.FC<{ className?: string }> = ({ className }) => (
  <FullscreenBubbleEffect intensity="high" interactive={true} className={className} />
)

// Background overlay component
export const BubbleOverlay: React.FC<{
  children: React.ReactNode
  intensity?: 'low' | 'medium' | 'high'
  interactive?: boolean
}> = ({ children, intensity = 'medium', interactive = true }) => (
  <div className="relative">
    <FullscreenBubbleEffect 
      intensity={intensity} 
      interactive={interactive}
      className="absolute inset-0 z-0"
    />
    <div className="relative z-10">
      {children}
    </div>
  </div>
)
