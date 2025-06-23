import React from 'react'

export interface BubbleProps {
  size?: number
  gradient?: 'pink' | 'purple' | 'blue' | 'cyan' | 'rainbow'
  opacity?: number
  className?: string
  animated?: boolean
  animationType?: 'float' | 'bounce' | 'pulse' | 'static'
  glowIntensity?: 'none' | 'low' | 'medium' | 'high'
}

export const AnimatedBubble: React.FC<BubbleProps> = ({
  size = 32,
  gradient = 'blue',
  opacity = 0.7,
  className = '',
  animated = true,
  animationType = 'float',
  glowIntensity = 'medium'
}) => {
  const gradientId = `bubble-gradient-${gradient}-${Math.random().toString(36).substr(2, 9)}`
  
  const gradientColors = {
    pink: ['#fbb6ce', '#f687b3', '#ed64a6'],
    purple: ['#d6bcfa', '#b794f6', '#9f7aea'],
    blue: ['#90cdf4', '#63b3ed', '#4299e1'],
    cyan: ['#9decf9', '#76e4f7', '#0bc5ea'],
    rainbow: ['#fbb6ce', '#d6bcfa', '#90cdf4']
  }

  const glowFilters = {
    none: '',
    low: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.2))',
    medium: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))',
    high: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.5))'
  }

  const animationClasses = {
    float: 'animate-bubble-float',
    bounce: 'animate-bounce',
    pulse: 'animate-pulse',
    static: ''
  }

  return (
    <div 
      className={`inline-block ${animated ? animationClasses[animationType] : ''} ${className}`}
      style={{ 
        filter: glowFilters[glowIntensity],
        transition: 'all 0.3s ease'
      }}
    >
      <svg 
        width={size} 
        height={size} 
        style={{ opacity }}
        viewBox="0 0 100 100"
        className="bubble-svg"
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
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Shimmer effect */}
          <linearGradient id={`shimmer-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.3)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              values="-100 -100; 100 100; -100 -100"
              dur="3s"
              repeatCount="indefinite"
            />
          </linearGradient>
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
        
        {/* Primary highlight for 3D effect */}
        <ellipse 
          cx="35" 
          cy="35" 
          rx="12" 
          ry="8" 
          fill="rgba(255, 255, 255, 0.6)"
          opacity="0.8"
        />
        
        {/* Secondary highlight */}
        <circle 
          cx="65" 
          cy="25" 
          r="3" 
          fill="rgba(255, 255, 255, 0.8)"
        />
        
        {/* Shimmer overlay */}
        <circle 
          cx="50" 
          cy="50" 
          r="45" 
          fill={`url(#shimmer-${gradientId})`}
          opacity="0.4"
        />
        
        {/* Subtle inner glow */}
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="0.5"
          opacity="0.6"
        />
      </svg>
    </div>
  )
}

// Preset bubble components for common use cases
export const LargeBubble: React.FC<Omit<BubbleProps, 'size'>> = (props) => (
  <AnimatedBubble size={48} {...props} />
)

export const MediumBubble: React.FC<Omit<BubbleProps, 'size'>> = (props) => (
  <AnimatedBubble size={32} {...props} />
)

export const SmallBubble: React.FC<Omit<BubbleProps, 'size'>> = (props) => (
  <AnimatedBubble size={24} {...props} />
)

export const TinyBubble: React.FC<Omit<BubbleProps, 'size'>> = (props) => (
  <AnimatedBubble size={16} {...props} />
)

// Floating bubble group component
export const FloatingBubbles: React.FC<{
  count?: number
  className?: string
}> = ({ count = 6, className = '' }) => {
  const bubbles = Array.from({ length: count }, (_, i) => {
    const sizes = [16, 20, 24, 28, 32]
    const gradients: BubbleProps['gradient'][] = ['pink', 'purple', 'blue', 'cyan']
    const delays = ['0s', '0.5s', '1s', '1.5s', '2s', '2.5s']
    
    return (
      <div
        key={i}
        className="absolute animate-bubble-float"
        style={{
          left: `${Math.random() * 80 + 10}%`,
          animationDelay: delays[i % delays.length],
          animationDuration: `${6 + Math.random() * 4}s`
        }}
      >
        <AnimatedBubble
          size={sizes[i % sizes.length]}
          gradient={gradients[i % gradients.length]}
          opacity={0.4 + Math.random() * 0.3}
          animated={false}
          glowIntensity="low"
        />
      </div>
    )
  })

  return (
    <div className={`relative w-full h-full overflow-hidden pointer-events-none ${className}`}>
      {bubbles}
    </div>
  )
}
