import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useRequireAdmin } from '../hooks/useAdminAccess'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Button } from '../components/ui/Button'
import { GameRewardsManager } from '../components/manager/GameRewardsManager'
import { TokenManager } from '../components/manager/TokenManager'
import { SkinManager } from '../components/manager/SkinManager'
import { PermissionManager } from '../components/manager/PermissionManager'
import { ManagerDashboard } from '../components/manager/ManagerDashboard'
import { MarketplaceManager } from '../components/manager/MarketplaceManager'
import { RandomGeneratorManager } from '../components/manager/RandomGeneratorManager'

type ManagerTab = 'dashboard' | 'rewards' | 'tokens' | 'skins' | 'access' | 'marketplace' | 'random'

export const ManagerPage: React.FC = () => {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const { 
    isAdmin, 
    hasGameAdminRole, 
    hasTokenAdminRole, 
    hasNFTAdminRole, 
    isLoading, 
    error,
    canAccess 
  } = useRequireAdmin()
  
  const [activeTab, setActiveTab] = useState<ManagerTab>('dashboard')

  // Show loading while checking permissions
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-white/70 mt-4">验证管理员权限中...</p>
        </div>
      </div>
    )
  }

  // Show error if permission check failed
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center p-8 bg-red-500/20 rounded-3xl border border-red-500/30 max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-2">权限验证失败</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <Button onClick={() => navigate('/home')} variant="primary">
            返回主页
          </Button>
        </div>
      </div>
    )
  }

  // Show access denied if user is not admin
  if (!canAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center p-8 bg-red-500/20 rounded-3xl border border-red-500/30 max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-white mb-2">访问被拒绝</h2>
          <p className="text-red-300 mb-4">
            您没有访问管理员页面的权限。请联系系统管理员获取相应权限。
          </p>
          <div className="space-y-2 text-sm text-red-200 mb-4">
            <p>当前钱包: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '未连接'}</p>
            <p>管理员权限: {isAdmin ? '✅' : '❌'}</p>
          </div>
          <Button onClick={() => navigate('/home')} variant="primary">
            返回主页
          </Button>
        </div>
      </div>
    )
  }

  // Main manager interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">🛠️ 泡泡大作战 管理中心</h1>
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-sm font-medium">管理员已登录</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-white/70 text-sm">
                {address && `${address.slice(0, 6)}...${address.slice(-4)}`}
              </div>
              <Button 
                onClick={() => navigate('/home')} 
                variant="ghost"
                size="sm"
              >
                返回主页
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-4 overflow-x-auto">
            {[
              { id: 'dashboard', label: '总览', icon: '📊', available: true },
              { id: 'rewards', label: '游戏奖励', icon: '🏆', available: hasGameAdminRole },
              { id: 'tokens', label: '代币管理', icon: '🪙', available: hasTokenAdminRole },
              { id: 'skins', label: '皮肤管理', icon: '🎨', available: hasNFTAdminRole },
              { id: 'marketplace', label: '市场管理', icon: '🛒', available: isAdmin },
              { id: 'random', label: '随机数', icon: '🎲', available: isAdmin },
              { id: 'access', label: '权限管理', icon: '🔐', available: isAdmin },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ManagerTab)}
                disabled={!tab.available}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white border border-white/30'
                    : tab.available
                    ? 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-transparent'
                    : 'bg-white/5 text-white/30 cursor-not-allowed border border-transparent'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                {!tab.available && (
                  <span className="text-xs bg-red-500/20 text-red-300 px-1 rounded">
                    无权限
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <ManagerDashboard />}
        {activeTab === 'rewards' && hasGameAdminRole && <GameRewardsManager />}
        {activeTab === 'tokens' && hasTokenAdminRole && <TokenManager />}
        {activeTab === 'skins' && hasNFTAdminRole && <SkinManager />}
        {activeTab === 'marketplace' && isAdmin && <MarketplaceManager />}
        {activeTab === 'random' && isAdmin && <RandomGeneratorManager />}
        {activeTab === 'access' && <PermissionManager />}
      </div>
    </div>
  )
}
