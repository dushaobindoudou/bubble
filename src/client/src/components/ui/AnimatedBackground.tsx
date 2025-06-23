import React, { useEffect, useState } from 'react'
import { FullscreenBubbleEffect } from './FullscreenBubbleEffect'

// Enhanced SVG Bubble Component with improved animations
const SVGBubble: React.FC<{
  size: number;
  className?: string;
  opacity?: number;
  gradient?: 'pink' | 'purple' | 'blue' | 'cyan';
  animationDelay?: number;
}> = ({ size, className = '', opacity = 0.7, gradient = 'blue', animationDelay = 0 }) => {
  const gradientId = `bubble-gradient-${gradient}-${Math.random().toString(36).substr(2, 9)}`

  const gradientColors = {
    pink: ['#fbb6ce', '#f687b3', '#ed64a6'],
    purple: ['#d6bcfa', '#b794f6', '#9f7aea'],
    blue: ['#90cdf4', '#63b3ed', '#4299e1'],
    cyan: ['#9decf9', '#76e4f7', '#0bc5ea']
  }

  return (
    <svg
      width={size}
      height={size}
      className={`bubble-svg ${className}`}
      style={{
        opacity,
        animationDelay: `${animationDelay}s`
      }}
      viewBox="0 0 100 100"
    >
      <defs>
        <radialGradient id={gradientId} cx="30%" cy="30%">
          <stop offset="0%" stopColor={gradientColors[gradient][0]} stopOpacity="0.9" />
          <stop offset="50%" stopColor={gradientColors[gradient][1]} stopOpacity="0.7" />
          <stop offset="100%" stopColor={gradientColors[gradient][2]} stopOpacity="0.5" />
        </radialGradient>

        {/* Enhanced glow filter */}
        <filter id={`bubble-glow-${gradientId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(255,255,255,0.3)"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Floating animation for internal elements */}
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 50 50;360 50 50;0 50 50"
          dur={`${8 + Math.random() * 4}s`}
          repeatCount="indefinite"
        />
      </defs>

      {/* Main bubble */}
      <circle
        cx="50"
        cy="50"
        r="45"
        fill={`url(#${gradientId})`}
        filter={`url(#bubble-glow-${gradientId})`}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="1"
      />

      {/* Animated highlight for 3D effect */}
      <ellipse
        cx="35"
        cy="35"
        rx="12"
        ry="8"
        fill="rgba(255, 255, 255, 0.6)"
        opacity="0.8"
      >
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0;2 -1;0 0;-1 1;0 0"
          dur="6s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* Small animated highlight */}
      <circle
        cx="65"
        cy="25"
        r="3"
        fill="rgba(255, 255, 255, 0.8)"
      >
        <animate
          attributeName="opacity"
          values="0.8;1;0.8;0.6;0.8"
          dur="4s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  )
}

// Dynamic bubble generator for fullscreen effects
const DynamicBubble: React.FC<{
  id: number;
  onComplete: (id: number) => void;
}> = ({ id, onComplete }) => {
  const [position, setPosition] = useState({
    x: Math.random() * 100,
    y: 100 + Math.random() * 20
  })

  const size = 12 + Math.random() * 40
  const gradient = (['pink', 'purple', 'blue', 'cyan'] as const)[Math.floor(Math.random() * 4)]
  const duration = 8 + Math.random() * 8
  const horizontalDrift = (Math.random() - 0.5) * 60

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(id)
    }, duration * 1000)

    return () => clearTimeout(timer)
  }, [id, duration, onComplete])

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${position.x}%`,
        bottom: `${position.y}%`,
        animation: `fullscreenBubbleFloat ${duration}s linear forwards`,
        '--horizontal-drift': `${horizontalDrift}px`
      } as React.CSSProperties}
    >
      <SVGBubble
        size={size}
        gradient={gradient}
        opacity={0.4 + Math.random() * 0.4}
      />
    </div>
  )
}

interface AnimatedBackgroundProps {
  variant?: 'default' | 'minimal' | 'intense'
  interactive?: boolean
  showParticles?: boolean
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  variant = 'default',
  interactive = true,
  showParticles = true
}) => {
  const [dynamicBubbles, setDynamicBubbles] = useState<number[]>([])
  const [nextBubbleId, setNextBubbleId] = useState(0)

  // Variant configurations
  const variantConfig = {
    minimal: {
      bubbleIntensity: 'low' as const,
      staticBubbles: 3,
      dynamicBubbles: 2,
      particles: 8,
      orbCount: 2
    },
    default: {
      bubbleIntensity: 'medium' as const,
      staticBubbles: 6,
      dynamicBubbles: 3,
      particles: 15,
      orbCount: 4
    },
    intense: {
      bubbleIntensity: 'high' as const,
      staticBubbles: 9,
      dynamicBubbles: 5,
      particles: 25,
      orbCount: 6
    }
  }

  const config = variantConfig[variant]

  // Generate new bubbles continuously
  useEffect(() => {
    if (variant === 'minimal') return // Skip dynamic bubbles for minimal variant

    const generateBubble = () => {
      setDynamicBubbles(prev => [...prev, nextBubbleId])
      setNextBubbleId(prev => prev + 1)
    }

    // Initial bubbles
    for (let i = 0; i < config.dynamicBubbles; i++) {
      setTimeout(generateBubble, i * 1000)
    }

    // Continuous generation
    const interval = setInterval(generateBubble, 3000 + Math.random() * 4000)

    return () => clearInterval(interval)
  }, [nextBubbleId, variant, config.dynamicBubbles])

  const handleBubbleComplete = (id: number) => {
    setDynamicBubbles(prev => prev.filter(bubbleId => bubbleId !== id))
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Enhanced Multi-layer Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800" />
      <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 via-transparent to-cyan-500/20 animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-blue-400/10 to-purple-500/20 animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Enhanced Floating Orbs with movement */}
      {config.orbCount >= 2 && (
        <>
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/30 rounded-full blur-xl animate-float-orbital" />
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-blue-500/30 rounded-full blur-xl animate-float-orbital-reverse" />
        </>
      )}
      {config.orbCount >= 4 && (
        <>
          <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-pink-500/30 rounded-full blur-xl animate-float-orbital-slow" />
          <div className="absolute top-1/2 right-1/3 w-28 h-28 bg-cyan-500/25 rounded-full blur-xl animate-float-orbital" style={{ animationDelay: '2s' }} />
        </>
      )}
      {config.orbCount >= 6 && (
        <>
          <div className="absolute top-1/3 left-1/2 w-16 h-16 bg-yellow-500/25 rounded-full blur-xl animate-float-orbital-reverse" style={{ animationDelay: '3s' }} />
          <div className="absolute bottom-1/3 right-1/2 w-22 h-22 bg-green-500/25 rounded-full blur-xl animate-float-orbital-slow" style={{ animationDelay: '4s' }} />
        </>
      )}

      {/* Static Decorative Bubbles */}
      <div className="bubble-container absolute inset-0">
        {/* Render bubbles based on variant configuration */}
        {Array.from({ length: config.staticBubbles }, (_, i) => {
          const bubbleTypes = [
            { size: 48, gradient: 'blue' as const, animation: 'animate-bubble-float' },
            { size: 52, gradient: 'purple' as const, animation: 'animate-bubble-float-slow' },
            { size: 46, gradient: 'cyan' as const, animation: 'animate-bubble-float-fast' },
            { size: 32, gradient: 'pink' as const, animation: 'animate-bubble-float' },
            { size: 36, gradient: 'blue' as const, animation: 'animate-bubble-float-slow' },
            { size: 30, gradient: 'cyan' as const, animation: 'animate-bubble-float-fast' },
            { size: 24, gradient: 'pink' as const, animation: 'animate-bubble-float' },
            { size: 26, gradient: 'blue' as const, animation: 'animate-bubble-float-fast' },
            { size: 22, gradient: 'purple' as const, animation: 'animate-bubble-float-slow' }
          ]

          const bubble = bubbleTypes[i % bubbleTypes.length]
          const positionClass = `bubble-${i + 1}`

          return (
            <div key={i + Math.random()} className={`bubble ${positionClass} ${bubble.animation}`}>
              <SVGBubble
                size={bubble.size}
                gradient={bubble.gradient}
                opacity={variant === 'minimal' ? 0.3 : 0.5}
                animationDelay={i * 0.5}
              />
            </div>
          )
        })}
      </div>

      {/* Enhanced Fullscreen Bubble Effect */}
      <FullscreenBubbleEffect
        intensity={config.bubbleIntensity}
        interactive={interactive}
        className="absolute inset-0 z-10"
      />

      {/* Dynamic Legacy Bubbles (Reduced for performance) */}
      {variant !== 'minimal' && (
        <div className="absolute inset-0 pointer-events-none z-5">
          {dynamicBubbles.slice(0, config.dynamicBubbles).map(id => (
            <DynamicBubble
              key={id + Math.random()}
              id={id}
              onComplete={handleBubbleComplete}
            />
          ))}
        </div>
      )}

      {/* Animated Particle Layer */}
      {showParticles && (
        <div className="absolute inset-0 opacity-20 z-1">
          <div className="particle-field">
            {Array.from({ length: config.particles }, (_, i) => (
              <div
                key={i + "-particle"}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${15 + Math.random() * 15}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Soft Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Subtle vignette effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20" />
    </div>
  )
}

// Preset background variants for different use cases
export const MinimalBackground: React.FC = () => (
  <AnimatedBackground variant="minimal" interactive={false} showParticles={false} />
)

export const DefaultBackground: React.FC = () => (
  <AnimatedBackground variant="default" interactive={true} showParticles={true} />
)

export const IntenseBackground: React.FC = () => (
  <AnimatedBackground variant="intense" interactive={true} showParticles={true} />
)

// Game-specific background for different game states
export const LoginBackground: React.FC = () => (
  <AnimatedBackground variant="default" interactive={true} showParticles={true} />
)

export const GameBackground: React.FC = () => (
  <AnimatedBackground variant="minimal" interactive={false} showParticles={false} />
)

export const MenuBackground: React.FC = () => (
  <AnimatedBackground variant="intense" interactive={true} showParticles={true} />
)
