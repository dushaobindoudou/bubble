import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { MinimalBackground } from '../components/ui/AnimatedBackground'
import { BubbleLoader } from '../components/ui/InteractiveBubbles'
import { Header } from '../components/layout/Header'

// Import home page components
import { WalletDashboard } from '../components/home/WalletDashboard'
import { SkinSelection } from '../components/home/SkinSelection'
import { GameSettings } from '../components/home/GameSettings'
import { GameFeatures } from '../components/home/GameFeatures'
import { QuickActions } from '../components/home/QuickActions'
import { ContractDebug } from '../components/debug/ContractDebug'

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'skins' | 'settings' | 'features' | 'debug'>('dashboard')
  const [isLoading, setIsLoading] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Simulate loading time for smooth transition
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [isAuthenticated, navigate])

  const handlePlayGame = () => {
    navigate('/game')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <MinimalBackground />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center">
          <div className="text-center">
            <BubbleLoader size="large" className="mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">加载游戏主界面...</h2>
            <p className="text-white/70">正在初始化您的游戏数据</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <MinimalBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <Header showGameButton={true} showStoreButton={true} showManagerButton={true} />

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-8 bg-white/10 backdrop-blur-xl rounded-2xl p-2">
              {[
                { id: 'dashboard', label: '钱包面板', icon: '💰' },
                { id: 'skins', label: '皮肤选择', icon: '🎨' },
                { id: 'settings', label: '游戏设置', icon: '⚙️' },
                { id: 'features', label: '游戏功能', icon: '🏆' },
                { id: 'debug', label: '合约调试', icon: '🔧' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <WalletDashboard />
                  </div>
                  <div>
                    <QuickActions onPlayGame={handlePlayGame} />
                  </div>
                </div>
              )}

              {activeTab === 'skins' && (
                <SkinSelection />
              )}

              {activeTab === 'settings' && (
                <GameSettings />
              )}

              {activeTab === 'features' && (
                <GameFeatures />
              )}

              {activeTab === 'debug' && (
                <ContractDebug />
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 border-t border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto text-center text-white/70 text-sm">
            <p>© 2025 泡泡大作战. 基于 Monad 区块链构建.</p>
            <div className="flex justify-center gap-4 mt-2">
              <a href="#" className="hover:text-white transition-colors">🐦 Twitter</a>
              <a href="#" className="hover:text-white transition-colors">💬 Discord</a>
              <a href="#" className="hover:text-white transition-colors">📖 文档</a>
              <a href="/demo" className="hover:text-white transition-colors">🫧 泡泡演示</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default HomePage
