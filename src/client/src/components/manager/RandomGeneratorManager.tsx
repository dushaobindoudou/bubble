import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Button } from '../ui/Button'
import { toast } from 'react-hot-toast'
import { CONTRACT_ADDRESSES } from '../../config/contracts'

interface RandomStats {
  currentSeed: string
  currentNonce: number
  totalGenerations: number
  lastUpdated: string
}

interface RandomResult {
  value: number
  timestamp: string
  type: string
}

export const RandomGeneratorManager: React.FC = () => {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'generate' | 'seed'>('overview')

  // Mock data - in real implementation, fetch from contract
  const [stats] = useState<RandomStats>({
    currentSeed: '0x1234567890abcdef...',
    currentNonce: 1247,
    totalGenerations: 5632,
    lastUpdated: '2025-06-22 14:30:15'
  })

  const [generateForm, setGenerateForm] = useState({
    type: 'simple',
    max: '100',
    min: '1',
    count: '1',
    weights: '10,20,30,40'
  })

  const [seedForm, setSeedForm] = useState({
    newSeed: ''
  })

  const [recentResults, setRecentResults] = useState<RandomResult[]>([
    { value: 42, timestamp: '2025-06-22 14:25:30', type: 'Simple (0-100)' },
    { value: 73, timestamp: '2025-06-22 14:20:15', type: 'Range (1-100)' },
    { value: 2, timestamp: '2025-06-22 14:15:45', type: 'Weighted' },
  ])

  const handleGenerateRandom = async () => {
    try {
      setIsLoading(true)
      let result: number

      // TODO: Implement actual contract calls
      switch (generateForm.type) {
        case 'simple':
          // await randomContract.generateRandom(generateForm.max)
          result = Math.floor(Math.random() * parseInt(generateForm.max))
          break
        case 'range':
          // await randomContract.generateRandomInRange(generateForm.min, generateForm.max)
          const min = parseInt(generateForm.min)
          const max = parseInt(generateForm.max)
          result = Math.floor(Math.random() * (max - min)) + min
          break
        case 'weighted':
          // await randomContract.weightedRandomSelect(weights)
          const weights = generateForm.weights.split(',').map(w => parseInt(w.trim()))
          const totalWeight = weights.reduce((sum, w) => sum + w, 0)
          const random = Math.random() * totalWeight
          let currentWeight = 0
          result = 0
          for (let i = 0; i < weights.length; i++) {
            currentWeight += weights[i]
            if (random < currentWeight) {
              result = i
              break
            }
          }
          break
        case 'multiple':
          // await randomContract.generateMultipleRandom(generateForm.count, generateForm.max)
          result = Math.floor(Math.random() * parseInt(generateForm.max))
          break
        default:
          result = Math.floor(Math.random() * 100)
      }

      const newResult: RandomResult = {
        value: result,
        timestamp: new Date().toLocaleString(),
        type: getTypeLabel(generateForm.type)
      }

      setRecentResults(prev => [newResult, ...prev.slice(0, 9)])
      toast.success(`随机数生成成功: ${result}`)
    } catch (error) {
      console.error('Failed to generate random number:', error)
      toast.error('随机数生成失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateSeed = async () => {
    try {
      setIsLoading(true)
      // TODO: Implement actual contract call
      // await randomContract.updateSeed(seedForm.newSeed)
      toast.success('随机数种子更新成功！')
      setSeedForm({ newSeed: '' })
    } catch (error) {
      console.error('Failed to update seed:', error)
      toast.error('更新随机数种子失败')
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'simple': return `Simple (0-${generateForm.max})`
      case 'range': return `Range (${generateForm.min}-${generateForm.max})`
      case 'weighted': return 'Weighted'
      case 'multiple': return `Multiple (${generateForm.count}x)`
      default: return 'Unknown'
    }
  }

  if (!address) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">🎲 随机数生成器</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔌</div>
          <div className="text-white/70">请先连接钱包</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">🎲 随机数生成器管理</h2>
          <p className="text-white/70">管理游戏随机数生成和种子配置</p>
        </div>
        <div className="text-sm text-white/60">
          合约地址: {CONTRACT_ADDRESSES.RandomGenerator}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 bg-white/5 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
        {[
          { id: 'overview', label: '概览', icon: '📊' },
          { id: 'generate', label: '生成随机数', icon: '🎲' },
          { id: 'seed', label: '种子管理', icon: '🌱' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl">🌱</div>
                <div className="text-sm text-white/60">当前种子</div>
              </div>
              <div className="text-lg font-bold text-white font-mono">
                {stats.currentSeed.slice(0, 10)}...
              </div>
              <div className="text-sm text-white/70">加密种子</div>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl">🔢</div>
                <div className="text-sm text-white/60">当前Nonce</div>
              </div>
              <div className="text-2xl font-bold text-white">{stats.currentNonce}</div>
              <div className="text-sm text-white/70">递增计数器</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl">🎯</div>
                <div className="text-sm text-white/60">总生成次数</div>
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalGenerations}</div>
              <div className="text-sm text-white/70">历史总数</div>
            </div>

            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl">⏰</div>
                <div className="text-sm text-white/60">最后更新</div>
              </div>
              <div className="text-sm font-bold text-white">{stats.lastUpdated}</div>
              <div className="text-sm text-white/70">种子更新时间</div>
            </div>
          </div>

          {/* Recent Results */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-6">📈 最近生成结果</h3>

            <div className="space-y-3">
              {recentResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {result.value}
                    </div>
                    <div>
                      <div className="text-white font-medium">{result.type}</div>
                      <div className="text-white/60 text-sm">{result.timestamp}</div>
                    </div>
                  </div>
                  <div className="text-white/70 text-sm">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          {/* Generation Form */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-6">🎲 生成随机数</h3>

            <div className="space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">
                  生成类型
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { value: 'simple', label: '简单随机', icon: '🎯', desc: '0到最大值' },
                    { value: 'range', label: '范围随机', icon: '📏', desc: '指定范围内' },
                    { value: 'weighted', label: '加权随机', icon: '⚖️', desc: '按权重选择' },
                    { value: 'multiple', label: '批量生成', icon: '🔢', desc: '生成多个' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setGenerateForm({ ...generateForm, type: type.value })}
                      className={`p-4 rounded-2xl border transition-all ${
                        generateForm.type === type.value
                          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-white'
                          : 'bg-white/5 border-white/20 text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs opacity-70">{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameters */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {generateForm.type === 'simple' && (
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      最大值 (不包含)
                    </label>
                    <input
                      type="number"
                      value={generateForm.max}
                      onChange={(e) => setGenerateForm({ ...generateForm, max: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="100"
                      min="1"
                    />
                  </div>
                )}

                {generateForm.type === 'range' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        最小值 (包含)
                      </label>
                      <input
                        type="number"
                        value={generateForm.min}
                        onChange={(e) => setGenerateForm({ ...generateForm, min: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        最大值 (不包含)
                      </label>
                      <input
                        type="number"
                        value={generateForm.max}
                        onChange={(e) => setGenerateForm({ ...generateForm, max: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="100"
                      />
                    </div>
                  </>
                )}

                {generateForm.type === 'weighted' && (
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      权重数组 (逗号分隔)
                    </label>
                    <input
                      type="text"
                      value={generateForm.weights}
                      onChange={(e) => setGenerateForm({ ...generateForm, weights: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="10,20,30,40"
                    />
                    <div className="text-xs text-white/50 mt-1">
                      例如: 10,20,30,40 表示索引0-3的权重分别为10,20,30,40
                    </div>
                  </div>
                )}

                {generateForm.type === 'multiple' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        生成数量
                      </label>
                      <input
                        type="number"
                        value={generateForm.count}
                        onChange={(e) => setGenerateForm({ ...generateForm, count: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="5"
                        min="1"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        最大值 (不包含)
                      </label>
                      <input
                        type="number"
                        value={generateForm.max}
                        onChange={(e) => setGenerateForm({ ...generateForm, max: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="100"
                        min="1"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateRandom}
                disabled={isLoading}
                variant="primary"
                className="w-full"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : '🎲 生成随机数'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Seed Tab */}
      {activeTab === 'seed' && (
        <div className="space-y-6">
          {/* Current Seed Info */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-6">🌱 当前种子信息</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    当前种子值
                  </label>
                  <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white font-mono text-sm">
                    {stats.currentSeed}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    当前Nonce
                  </label>
                  <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white font-mono text-sm">
                    {stats.currentNonce}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    最后更新时间
                  </label>
                  <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white text-sm">
                    {stats.lastUpdated}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    总生成次数
                  </label>
                  <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white text-sm">
                    {stats.totalGenerations.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Update Seed */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-6">🔄 更新种子</h3>

            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-yellow-400 mb-2">
                  <span>⚠️</span>
                  <span className="font-medium">安全提醒</span>
                </div>
                <div className="text-yellow-300/80 text-sm">
                  更新随机数种子会影响后续所有随机数生成。请确保新种子具有足够的随机性和安全性。
                  建议使用加密安全的随机数生成器生成种子值。
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  新种子值 (256位十六进制)
                </label>
                <input
                  type="text"
                  value={seedForm.newSeed}
                  onChange={(e) => setSeedForm({ newSeed: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  placeholder="0x1234567890abcdef..."
                />
                <div className="text-xs text-white/50 mt-1">
                  请输入64个十六进制字符 (0x + 64位)
                </div>
              </div>

              <Button
                onClick={handleUpdateSeed}
                disabled={isLoading || !seedForm.newSeed || seedForm.newSeed.length !== 66}
                variant="primary"
                className="w-full"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : '🌱 更新种子'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
