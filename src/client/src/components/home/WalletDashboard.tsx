import React, { useState } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { useTokenBalance } from '../../hooks/useTokenBalance'
import { AnimatedBubble } from '../ui/AnimatedBubble'
import { Button } from '../ui/Button'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { PopularSkins } from './PopularSkins'

export const WalletDashboard: React.FC = () => {
  const { user } = useAuth()
  const { address } = useAccount()
  const { data: monBalance, isLoading: isLoadingMON } = useBalance({
    address: address as `0x${string}`,
  })

  // Use custom hooks for Web3 data
  const { balance: bubBalance, isLoading: isLoadingBUB, refreshBalance } = useTokenBalance()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!address) return
    
    try {
      await navigator.clipboard.writeText(address)
      toast.success('钱包地址已复制到剪贴板')
    } catch (error) {
      toast.error('复制失败')
    }
  }

  // Refresh all balances
  const refreshBalances = async () => {
    setIsRefreshing(true)
    try {
      await refreshBalance()
      toast.success('余额已刷新')
    } catch (error) {
      toast.error('刷新失败')
    } finally {
      setIsRefreshing(false)
    }
  }



  if (user?.isGuest) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
        <div className="text-center">
          <div className="mb-6">
            <AnimatedBubble size={64} gradient="blue" opacity={0.8} />
          </div>
          <h3 className="text-xl font-bold text-white mb-4">游客模式</h3>
          <p className="text-white/70 mb-6">
            连接钱包以查看您的资产和 NFT 收藏
          </p>
          <Button variant="primary" onClick={() => window.location.href = '/login'}>
            连接钱包
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Wallet Info Card */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">💰</span>
            钱包信息
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshBalances}
            disabled={isRefreshing}
            loading={isRefreshing}
          >
            🔄 刷新
          </Button>
        </div>

        {/* Wallet Address */}
        <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm mb-1">钱包地址</p>
              <p className="text-white font-mono text-lg">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '未连接'}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={copyAddress}>
              📋 复制
            </Button>
          </div>
        </div>

        {/* Balances Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MON Balance */}
          <div className="p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-white font-semibold">MON</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {isLoadingMON ? (
                <LoadingSpinner size="sm" />
              ) : (
                `${parseFloat(monBalance?.formatted || '0').toFixed(4)}`
              )}
            </div>
            <p className="text-white/70 text-sm">Monad 原生代币</p>
          </div>

          {/* BUB Balance */}
          <div className="p-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <AnimatedBubble size={32} gradient="pink" opacity={0.8} animationType="pulse" />
              <span className="text-white font-semibold">BUB</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {isLoadingBUB ? (
                <LoadingSpinner size="sm" />
              ) : (
                `${bubBalance}`
              )}
            </div>
            <p className="text-white/70 text-sm">游戏代币</p>
          </div>
        </div>
      </div>

      {/* Popular Skins Recommendation */}
      <PopularSkins />
    </div>
  )
}
