import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useAdminAccess } from '../../hooks/useAdminAccess'
import { Button } from '../ui/Button'

interface HeaderProps {
  title?: string
  subtitle?: string
  showGameButton?: boolean
  showStoreButton?: boolean
  showManagerButton?: boolean
  className?: string
}

export const Header: React.FC<HeaderProps> = ({
  title = "泡泡大作战",
  subtitle,
  showGameButton = true,
  showStoreButton = true,
  showManagerButton = true,
  className = ""
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { isAdmin } = useAdminAccess()

  const handlePlayGame = () => {
    navigate('/game')
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleNavigateHome = () => {
    navigate('/home')
  }

  // 根据当前页面生成默认副标题
  const getDefaultSubtitle = () => {
    if (subtitle) return subtitle
    
    const path = location.pathname
    if (path === '/store') {
      return `欢迎来到皮肤商店, ${user?.isGuest ? '游客' : `${user?.address?.slice(0, 6)}...${user?.address?.slice(-4)}`}`
    } else if (path === '/manager') {
      return `管理中心, ${user?.isGuest ? '游客' : `${user?.address?.slice(0, 6)}...${user?.address?.slice(-4)}`}`
    } else if (path === '/game') {
      return `准备开始游戏, ${user?.isGuest ? '游客' : `${user?.address?.slice(0, 6)}...${user?.address?.slice(-4)}`}`
    } else {
      return `欢迎回来, ${user?.isGuest ? '游客' : `${user?.address?.slice(0, 6)}...${user?.address?.slice(-4)}`}`
    }
  }

  return (
    <header className={`p-6 border-b border-white/10 bg-white/5 backdrop-blur-xl ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Welcome */}
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200"
            onClick={handleNavigateHome}
            title="返回主页"
          >
            <span className="text-2xl">🫧</span>
          </div>
          <div>
            <h1 
              className="text-2xl font-bold text-white cursor-pointer hover:text-pink-300 transition-colors duration-200"
              onClick={handleNavigateHome}
              title="返回主页"
            >
              {title}
            </h1>
            <p className="text-white/70 text-sm">
              {getDefaultSubtitle()}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Game Button */}
          {showGameButton && location.pathname !== '/game' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handlePlayGame}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              开始游戏
            </Button>
          )}

          {/* Store Button */}
          {showStoreButton && location.pathname !== '/store' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/store')}
              className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300 hover:bg-pink-500/30"
            >
              皮肤商店
            </Button>
          )}

          {/* Manager Button */}
          {showManagerButton && isAdmin && location.pathname !== '/manager' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/manager')}
              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30"
            >
              管理中心
            </Button>
          )}

          {/* Home Button - only show when not on home page */}
          {location.pathname !== '/home' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNavigateHome}
              className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30"
            >
              返回首页
            </Button>
          )}

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white/70 hover:text-white"
          >
            退出登录
          </Button>
        </div>
      </div>
    </header>
  )
}
