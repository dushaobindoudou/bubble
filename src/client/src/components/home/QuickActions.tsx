import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { AnimatedBubble } from '../ui/AnimatedBubble'
import { Button } from '../ui/Button'

interface QuickActionsProps {
  onPlayGame: () => void
}

interface GameStats {
  totalGames: number
  wins: number
  losses: number
  winRate: number
  currentStreak: number
  bestScore: number
  totalPlayTime: string
}

interface DailyReward {
  day: number
  claimed: boolean
  reward: string
  amount: number
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onPlayGame }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [gameStats, setGameStats] = useState<GameStats | null>(null)
  const [dailyRewards, setDailyRewards] = useState<DailyReward[]>([])
  const [canClaimDaily, setCanClaimDaily] = useState(false)
  const [isClaimingReward, setIsClaimingReward] = useState(false)

  // Load user stats and daily rewards
  useEffect(() => {
    loadUserStats()
    loadDailyRewards()
  }, [user])

  const loadUserStats = async () => {
    try {
      // TODO: Implement actual API call
      // Mock data for now
      const mockStats: GameStats = {
        totalGames: 67,
        wins: 42,
        losses: 25,
        winRate: 62.7,
        currentStreak: 3,
        bestScore: 1680,
        totalPlayTime: '12h 34m'
      }
      setGameStats(mockStats)
    } catch (error) {
      console.error('Failed to load user stats:', error)
    }
  }

  const loadDailyRewards = async () => {
    try {
      // TODO: Implement actual API call
      // Mock data for now
      const mockRewards: DailyReward[] = [
        { day: 1, claimed: true, reward: 'BUB', amount: 10 },
        { day: 2, claimed: true, reward: 'BUB', amount: 20 },
        { day: 3, claimed: true, reward: 'BUB', amount: 30 },
        { day: 4, claimed: false, reward: 'BUB', amount: 40 },
        { day: 5, claimed: false, reward: 'NFT', amount: 1 },
        { day: 6, claimed: false, reward: 'BUB', amount: 60 },
        { day: 7, claimed: false, reward: 'RARE_NFT', amount: 1 },
      ]
      setDailyRewards(mockRewards)
      
      // Check if can claim today's reward
      const today = new Date().getDay() || 7 // Convert Sunday (0) to 7
      const todayReward = mockRewards.find(r => r.day === today)
      setCanClaimDaily(todayReward ? !todayReward.claimed : false)
    } catch (error) {
      console.error('Failed to load daily rewards:', error)
    }
  }

  const claimDailyReward = async () => {
    if (!canClaimDaily) return

    setIsClaimingReward(true)
    try {
      // TODO: Implement actual contract call
      const today = new Date().getDay() || 7
      const todayReward = dailyRewards.find(r => r.day === today)
      
      if (todayReward) {
        // Update local state
        setDailyRewards(prev => prev.map(r => 
          r.day === today ? { ...r, claimed: true } : r
        ))
        setCanClaimDaily(false)
        
        toast.success(`已领取每日奖励: ${todayReward.amount} ${todayReward.reward}`)
      }
    } catch (error) {
      console.error('Failed to claim daily reward:', error)
      toast.error('领取奖励失败')
    } finally {
      setIsClaimingReward(false)
    }
  }

  const getRewardIcon = (reward: string) => {
    switch (reward) {
      case 'BUB': return '🫧'
      case 'NFT': return '🎨'
      case 'RARE_NFT': return '💎'
      default: return '🎁'
    }
  }

  const getRewardText = (reward: string) => {
    switch (reward) {
      case 'BUB': return 'BUB'
      case 'NFT': return 'NFT'
      case 'RARE_NFT': return '稀有NFT'
      default: return '奖励'
    }
  }

  if (user?.isGuest) {
    return (
      <div className="space-y-6">
        {/* Guest Welcome */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          <div className="text-center">
            <div className="mb-4">
              <AnimatedBubble size={64} gradient="blue" opacity={0.8} />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">游客模式</h3>
            <p className="text-white/70 mb-6">
              连接钱包解锁完整功能
            </p>
            <Button
              variant="primary"
              className="w-full mb-3"
              onClick={onPlayGame}
            >
            开始游戏
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              🔗 连接钱包
            </Button>
          </div>
        </div>

        {/* Quick Game Info */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          <h4 className="text-lg font-bold text-white mb-4">游戏说明</h4>
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <span>🎯</span>
              <span>控制泡泡吃掉其他玩家</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⚡</span>
              <span>避免被更大的泡泡吃掉</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🏆</span>
              <span>成为最大的泡泡获胜</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Play */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-xl">⚡</span>
          快速操作
        </h3>
        
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            onClick={onPlayGame}
          >
            开始游戏
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/store')}
              className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300 hover:bg-pink-500/30"
            >
              🛍️ 皮肤商店
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/demo')}
            >
              🫧 泡泡演示
            </Button>
          </div>
        </div>
      </div>

      {/* Game Stats */}
      {gameStats && (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>📊</span>
            游戏统计
          </h4>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-white/5 rounded-xl">
              <div className="text-2xl font-bold text-white">{gameStats.totalGames}</div>
              <div className="text-white/70 text-sm">总场次</div>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              <div className="text-2xl font-bold text-green-400">{gameStats.winRate}%</div>
              <div className="text-white/70 text-sm">胜率</div>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              <div className="text-2xl font-bold text-blue-400">{gameStats.currentStreak}</div>
              <div className="text-white/70 text-sm">连胜</div>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              <div className="text-2xl font-bold text-yellow-400">{gameStats.bestScore}</div>
              <div className="text-white/70 text-sm">最高分</div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Rewards */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🎁</span>
            每日奖励
          </h4>
          {canClaimDaily && (
            <Button
              variant="primary"
              size="sm"
              onClick={claimDailyReward}
              loading={isClaimingReward}
            >
              领取
            </Button>
          )}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {dailyRewards.map((reward) => {
            const today = new Date().getDay() || 7
            const isToday = reward.day === today
            
            return (
              <div
                key={reward.day}
                className={`aspect-square p-2 rounded-xl border text-center transition-all ${
                  reward.claimed
                    ? 'border-green-400/30 bg-green-500/20'
                    : isToday && canClaimDaily
                    ? 'border-yellow-400/50 bg-yellow-500/20 animate-pulse'
                    : 'border-white/20 bg-white/5'
                }`}
              >
                <div className="text-lg">{getRewardIcon(reward.reward)}</div>
                <div className="text-xs text-white/70 mt-1">
                  {reward.amount}
                </div>
                {reward.claimed && (
                  <div className="text-xs text-green-400 font-bold">✓</div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-4 text-center">
          <p className="text-white/70 text-sm">
            连续登录获得更多奖励
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📈</span>
          最近活动
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <div className="text-white text-sm">获得胜利</div>
              <div className="text-white/70 text-xs">2小时前</div>
            </div>
            <div className="text-green-400 text-sm font-semibold">+50 分</div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <div className="text-white text-sm">装备新皮肤</div>
              <div className="text-white/70 text-xs">1天前</div>
            </div>
            <div className="text-blue-400 text-sm">🎨</div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="flex-1">
              <div className="text-white text-sm">完成成就</div>
              <div className="text-white/70 text-xs">2天前</div>
            </div>
            <div className="text-yellow-400 text-sm">🏆</div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast('查看完整活动记录', { icon: 'ℹ️' })}
          >
            查看更多
          </Button>
        </div>
      </div>
    </div>
  )
}
