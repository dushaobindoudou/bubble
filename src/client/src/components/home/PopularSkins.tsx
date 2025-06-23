import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSkinAdmin } from '../../hooks/useSkinAdmin'
import { AnimatedBubble } from '../ui/AnimatedBubble'
import { Button } from '../ui/Button'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { EnhancedContentPreview } from '../ui/EnhancedContentPreview'

interface PopularSkin {
  templateId: number
  name: string
  description: string
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
  effectType: 'NONE' | 'GLOW' | 'SPARKLE' | 'RAINBOW' | 'LIGHTNING' | 'BUBBLE' | 'FLAME'
  content: string
  price?: number
  currentSupply: number
  maxSupply: number
  isActive: boolean
  popularity: number // 人气值
}

export const PopularSkins: React.FC = () => {
  const navigate = useNavigate()
  const { templates, isLoadingTemplates } = useSkinAdmin()
  const [popularSkins, setPopularSkins] = useState<PopularSkin[]>([])
  const [selectedSkin, setSelectedSkin] = useState<PopularSkin | null>(null)

  useEffect(() => {
    if (templates && templates.length > 0) {
      // 计算人气值并筛选热门皮肤
      const skinsWithPopularity = templates
        .filter(template => template.isActive && template.currentSupply > 0)
        .map(template => ({
          ...template,
          popularity: calculatePopularity(template)
        }))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 6) // 取前6个最热门的

      setPopularSkins(skinsWithPopularity)
      if (skinsWithPopularity.length > 0 && !selectedSkin) {
        setSelectedSkin(skinsWithPopularity[0])
      }
    }
  }, [templates, selectedSkin])

  // 计算皮肤人气值的算法
  const calculatePopularity = (template: any): number => {
    const rarityWeight = {
      'LEGENDARY': 100,
      'EPIC': 75,
      'RARE': 50,
      'COMMON': 25
    }

    const supplyRatio = template.currentSupply / template.maxSupply
    const rarityScore = rarityWeight[template.rarity as keyof typeof rarityWeight] || 25
    const supplyScore = supplyRatio * 50 // 铸造比例越高人气越高
    const scarcityBonus = template.maxSupply < 100 ? 25 : 0 // 限量版加分

    return rarityScore + supplyScore + scarcityBonus + Math.random() * 10 // 添加随机因子
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
      case 'EPIC': return 'from-purple-500/20 to-pink-500/20 border-purple-500/30'
      case 'RARE': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
      default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/30'
    }
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY': return '👑'
      case 'EPIC': return '💎'
      case 'RARE': return '⭐'
      default: return '🔹'
    }
  }

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY': return '传说'
      case 'EPIC': return '史诗'
      case 'RARE': return '稀有'
      case 'COMMON': return '普通'
      default: return '未知'
    }
  }

  const getEffectGradient = (effectType: string) => {
    switch (effectType) {
      case 'RAINBOW': return 'rainbow'
      case 'LIGHTNING': return 'purple'
      case 'FLAME': return 'pink'
      case 'GLOW': return 'cyan'
      case 'SPARKLE': return 'blue'
      default: return 'blue'
    }
  }

  const getPopularityLevel = (popularity: number) => {
    if (popularity >= 90) return { level: '🔥 超热门', color: 'text-red-400' }
    if (popularity >= 70) return { level: '🌟 热门', color: 'text-yellow-400' }
    if (popularity >= 50) return { level: '📈 上升', color: 'text-green-400' }
    return { level: '💫 新品', color: 'text-blue-400' }
  }

  if (isLoadingTemplates) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <div className="ml-4 text-white/70">正在加载热门皮肤...</div>
        </div>
      </div>
    )
  }

  if (popularSkins.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-xl">🔥</span>
            热门皮肤推荐
          </h3>
        </div>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-semibold text-white mb-2">暂无热门皮肤</h3>
          <p className="text-white/70 mb-6">皮肤模板正在准备中，敬请期待！</p>
          <Button onClick={() => navigate('/store')} variant="primary">
            🛍️ 前往商店
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-xl">🔥</span>
          热门皮肤推荐
        </h3>
        <Button
          onClick={() => navigate('/store')}
          variant="ghost"
          size="sm"
          className="text-white/70 hover:text-white"
        >
          查看更多 →
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 皮肤列表 */}
        <div className="space-y-3">
          {popularSkins.map((skin, index) => {
            const popularityInfo = getPopularityLevel(skin.popularity)
            return (
              <div
                key={skin.templateId}
                onClick={() => setSelectedSkin(skin)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                  selectedSkin?.templateId === skin.templateId
                    ? `bg-gradient-to-r ${getRarityColor(skin.rarity)} ring-2 ring-white/30`
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* 排名 */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-white/20 text-white/70'
                  }`}>
                    {index + 1}
                  </div>

                  {/* 皮肤预览 */}
                  <div className="w-12 h-12 flex-shrink-0">
                    <EnhancedContentPreview
                      content={skin.content}
                      templateName={skin.name}
                      templateId={skin.templateId}
                      size="sm"
                      showLabel={false}
                    />
                  </div>

                  {/* 皮肤信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-semibold text-sm truncate">{skin.name}</h4>
                      <span className="text-xs">{getRarityIcon(skin.rarity)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${popularityInfo.color}`}>
                        {popularityInfo.level}
                      </span>
                      <span className="text-white/60 text-xs">
                        {skin.currentSupply}/{skin.maxSupply}
                      </span>
                    </div>
                  </div>

                  {/* 价格 */}
                  <div className="text-right">
                    <div className="text-white font-bold text-sm">{skin.price || 100} BUB</div>
                    <div className="text-white/60 text-xs">{getRarityText(skin.rarity)}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 选中皮肤详情 */}
        <div className="space-y-4">
          {selectedSkin ? (
            <>
              {/* 大预览 */}
              <div className="aspect-square bg-gradient-to-br from-white/10 to-white/5 rounded-2xl overflow-hidden">
                <EnhancedContentPreview
                  content={selectedSkin.content}
                  templateName={selectedSkin.name}
                  templateId={selectedSkin.templateId}
                  size="lg"
                  showLabel={true}
                  enableFullView={true}
                />
              </div>

              {/* 皮肤详情 */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-lg font-bold text-white">{selectedSkin.name}</h4>
                  <p className="text-white/70 text-sm mt-1">{selectedSkin.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRarityColor(selectedSkin.rarity)}`}>
                    {getRarityIcon(selectedSkin.rarity)} {getRarityText(selectedSkin.rarity)}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPopularityLevel(selectedSkin.popularity).color} bg-white/10`}>
                    {getPopularityLevel(selectedSkin.popularity).level}
                  </div>
                </div>

                {/* 供应量进度 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">铸造进度</span>
                    <span className="text-white font-medium">
                      {selectedSkin.currentSupply} / {selectedSkin.maxSupply}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        selectedSkin.currentSupply / selectedSkin.maxSupply > 0.8 
                          ? 'bg-gradient-to-r from-red-500 to-red-400' 
                          : selectedSkin.currentSupply / selectedSkin.maxSupply > 0.5
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                          : 'bg-gradient-to-r from-green-500 to-green-400'
                      }`}
                      style={{ 
                        width: `${Math.min((selectedSkin.currentSupply / selectedSkin.maxSupply) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>

                {/* 购买按钮 */}
                <Button
                  onClick={() => navigate('/store')}
                  variant="primary"
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  🛍️ 立即购买 ({selectedSkin.price || 100} BUB)
                </Button>
              </div>
            </>
          ) : (
            <div className="aspect-square bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <AnimatedBubble size={64} gradient="blue" opacity={0.5} />
                <p className="text-white/70 mt-4">选择一个皮肤查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
