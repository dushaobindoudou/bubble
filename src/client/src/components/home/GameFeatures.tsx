import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { AnimatedBubble } from '../ui/AnimatedBubble'
import { Button } from '../ui/Button'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface LeaderboardEntry {
  rank: number
  address: string
  score: number
  gamesPlayed: number
  winRate: number
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  progress: number
  maxProgress: number
  completed: boolean
  reward: string
}

interface MatchHistory {
  id: string
  date: string
  result: 'win' | 'loss' | 'draw'
  score: number
  duration: string
  opponents: number
}

export const GameFeatures: React.FC = () => {
  const navigate = useNavigate()
  const [activeFeature, setActiveFeature] = useState<'leaderboard' | 'achievements' | 'history' | 'marketplace'>('leaderboard')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load feature data
  useEffect(() => {
    loadFeatureData()
  }, [])

  const loadFeatureData = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement actual API calls
      // Mock data for now
      
      // Mock leaderboard
      const mockLeaderboard: LeaderboardEntry[] = [
        { rank: 1, address: '0x1234...5678', score: 15420, gamesPlayed: 156, winRate: 78.2 },
        { rank: 2, address: '0x2345...6789', score: 14890, gamesPlayed: 142, winRate: 76.8 },
        { rank: 3, address: '0x3456...7890', score: 14320, gamesPlayed: 138, winRate: 75.4 },
        { rank: 4, address: '0x4567...8901', score: 13950, gamesPlayed: 134, winRate: 74.1 },
        { rank: 5, address: '0x5678...9012', score: 13680, gamesPlayed: 129, winRate: 72.9 },
      ]
      setLeaderboard(mockLeaderboard)

      // Mock achievements
      const mockAchievements: Achievement[] = [
        {
          id: '1',
          name: '初出茅庐',
          description: '完成第一场游戏',
          icon: '🎮',
          progress: 1,
          maxProgress: 1,
          completed: true,
          reward: '10 BUB'
        },
        {
          id: '2',
          name: '连胜达人',
          description: '连续获胜5场',
          icon: '🔥',
          progress: 3,
          maxProgress: 5,
          completed: false,
          reward: '50 BUB'
        },
        {
          id: '3',
          name: '泡泡大师',
          description: '累计游戏100场',
          icon: '🏆',
          progress: 67,
          maxProgress: 100,
          completed: false,
          reward: '稀有皮肤'
        },
        {
          id: '4',
          name: '收藏家',
          description: '拥有10个不同的皮肤',
          icon: '🎨',
          progress: 4,
          maxProgress: 10,
          completed: false,
          reward: '传说皮肤'
        }
      ]
      setAchievements(mockAchievements)

      // Mock match history
      const mockHistory: MatchHistory[] = [
        { id: '1', date: '2025-01-20', result: 'win', score: 1250, duration: '3:45', opponents: 3 },
        { id: '2', date: '2025-01-20', result: 'loss', score: 890, duration: '2:30', opponents: 2 },
        { id: '3', date: '2025-01-19', result: 'win', score: 1680, duration: '4:12', opponents: 4 },
        { id: '4', date: '2025-01-19', result: 'win', score: 1420, duration: '3:28', opponents: 3 },
        { id: '5', date: '2025-01-18', result: 'draw', score: 1100, duration: '5:00', opponents: 2 },
      ]
      setMatchHistory(mockHistory)

    } catch (error) {
      console.error('Failed to load feature data:', error)
      toast.error('加载数据失败')
    } finally {
      setIsLoading(false)
    }
  }

  const claimAchievement = async (achievementId: string) => {
    try {
      // TODO: Implement actual contract call
      toast.success('成就奖励已领取！')
    } catch (error) {
      console.error('Failed to claim achievement:', error)
      toast.error('领取奖励失败')
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win': return 'text-green-400'
      case 'loss': return 'text-red-400'
      case 'draw': return 'text-yellow-400'
      default: return 'text-white'
    }
  }

  const getResultText = (result: string) => {
    switch (result) {
      case 'win': return '胜利'
      case 'loss': return '失败'
      case 'draw': return '平局'
      default: return '未知'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
        <div className="flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Feature Navigation */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-xl">🏆</span>
          游戏功能
        </h2>
        
        <div className="space-y-2">
          {[
            { id: 'leaderboard', label: '🏅 排行榜', icon: '🏅' },
            { id: 'achievements', label: '🎖️ 成就系统', icon: '🎖️' },
            { id: 'history', label: '📊 对战记录', icon: '📊' },
            { id: 'marketplace', label: '🛒 NFT市场', icon: '🛒' },
          ].map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveFeature(feature.id as any)}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                activeFeature === feature.id
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {feature.label}
            </button>
          ))}
        </div>

        <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
          <h4 className="text-white font-semibold mb-2">快速操作</h4>
          <div className="space-y-2">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => navigate('/game')}
            >
            开始游戏
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => toast('功能即将推出', { icon: 'ℹ️' })}
            >
              👥 邀请好友
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Content */}
      <div className="lg:col-span-3 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        {/* Leaderboard */}
        {activeFeature === 'leaderboard' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🏅</span>
              全球排行榜
            </h3>

            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`p-4 rounded-2xl border transition-all hover:bg-white/5 ${
                    entry.rank <= 3
                      ? 'border-yellow-400/30 bg-yellow-500/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        entry.rank === 1 ? 'bg-yellow-500 text-white' :
                        entry.rank === 2 ? 'bg-gray-400 text-white' :
                        entry.rank === 3 ? 'bg-orange-500 text-white' :
                        'bg-white/20 text-white'
                      }`}>
                        {entry.rank}
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                        </div>
                        <div className="text-white/70 text-sm">
                          {entry.gamesPlayed} 场游戏 • {entry.winRate}% 胜率
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">{entry.score.toLocaleString()}</div>
                      <div className="text-white/70 text-sm">积分</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button variant="ghost" onClick={() => toast('查看更多排行榜', { icon: 'ℹ️' })}>
                查看完整排行榜
              </Button>
            </div>
          </div>
        )}

        {/* Achievements */}
        {activeFeature === 'achievements' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🎖️</span>
              成就系统
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    achievement.completed
                      ? 'border-green-400/30 bg-green-500/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{achievement.name}</h4>
                      <p className="text-white/70 text-sm mb-2">{achievement.description}</p>
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-white/70 mb-1">
                          <span>进度</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              achievement.completed ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-yellow-400 text-sm font-semibold">
                          奖励: {achievement.reward}
                        </div>
                        {achievement.completed && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => claimAchievement(achievement.id)}
                          >
                            领取
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match History */}
        {activeFeature === 'history' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">📊</span>
              对战记录
            </h3>

            <div className="space-y-3">
              {matchHistory.map((match) => (
                <div
                  key={match.id}
                  className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        match.result === 'win' ? 'bg-green-500' :
                        match.result === 'loss' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`} />
                      <div>
                        <div className={`font-semibold ${getResultColor(match.result)}`}>
                          {getResultText(match.result)}
                        </div>
                        <div className="text-white/70 text-sm">{match.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">{match.score} 分</div>
                      <div className="text-white/70 text-sm">
                        {match.duration} • {match.opponents} 对手
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button variant="ghost" onClick={() => toast('查看更多记录', { icon: 'ℹ️' })}>
                查看完整记录
              </Button>
            </div>
          </div>
        )}

        {/* Marketplace */}
        {activeFeature === 'marketplace' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🛒</span>
              NFT 市场
            </h3>

            <div className="text-center py-12">
              <div className="mb-6">
                <AnimatedBubble size={80} gradient="rainbow" opacity={0.8} />
              </div>
              <h4 className="text-xl font-bold text-white mb-4">NFT 市场即将推出</h4>
              <p className="text-white/70 mb-6 max-w-md mx-auto">
                在这里您将能够购买、出售和交易独特的泡泡皮肤 NFT。
                敬请期待这个激动人心的功能！
              </p>
              <div className="space-y-3">
                <Button variant="primary" onClick={() => toast('市场即将开放', { icon: '🔔' })}>
                  🔔 通知我开放时间
                </Button>
                <Button variant="ghost" onClick={() => navigate('/demo')}>
                  🫧 查看泡泡演示
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
