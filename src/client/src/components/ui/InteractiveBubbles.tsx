import React, { useState, useCallback } from 'react'
import { AnimatedBubble } from './AnimatedBubble'

interface InteractiveBubbleProps {
  size?: number
  gradient?: 'pink' | 'purple' | 'blue' | 'cyan' | 'rainbow'
  className?: string
  onClick?: () => void
}

export const InteractiveBubble: React.FC<InteractiveBubbleProps> = ({
  size = 32,
  gradient = 'blue',
  className = '',
  onClick
}) => {
  const [isPopped, setIsPopped] = useState(false)

  const handleClick = useCallback(() => {
    setIsPopped(true)
    onClick?.()
    
    // Reset after animation
    setTimeout(() => {
      setIsPopped(false)
    }, 300)
  }, [onClick])

  return (
    <div 
      className={`cursor-pointer transition-transform duration-200 hover:scale-110 ${
        isPopped ? 'animate-bubble-pop' : ''
      } ${className}`}
      onClick={handleClick}
    >
      <AnimatedBubble
        size={size}
        gradient={gradient}
        opacity={0.8}
        glowIntensity="medium"
        animationType="pulse"
      />
    </div>
  )
}

// Floating bubble cluster for decorative purposes
export const BubbleCluster: React.FC<{
  count?: number
  className?: string
  interactive?: boolean
}> = ({ count = 5, className = '', interactive = false }) => {
  const bubbles = Array.from({ length: count }, (_, i) => {
    const sizes = [16, 20, 24, 28, 32]
    const gradients: Array<'pink' | 'purple' | 'blue' | 'cyan'> = ['pink', 'purple', 'blue', 'cyan']
    const positions = [
      { top: '10%', left: '20%' },
      { top: '30%', right: '15%' },
      { bottom: '25%', left: '10%' },
      { top: '60%', right: '25%' },
      { bottom: '10%', right: '10%' }
    ]

    const BubbleComponent = interactive ? InteractiveBubble : AnimatedBubble

    return (
      <div
        key={i}
        className="absolute animate-gentle-float"
        style={{
          ...positions[i % positions.length],
          animationDelay: `${i * 0.5}s`,
          zIndex: 1
        }}
      >
        {interactive ? (
          <InteractiveBubble
            size={sizes[i % sizes.length]}
            gradient={gradients[i % gradients.length]}
          />
        ) : (
          <AnimatedBubble
            size={sizes[i % sizes.length]}
            gradient={gradients[i % gradients.length]}
            opacity={0.4 + Math.random() * 0.3}
            animationType="pulse"
            glowIntensity="low"
          />
        )}
      </div>
    )
  })

  return (
    <div className={`relative w-full h-full pointer-events-none ${className}`}>
      {bubbles}
    </div>
  )
}

// Bubble trail effect for mouse interactions
export const BubbleTrail: React.FC<{
  isActive: boolean
  className?: string
}> = ({ isActive, className = '' }) => {
  const [trails, setTrails] = useState<Array<{
    id: number
    x: number
    y: number
    timestamp: number
  }>>([])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isActive) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newTrail = {
      id: Date.now(),
      x,
      y,
      timestamp: Date.now()
    }

    setTrails(prev => [...prev.slice(-5), newTrail])

    // Clean up old trails
    setTimeout(() => {
      setTrails(prev => prev.filter(trail => trail.id !== newTrail.id))
    }, 1000)
  }, [isActive])

  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      onMouseMove={handleMouseMove}
    >
      {trails.map((trail, index) => (
        <div
          key={trail.id}
          className="absolute animate-bubble-pop"
          style={{
            left: trail.x - 8,
            top: trail.y - 8,
            animationDelay: `${index * 0.1}s`,
            opacity: 1 - (index * 0.2)
          }}
        >
          <AnimatedBubble
            size={16 - index * 2}
            gradient={['pink', 'purple', 'blue', 'cyan'][index % 4] as any}
            opacity={0.6 - index * 0.1}
            animationType="static"
            glowIntensity="low"
          />
        </div>
      ))}
    </div>
  )
}

// Bubble loading indicator
export const BubbleLoader: React.FC<{
  size?: 'small' | 'medium' | 'large'
  className?: string
}> = ({ size = 'medium', className = '' }) => {
  const sizes = {
    small: 16,
    medium: 24,
    large: 32
  }

  const bubbleSize = sizes[size]

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-bounce"
          style={{ animationDelay: `${i * 0.2}s` }}
        >
          <AnimatedBubble
            size={bubbleSize}
            gradient={['blue', 'purple', 'pink'][i] as any}
            opacity={0.7}
            animationType="pulse"
            glowIntensity="medium"
          />
        </div>
      ))}
    </div>
  )
}
