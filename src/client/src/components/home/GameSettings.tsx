import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Button } from '../ui/Button'
import { AnimatedBubble } from '../ui/AnimatedBubble'

interface GameSettings {
  audio: {
    masterVolume: number
    musicVolume: number
    sfxVolume: number
    voiceVolume: number
    muted: boolean
  }
  graphics: {
    quality: 'low' | 'medium' | 'high' | 'ultra'
    particleEffects: boolean
    backgroundAnimations: boolean
    screenShake: boolean
    vsync: boolean
  }
  controls: {
    mouseSensitivity: number
    keyboardLayout: 'qwerty' | 'azerty' | 'dvorak'
    invertMouse: boolean
    autoAim: boolean
  }
  gameplay: {
    language: 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR'
    showFPS: boolean
    showPing: boolean
    autoSave: boolean
    notifications: boolean
  }
}

const defaultSettings: GameSettings = {
  audio: {
    masterVolume: 80,
    musicVolume: 70,
    sfxVolume: 85,
    voiceVolume: 75,
    muted: false
  },
  graphics: {
    quality: 'high',
    particleEffects: true,
    backgroundAnimations: true,
    screenShake: true,
    vsync: true
  },
  controls: {
    mouseSensitivity: 50,
    keyboardLayout: 'qwerty',
    invertMouse: false,
    autoAim: false
  },
  gameplay: {
    language: 'zh-CN',
    showFPS: false,
    showPing: true,
    autoSave: true,
    notifications: true
  }
}

export const GameSettings: React.FC = () => {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<'audio' | 'graphics' | 'controls' | 'gameplay'>('audio')

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('bubble_brawl_settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (error) {
        console.error('Failed to parse saved settings:', error)
      }
    }
  }, [])

  // Update settings
  const updateSettings = (category: keyof GameSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
    setHasChanges(true)
  }

  // Save settings
  const saveSettings = () => {
    try {
      localStorage.setItem('bubble_brawl_settings', JSON.stringify(settings))
      setHasChanges(false)
      toast.success('设置已保存')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('保存设置失败')
    }
  }

  // Reset to defaults
  const resetSettings = () => {
    setSettings(defaultSettings)
    setHasChanges(true)
    toast.info('设置已重置为默认值')
  }

  // Slider component
  const Slider: React.FC<{
    label: string
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    step?: number
    unit?: string
  }> = ({ label, value, onChange, min = 0, max = 100, step = 1, unit = '' }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-white font-medium">{label}</label>
        <span className="text-white/70 text-sm">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  )

  // Toggle component
  const Toggle: React.FC<{
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
    description?: string
  }> = ({ label, checked, onChange, description }) => (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
      <div>
        <div className="text-white font-medium">{label}</div>
        {description && <div className="text-white/60 text-sm">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-white/20'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )

  // Select component
  const Select: React.FC<{
    label: string
    value: string
    options: { value: string; label: string }[]
    onChange: (value: string) => void
  }> = ({ label, value, options, onChange }) => (
    <div className="space-y-2">
      <label className="text-white font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-gray-800">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Settings Navigation */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-xl">⚙️</span>
          设置分类
        </h2>
        
        <div className="space-y-2">
          {[
            { id: 'audio', label: '🔊 音频设置', icon: '🔊' },
            { id: 'graphics', label: '🎨 图形设置', icon: '🎨' },
            { id: 'controls', label: '🎮 控制设置', icon: '🎮' },
            { id: 'gameplay', label: '🎯 游戏设置', icon: '🎯' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Save/Reset Buttons */}
        <div className="mt-8 space-y-3">
          <Button
            variant="primary"
            className="w-full"
            onClick={saveSettings}
            disabled={!hasChanges}
          >
            💾 保存设置
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={resetSettings}
          >
            🔄 重置默认
          </Button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="lg:col-span-3 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        {/* Audio Settings */}
        {activeTab === 'audio' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🔊</span>
              音频设置
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Slider
                  label="主音量"
                  value={settings.audio.masterVolume}
                  onChange={(value) => updateSettings('audio', 'masterVolume', value)}
                  unit="%"
                />
                <Slider
                  label="音乐音量"
                  value={settings.audio.musicVolume}
                  onChange={(value) => updateSettings('audio', 'musicVolume', value)}
                  unit="%"
                />
              </div>
              <div className="space-y-4">
                <Slider
                  label="音效音量"
                  value={settings.audio.sfxVolume}
                  onChange={(value) => updateSettings('audio', 'sfxVolume', value)}
                  unit="%"
                />
                <Slider
                  label="语音音量"
                  value={settings.audio.voiceVolume}
                  onChange={(value) => updateSettings('audio', 'voiceVolume', value)}
                  unit="%"
                />
              </div>
            </div>

            <Toggle
              label="静音模式"
              checked={settings.audio.muted}
              onChange={(checked) => updateSettings('audio', 'muted', checked)}
              description="关闭所有游戏音频"
            />
          </div>
        )}

        {/* Graphics Settings */}
        {activeTab === 'graphics' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              图形设置
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Select
                  label="图形质量"
                  value={settings.graphics.quality}
                  options={[
                    { value: 'low', label: '低' },
                    { value: 'medium', label: '中' },
                    { value: 'high', label: '高' },
                    { value: 'ultra', label: '超高' },
                  ]}
                  onChange={(value) => updateSettings('graphics', 'quality', value)}
                />
              </div>
              <div className="space-y-4">
                <Toggle
                  label="粒子效果"
                  checked={settings.graphics.particleEffects}
                  onChange={(checked) => updateSettings('graphics', 'particleEffects', checked)}
                  description="显示泡泡爆炸等粒子效果"
                />
                <Toggle
                  label="背景动画"
                  checked={settings.graphics.backgroundAnimations}
                  onChange={(checked) => updateSettings('graphics', 'backgroundAnimations', checked)}
                  description="显示背景泡泡动画"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Toggle
                label="屏幕震动"
                checked={settings.graphics.screenShake}
                onChange={(checked) => updateSettings('graphics', 'screenShake', checked)}
                description="碰撞时的屏幕震动效果"
              />
              <Toggle
                label="垂直同步"
                checked={settings.graphics.vsync}
                onChange={(checked) => updateSettings('graphics', 'vsync', checked)}
                description="减少画面撕裂"
              />
            </div>
          </div>
        )}

        {/* Controls Settings */}
        {activeTab === 'controls' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🎮</span>
              控制设置
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Slider
                  label="鼠标灵敏度"
                  value={settings.controls.mouseSensitivity}
                  onChange={(value) => updateSettings('controls', 'mouseSensitivity', value)}
                  min={1}
                  max={100}
                  unit="%"
                />
                <Select
                  label="键盘布局"
                  value={settings.controls.keyboardLayout}
                  options={[
                    { value: 'qwerty', label: 'QWERTY' },
                    { value: 'azerty', label: 'AZERTY' },
                    { value: 'dvorak', label: 'Dvorak' },
                  ]}
                  onChange={(value) => updateSettings('controls', 'keyboardLayout', value)}
                />
              </div>
              <div className="space-y-4">
                <Toggle
                  label="反转鼠标"
                  checked={settings.controls.invertMouse}
                  onChange={(checked) => updateSettings('controls', 'invertMouse', checked)}
                  description="反转鼠标Y轴移动"
                />
                <Toggle
                  label="自动瞄准"
                  checked={settings.controls.autoAim}
                  onChange={(checked) => updateSettings('controls', 'autoAim', checked)}
                  description="辅助瞄准功能"
                />
              </div>
            </div>
          </div>
        )}

        {/* Gameplay Settings */}
        {activeTab === 'gameplay' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              游戏设置
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Select
                  label="语言"
                  value={settings.gameplay.language}
                  options={[
                    { value: 'zh-CN', label: '简体中文' },
                    { value: 'en-US', label: 'English' },
                    { value: 'ja-JP', label: '日本語' },
                    { value: 'ko-KR', label: '한국어' },
                  ]}
                  onChange={(value) => updateSettings('gameplay', 'language', value)}
                />
              </div>
              <div className="space-y-4">
                <Toggle
                  label="显示FPS"
                  checked={settings.gameplay.showFPS}
                  onChange={(checked) => updateSettings('gameplay', 'showFPS', checked)}
                  description="显示帧率信息"
                />
                <Toggle
                  label="显示延迟"
                  checked={settings.gameplay.showPing}
                  onChange={(checked) => updateSettings('gameplay', 'showPing', checked)}
                  description="显示网络延迟"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Toggle
                label="自动保存"
                checked={settings.gameplay.autoSave}
                onChange={(checked) => updateSettings('gameplay', 'autoSave', checked)}
                description="自动保存游戏进度"
              />
              <Toggle
                label="推送通知"
                checked={settings.gameplay.notifications}
                onChange={(checked) => updateSettings('gameplay', 'notifications', checked)}
                description="接收游戏通知"
              />
            </div>
          </div>
        )}

        {/* Preview Area */}
        <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>👁️</span>
            设置预览
          </h4>
          <div className="flex items-center justify-center py-8">
            <AnimatedBubble 
              size={80} 
              gradient="rainbow" 
              opacity={0.8}
              animationType={settings.graphics.backgroundAnimations ? "pulse" : "static"}
              glowIntensity={settings.graphics.particleEffects ? "high" : "low"}
            />
          </div>
          <p className="text-center text-white/70 text-sm">
            根据您的设置，这是泡泡的预览效果
          </p>
        </div>
      </div>
    </div>
  )
}
