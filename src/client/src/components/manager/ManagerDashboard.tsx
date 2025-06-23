import React from 'react'
import { useAccount } from 'wagmi'
import { useAdminAccess } from '../../hooks/useAdminAccess'
import { useTokenBalance } from '../../hooks/useTokenBalance'
import { useGameRewards } from '../../hooks/useGameRewards'
import { useSkinAdmin } from '../../hooks/useSkinAdmin'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { CONTRACT_ADDRESSES } from '../../config/contracts'

export const ManagerDashboard: React.FC = () => {
  const { address } = useAccount()
  const { 
    isAdmin, 
    hasGameAdminRole, 
    hasTokenAdminRole, 
    hasNFTAdminRole 
  } = useAdminAccess()
  
  const { balance: bubBalance, isLoading: isLoadingBalance } = useTokenBalance()
  const { pendingSessions, rewardParameters, isLoading: isLoadingRewards } = useGameRewards()
  const { templateCount, isLoading: isLoadingSkins } = useSkinAdmin()

  const adminRoles = [
    { name: '超级管理员', hasRole: isAdmin, icon: '👑', color: 'from-yellow-500 to-orange-500' },
    { name: '游戏管理员', hasRole: hasGameAdminRole, icon: '🏆', color: 'from-green-500 to-teal-500' },
    { name: '代币管理员', hasRole: hasTokenAdminRole, icon: '🪙', color: 'from-blue-500 to-cyan-500' },
    { name: 'NFT管理员', hasRole: hasNFTAdminRole, icon: '🎨', color: 'from-purple-500 to-pink-500' },
  ]

  const systemStats = [
    {
      title: '待验证游戏会话',
      value: isLoadingRewards ? '...' : pendingSessions.length.toString(),
      icon: '⏳',
      color: 'from-orange-500 to-red-500',
      description: '需要管理员验证的游戏会话数量'
    },
    {
      title: 'BUB 代币余额',
      value: isLoadingBalance ? '...' : bubBalance,
      icon: '🪙',
      color: 'from-blue-500 to-cyan-500',
      description: '当前钱包的 BUB 代币余额'
    },
    {
      title: '皮肤模板总数',
      value: isLoadingSkins ? '...' : templateCount.toString(),
      icon: '🎨',
      color: 'from-purple-500 to-pink-500',
      description: '系统中创建的皮肤模板数量'
    },
    {
      title: '基础奖励',
      value: isLoadingRewards ? '...' : (rewardParameters?.baseReward.toString() || '0'),
      icon: '🎁',
      color: 'from-green-500 to-teal-500',
      description: '每次游戏的基础奖励金额'
    },
  ]

  const quickActions = [
    {
      title: '验证游戏会话',
      description: '查看和验证待处理的游戏会话',
      icon: '🏆',
      action: 'rewards',
      available: hasGameAdminRole,
      color: 'from-green-500 to-teal-500'
    },
    {
      title: '铸造代币',
      description: '为玩家或系统铸造 BUB 代币',
      icon: '🪙',
      action: 'tokens',
      available: hasTokenAdminRole,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: '创建皮肤',
      description: '创建新的皮肤模板和铸造 NFT',
      icon: '🎨',
      action: 'skins',
      available: hasNFTAdminRole,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: '市场管理',
      description: '管理NFT交易市场配置',
      icon: '🛒',
      action: 'marketplace',
      available: isAdmin,
      color: 'from-orange-500 to-red-500'
    },
    {
      title: '随机数管理',
      description: '管理游戏随机数生成器',
      icon: '🎲',
      action: 'random',
      available: isAdmin,
      color: 'from-indigo-500 to-purple-500'
    },
    {
      title: '权限管理',
      description: '管理用户角色和访问权限',
      icon: '🔐',
      action: 'access',
      available: isAdmin,
      color: 'from-red-500 to-pink-500'
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">欢迎来到管理中心</h2>
        <p className="text-white/70">管理 Bubble Brawl 游戏的智能合约和系统功能</p>
      </div>

      {/* Admin Roles */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">👤 管理员权限</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {adminRoles.map((role) => (
            <div
              key={role.name}
              className={`p-4 rounded-2xl border ${
                role.hasRole
                  ? `bg-gradient-to-br ${role.color} bg-opacity-20 border-white/30`
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{role.icon}</div>
                <div className={`font-semibold ${role.hasRole ? 'text-white' : 'text-white/50'}`}>
                  {role.name}
                </div>
                <div className={`text-xs mt-1 ${role.hasRole ? 'text-green-300' : 'text-red-300'}`}>
                  {role.hasRole ? '✅ 已授权' : '❌ 无权限'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Statistics */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">📊 系统统计</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {systemStats.map((stat) => (
            <div
              key={stat.title}
              className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} bg-opacity-20 border border-white/20`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl">{stat.icon}</div>
                <div className="text-white font-semibold text-lg">{stat.value}</div>
              </div>
              <div className="text-white font-medium text-sm mb-1">{stat.title}</div>
              <div className="text-white/60 text-xs">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">⚡ 快速操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <div
              key={action.title}
              className={`p-6 rounded-2xl border transition-all duration-200 ${
                action.available
                  ? `bg-gradient-to-br ${action.color} bg-opacity-20 border-white/30 hover:bg-opacity-30 cursor-pointer`
                  : 'bg-white/5 border-white/10 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{action.icon}</div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-lg mb-1">{action.title}</h4>
                  <p className="text-white/70 text-sm mb-3">{action.description}</p>
                  {action.available ? (
                    <div className="text-green-300 text-xs font-medium">✅ 可用</div>
                  ) : (
                    <div className="text-red-300 text-xs font-medium">❌ 需要权限</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contract Information */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">🔗 合约信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(CONTRACT_ADDRESSES).map(([name, address]) => (
            <div key={name} className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-white font-medium mb-2">{name}</div>
              <div className="text-white/60 font-mono text-xs break-all mb-2">{address}</div>
              <a
                href={`https://testnet.monadexplorer.com/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs underline"
              >
                在浏览器中查看
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">📈 最近活动</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <div className="text-green-400">✅</div>
            <div className="flex-1">
              <div className="text-white text-sm">管理员权限验证成功</div>
              <div className="text-white/60 text-xs">刚刚</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <div className="text-blue-400">🔄</div>
            <div className="flex-1">
              <div className="text-white text-sm">系统数据已刷新</div>
              <div className="text-white/60 text-xs">1 分钟前</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <div className="text-purple-400">🎨</div>
            <div className="flex-1">
              <div className="text-white text-sm">皮肤模板数据已加载</div>
              <div className="text-white/60 text-xs">2 分钟前</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
