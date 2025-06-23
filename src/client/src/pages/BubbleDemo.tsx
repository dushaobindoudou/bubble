import React, { useState } from 'react'
import { 
  AnimatedBackground, 
  MinimalBackground, 
  DefaultBackground, 
  IntenseBackground 
} from '../components/ui/AnimatedBackground'
import { 
  FullscreenBubbleEffect,
  LowIntensityBubbles,
  MediumIntensityBubbles,
  HighIntensityBubbles
} from '../components/ui/FullscreenBubbleEffect'

type BackgroundType = 'minimal' | 'default' | 'intense' | 'custom'
type EffectType = 'low' | 'medium' | 'high' | 'none'

const BubbleDemo: React.FC = () => {
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('default')
  const [effectType, setEffectType] = useState<EffectType>('medium')
  const [interactive, setInteractive] = useState(true)
  const [showParticles, setShowParticles] = useState(true)

  const renderBackground = () => {
    switch (backgroundType) {
      case 'minimal':
        return <MinimalBackground />
      case 'default':
        return <DefaultBackground />
      case 'intense':
        return <IntenseBackground />
      case 'custom':
        return (
          <AnimatedBackground 
            variant="default"
            interactive={interactive}
            showParticles={showParticles}
          />
        )
      default:
        return <DefaultBackground />
    }
  }

  const renderEffect = () => {
    if (backgroundType !== 'custom') return null
    
    switch (effectType) {
      case 'low':
        return <LowIntensityBubbles />
      case 'medium':
        return <MediumIntensityBubbles />
      case 'high':
        return <HighIntensityBubbles />
      case 'none':
        return null
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {renderBackground()}
      {renderEffect()}

      {/* Demo Controls */}
      <div className="relative z-50 p-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 max-w-md">
          <h1 className="text-2xl font-bold text-white mb-6">
            🫧 泡泡效果演示
          </h1>

          {/* Background Type Selection */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-3">
              背景类型:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['minimal', 'default', 'intense', 'custom'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setBackgroundType(type)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    backgroundType === type
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/20 text-white/80 hover:bg-white/30'
                  }`}
                >
                  {type === 'minimal' && '最小化'}
                  {type === 'default' && '默认'}
                  {type === 'intense' && '强化'}
                  {type === 'custom' && '自定义'}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Controls */}
          {backgroundType === 'custom' && (
            <>
              {/* Effect Intensity */}
              <div className="mb-4">
                <label className="block text-white font-semibold mb-3">
                  效果强度:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['none', 'low', 'medium', 'high'] as const).map(intensity => (
                    <button
                      key={intensity}
                      onClick={() => setEffectType(intensity)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        effectType === intensity
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/20 text-white/80 hover:bg-white/30'
                      }`}
                    >
                      {intensity === 'none' && '无'}
                      {intensity === 'low' && '低'}
                      {intensity === 'medium' && '中'}
                      {intensity === 'high' && '高'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Toggle */}
              <div className="mb-4">
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={interactive}
                    onChange={(e) => setInteractive(e.target.checked)}
                    className="mr-2 rounded"
                  />
                  交互式效果
                </label>
              </div>

              {/* Particles Toggle */}
              <div className="mb-4">
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={showParticles}
                    onChange={(e) => setShowParticles(e.target.checked)}
                    className="mr-2 rounded"
                  />
                  显示粒子
                </label>
              </div>
            </>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-white/10 rounded-lg">
            <h3 className="text-white font-semibold mb-2">使用说明:</h3>
            <ul className="text-white/80 text-sm space-y-1">
              <li>• 移动鼠标查看交互效果</li>
              <li>• 点击屏幕生成泡泡爆发</li>
              <li>• 观察不同强度的性能差异</li>
              <li>• 尝试不同的配置组合</li>
            </ul>
          </div>

          {/* Performance Info */}
          <div className="mt-4 p-4 bg-white/10 rounded-lg">
            <h3 className="text-white font-semibold mb-2">性能信息:</h3>
            <div className="text-white/80 text-sm space-y-1">
              <div>当前配置: {backgroundType}</div>
              {backgroundType === 'custom' && (
                <>
                  <div>效果强度: {effectType}</div>
                  <div>交互式: {interactive ? '是' : '否'}</div>
                  <div>粒子效果: {showParticles ? '是' : '否'}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Back to Login */}
      <div className="absolute top-4 right-4 z-50">
        <a
          href="/"
          className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition-all"
        >
          返回登录
        </a>
      </div>
    </div>
  )
}

export default BubbleDemo
