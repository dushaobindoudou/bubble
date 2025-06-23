# Bubble UI Components

This directory contains the enhanced bubble UI system for Bubble Brawl, replacing emoji-based bubbles with sophisticated SVG animations and CSS effects.

## Components Overview

### AnimatedBubble.tsx
The core bubble component with customizable properties:

**Props:**
- `size`: Bubble diameter in pixels (default: 32)
- `gradient`: Color scheme - 'pink', 'purple', 'blue', 'cyan', 'rainbow'
- `opacity`: Transparency level (0-1, default: 0.7)
- `animated`: Enable/disable animations (default: true)
- `animationType`: 'float', 'bounce', 'pulse', 'static'
- `glowIntensity`: 'none', 'low', 'medium', 'high'

**Usage:**
```tsx
<AnimatedBubble 
  size={48} 
  gradient="rainbow" 
  opacity={0.8}
  animationType="pulse"
  glowIntensity="high"
/>
```

**Preset Components:**
- `LargeBubble` (48px)
- `MediumBubble` (32px) 
- `SmallBubble` (24px)
- `TinyBubble` (16px)

### InteractiveBubbles.tsx
Enhanced bubble components with user interaction:

**InteractiveBubble:**
- Clickable bubbles with pop animation
- Hover effects with scale transformation
- Customizable click handlers

**BubbleCluster:**
- Decorative floating bubble groups
- Configurable count and positioning
- Optional interactivity

**BubbleTrail:**
- Mouse-following bubble effects
- Temporary trail animations
- Performance-optimized cleanup

**BubbleLoader:**
- Loading indicator with animated bubbles
- Three size variants: small, medium, large
- Staggered bounce animations

### AnimatedBackground.tsx
Full-screen background with floating bubbles:

**Features:**
- 18 animated bubbles with varied sizes
- Multiple animation speeds (slow, normal, fast)
- Gradient background with floating orbs
- Performance-optimized with CSS transforms

## CSS Animations

### Core Animations
- `bubbleFloat`: Main upward floating animation
- `bubbleFloatSlow`: Slower variant for larger bubbles
- `bubbleFloatFast`: Faster variant for smaller bubbles
- `gentleFloat`: Subtle vertical movement for UI elements
- `bubblePop`: Click interaction animation

### Performance Features
- Hardware acceleration with `will-change`
- `backface-visibility: hidden` for smooth transforms
- Optimized filter effects
- Reduced motion support for accessibility

## Design Principles

### Kawaii Aesthetic
- Soft, rounded bubble shapes
- Pastel color gradients
- Gentle, organic animations
- Subtle glow effects

### Performance
- SVG-based graphics for scalability
- CSS transforms over position changes
- Minimal DOM manipulation
- Efficient animation cleanup

### Accessibility
- Respects `prefers-reduced-motion`
- Non-essential decorative elements
- Keyboard navigation support
- Screen reader friendly

## Color Schemes

### Gradient Definitions
- **Pink**: `#fbb6ce → #f687b3 → #ed64a6`
- **Purple**: `#d6bcfa → #b794f6 → #9f7aea`
- **Blue**: `#90cdf4 → #63b3ed → #4299e1`
- **Cyan**: `#9decf9 → #76e4f7 → #0bc5ea`
- **Rainbow**: Combines pink, purple, and blue

### Visual Effects
- Radial gradients for 3D appearance
- White highlights for depth
- Subtle stroke borders
- Dynamic shimmer overlays

## Integration Examples

### Login Page Header
```tsx
<AnimatedBubble 
  size={80} 
  gradient="rainbow" 
  opacity={0.9}
  glowIntensity="high"
  animationType="pulse"
/>
```

### Decorative Elements
```tsx
<BubbleCluster count={4} />
```

### Interactive Features
```tsx
<InteractiveBubble
  size={32}
  gradient="blue"
  onClick={() => console.log('Bubble clicked!')}
/>
```

## Browser Support

- Modern browsers with CSS3 support
- SVG animation compatibility
- Hardware acceleration where available
- Graceful degradation for older browsers

## Future Enhancements

- WebGL particle effects
- Sound integration
- Advanced physics simulations
- Customizable particle systems
- Theme-based color variations
