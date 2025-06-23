import React, { useState, useEffect } from 'react'
import { useGameRewards } from '../../hooks/useGameRewards'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Button } from '../ui/Button'
import { toast } from 'react-hot-toast'

export const GameRewardsManager: React.FC = () => {
  const {
    pendingSessions,
    sessions,
    rewardParameters,
    hasAdminRole,
    isLoadingRole,
    isLoading,
    isVerifying,
    isSettingParams,
    error,
    verifyGameSession,
    updateRewardParameters,
    refreshData,
  } = useGameRewards()

  const [selectedSession, setSelectedSession] = useState<number | null>(null)
  const [showParamsModal, setShowParamsModal] = useState(false)

  // 使用 useMemo 或者在 useEffect 中设置，避免无限重新渲染
  const [newParams, setNewParams] = useState({
    baseReward: '100',
    scoreMultiplier: '1',
    timeBonus: '10',
  })

  // 当 rewardParameters 加载完成时更新表单
  useEffect(() => {
    if (rewardParameters) {
      setNewParams({
        baseReward: rewardParameters.baseReward.toString(),
        scoreMultiplier: rewardParameters.scoreMultiplier.toString(),
        timeBonus: rewardParameters.timeBonus.toString(),
      })
    }
  }, [])

  // 监听错误状态，防止权限错误导致页面不断刷新
  useEffect(() => {
    if (error && error.includes('AccessControlUnauthorizedAccount')) {
      console.warn('权限不足，停止自动刷新')
      // 可以在这里添加更多的错误处理逻辑
    }
  }, [error])

  const handleVerifySession = async (sessionId: number, approved: boolean) => {
    try {
      // 检查权限
      if (!hasAdminRole) {
        toast.error('权限不足：需要管理员权限')
        return
      }

      await verifyGameSession(sessionId, approved)
      toast.success(`游戏会话 #${sessionId} ${approved ? '已批准' : '已拒绝'}`)
      setSelectedSession(null)
    } catch (err) {
      console.error('验证会话失败:', err)
      const errorMessage = (err as Error).message
      if (errorMessage.includes('AccessControlUnauthorizedAccount')) {
        toast.error('权限不足：需要管理员权限')
      } else {
        toast.error('验证失败，请重试')
      }
    }
  }

  const handleUpdateParams = async () => {
    try {
      // 检查权限
      if (!hasAdminRole) {
        toast.error('权限不足：需要管理员权限')
        return
      }

      await updateRewardParameters({
        baseReward: parseInt(newParams.baseReward),
        scoreMultiplier: parseInt(newParams.scoreMultiplier),
        timeBonus: parseInt(newParams.timeBonus),
      })
      toast.success('奖励参数已更新')
      setShowParamsModal(false)
    } catch (err) {
      console.error('更新参数失败:', err)
      const errorMessage = (err as Error).message
      if (errorMessage.includes('AccessControlUnauthorizedAccount')) {
        toast.error('权限不足：需要管理员权限')
      } else {
        toast.error('更新失败，请重试')
      }
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (isLoading || isLoadingRole) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <div className="ml-4 text-white/70">
          {isLoadingRole ? '正在验证权限...' : '正在加载数据...'}
        </div>
      </div>
    )
  }

  // 权限检查 - 如果用户没有管理员权限，显示权限不足提示
  if (!hasAdminRole) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">🏆 游戏奖励管理</h2>
            <p className="text-white/70">管理游戏会话验证和奖励参数</p>
          </div>
          <Button onClick={refreshData} variant="ghost" disabled={isLoading}>
            🔄 刷新数据
          </Button>
        </div>

        {/* 权限不足提示 */}
        <div className="bg-red-500/20 backdrop-blur-xl rounded-3xl p-8 border border-red-500/30 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-white mb-2">权限不足</h3>
          <p className="text-white/70 mb-4">
            您需要 ADMIN_ROLE 权限才能访问游戏奖励管理功能
          </p>
          <div className="text-sm text-white/50">
            请联系管理员获取相应权限
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">🏆 游戏奖励管理</h2>
          <p className="text-white/70">管理游戏会话验证和奖励参数</p>
          {/* 权限状态指示器 */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              管理员权限已验证
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={refreshData} variant="ghost" disabled={isLoading}>
            🔄 刷新数据
          </Button>
          <Button
            onClick={() => setShowParamsModal(true)}
            variant="primary"
            disabled={!hasAdminRole}
          >
            ⚙️ 奖励设置
          </Button>
        </div>
      </div>

      {/* Current Parameters */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">📊 当前奖励参数</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/30">
            <div className="text-blue-300 text-sm mb-1">基础奖励</div>
            <div className="text-white font-bold text-2xl">
              {rewardParameters?.baseReward || 0} BUB
            </div>
          </div>
          <div className="p-4 bg-green-500/20 rounded-2xl border border-green-500/30">
            <div className="text-green-300 text-sm mb-1">分数倍数</div>
            <div className="text-white font-bold text-2xl">
              {rewardParameters?.scoreMultiplier || 0}x
            </div>
          </div>
          <div className="p-4 bg-purple-500/20 rounded-2xl border border-purple-500/30">
            <div className="text-purple-300 text-sm mb-1">时间奖励</div>
            <div className="text-white font-bold text-2xl">
              {rewardParameters?.timeBonus || 0} BUB
            </div>
          </div>
        </div>
      </div>

      {/* Pending Sessions */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">⏳ 待验证游戏会话</h3>
          <div className="px-3 py-1 bg-orange-500/20 rounded-full border border-orange-500/30">
            <span className="text-orange-300 text-sm font-medium">
              {pendingSessions.length} 个待处理
            </span>
          </div>
        </div>

        {pendingSessions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <div className="text-white/70">暂无待验证的游戏会话</div>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingSessions.map((sessionId) => {
              const session = sessions[sessionId]
              if (!session) return null

              return (
                <div
                  key={sessionId}
                  className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="text-white font-semibold">会话 #{sessionId}</div>
                        <div className="px-2 py-1 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                          <span className="text-yellow-300 text-xs font-medium">待验证</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-white/60">玩家</div>
                          <div className="text-white font-mono">{formatAddress(session.player)}</div>
                        </div>
                        <div>
                          <div className="text-white/60">分数</div>
                          <div className="text-white font-bold">{session.score.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-white/60">游戏时长</div>
                          <div className="text-white">{Math.floor(session.gameTime / 60)}:{(session.gameTime % 60).toString().padStart(2, '0')}</div>
                        </div>
                        <div>
                          <div className="text-white/60">提交时间</div>
                          <div className="text-white">{formatTimestamp(session.submittedAt)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => handleVerifySession(sessionId, false)}
                        variant="ghost"
                        size="sm"
                        disabled={isVerifying}
                        className="text-red-400 hover:text-red-300"
                      >
                        ❌ 拒绝
                      </Button>
                      <Button
                        onClick={() => handleVerifySession(sessionId, true)}
                        variant="primary"
                        size="sm"
                        disabled={isVerifying}
                      >
                        ✅ 批准
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Parameters Modal */}
      {showParamsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">⚙️ 奖励参数设置</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">基础奖励 (BUB)</label>
                <input
                  type="number"
                  value={newParams.baseReward}
                  onChange={(e) => setNewParams(prev => ({ ...prev, baseReward: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="100"
                />
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-2">分数倍数</label>
                <input
                  type="number"
                  value={newParams.scoreMultiplier}
                  onChange={(e) => setNewParams(prev => ({ ...prev, scoreMultiplier: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="1"
                />
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-2">时间奖励 (BUB)</label>
                <input
                  type="number"
                  value={newParams.timeBonus}
                  onChange={(e) => setNewParams(prev => ({ ...prev, timeBonus: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="10"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowParamsModal(false)}
                variant="ghost"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleUpdateParams}
                variant="primary"
                className="flex-1"
                disabled={isSettingParams}
              >
                {isSettingParams ? <LoadingSpinner size="sm" /> : '保存'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/20 rounded-2xl border border-red-500/30">
          <div className="text-red-400 font-medium">错误</div>
          <div className="text-red-300 text-sm">{error}</div>
        </div>
      )}
    </div>
  )
}
