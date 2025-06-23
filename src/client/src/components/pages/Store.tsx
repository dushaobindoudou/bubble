import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useSkinAdmin } from '../../hooks/useSkinAdmin'
import { useSkinPurchase } from '../../hooks/useSkinPurchase'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Button } from '../ui/Button'
import { Header } from '../layout/Header'
import { MinimalBackground } from '../ui/AnimatedBackground'
import { toast } from 'react-hot-toast'

// 内容预览组件（复用之前的实现）
interface ContentPreviewCardProps {
  content: string
  templateName: string
  templateId: number
}

const ContentPreviewCard: React.FC<ContentPreviewCardProps> = ({ content, templateName, templateId }) => {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  // 检测内容类型
  const isImageUrl = (content: string): boolean => {
    if (!content) return false
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i
    const urlPattern = /^(https?:\/\/|ipfs:\/\/|\/ipfs\/)/i
    return urlPattern.test(content.trim()) && imageExtensions.test(content.trim()) || content.trim().startsWith('data:image/')
  }

  const isSvgContent = (content: string): boolean => {
    if (!content) return false
    const trimmed = content.trim()
    return trimmed.startsWith('<svg') && trimmed.includes('</svg>')
  }

  const isImage = isImageUrl(content)
  const isSvg = isSvgContent(content)

  return (
    <div className="aspect-square bg-gradient-to-br from-white/5 to-white/10 rounded-xl overflow-hidden relative">
      {/* 图片内容 */}
      {isImage && (
        <>
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner size="sm" />
            </div>
          )}
          
          {imageError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
              <div className="text-2xl mb-2">🖼️</div>
              <div className="text-xs text-center">图片加载失败</div>
            </div>
          ) : (
            <img
              src={content}
              alt={`${templateName} 预览`}
              className="w-full h-full object-cover transition-all duration-300"
              style={{ opacity: imageLoading ? 0 : 1 }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />
          )}
        </>
      )}

      {/* SVG 内容 */}
      {isSvg && (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div 
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      )}

      {/* 文本内容 */}
      {!isImage && !isSvg && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
          <div className="text-2xl mb-2">📄</div>
          <div className="text-xs text-center">皮肤预览</div>
        </div>
      )}
    </div>
  )
}

// 皮肤卡片组件
interface SkinCardProps {
  template: any
  userBalance: number
  onPurchase: (template: any) => void
  isPurchasing: boolean
  userOwnedSkins: number[]
}

const SkinCard: React.FC<SkinCardProps> = ({ 
  template, 
  userBalance, 
  onPurchase, 
  isPurchasing,
  userOwnedSkins 
}) => {
  const isOwned = userOwnedSkins.includes(template.templateId)
  const isSoldOut = template.currentSupply >= template.maxSupply
  const canAfford = userBalance >= (template.price || 100) // 默认价格 100 BUB
  const canPurchase = !isOwned && !isSoldOut && canAfford && template.isActive

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

  return (
    <div className={`bg-gradient-to-br ${getRarityColor(template.rarity)} backdrop-blur-xl rounded-3xl p-6 border transition-all duration-300 hover:scale-105 hover:shadow-2xl ${isOwned ? 'opacity-75' : ''}`}>
      {/* 皮肤预览 */}
      <div className="mb-4 relative">
        <ContentPreviewCard 
          content={template.content}
          templateName={template.name}
          templateId={template.templateId}
        />
        
        {/* 状态标签 */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(template.rarity)}`}>
            {getRarityIcon(template.rarity)} {template.rarity}
          </div>
          {isOwned && (
            <div className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium border border-green-500/30">
              ✅ 已拥有
            </div>
          )}
          {isSoldOut && (
            <div className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-medium border border-red-500/30">
              🔴 售罄
            </div>
          )}
        </div>
      </div>

      {/* 皮肤信息 */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">{template.name}</h3>
          <p className="text-white/70 text-sm">{template.description}</p>
        </div>

        {/* 特效类型 */}
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-xs">特效:</span>
          <span className="text-white text-xs font-medium">{template.effectType}</span>
        </div>

        {/* 库存进度 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">库存</span>
            <span className="text-white font-medium">
              {template.currentSupply} / {template.maxSupply}
            </span>
          </div>
          
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                template.currentSupply / template.maxSupply > 0.8 
                  ? 'bg-gradient-to-r from-red-500 to-red-400' 
                  : template.currentSupply / template.maxSupply > 0.5
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                  : 'bg-gradient-to-r from-green-500 to-green-400'
              }`}
              style={{ 
                width: `${Math.min((template.currentSupply / template.maxSupply) * 100, 100)}%` 
              }}
            />
          </div>
        </div>

        {/* 价格和购买按钮 */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="text-white font-bold text-lg">
              {template.price || 100} BUB
            </div>
            {!canAfford && !isOwned && (
              <div className="text-red-400 text-xs">余额不足</div>
            )}
          </div>
          
          <Button
            onClick={() => onPurchase(template)}
            variant={canPurchase ? "primary" : "ghost"}
            className="w-full"
            disabled={!canPurchase || isPurchasing}
          >
            {isPurchasing ? (
              <LoadingSpinner size="sm" />
            ) : isOwned ? (
              '已拥有'
            ) : isSoldOut ? (
              '已售罄'
            ) : !canAfford ? (
              '余额不足'
            ) : (
              '购买'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export const Store: React.FC = () => {
  const { address } = useAccount()
  const {
    templates,
    isLoadingTemplates,
    contractConnected,
    refreshData
  } = useSkinAdmin()

  const {
    tokenBalance,
    isPurchasing,
    purchaseState,
    purchaseSkin,
    resetPurchaseState,
    hasEnoughBalance,
    getUserOwnedSkins,
    refetchBalance,
  } = useSkinPurchase()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRarity, setSelectedRarity] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rarity'>('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [userOwnedSkins, setUserOwnedSkins] = useState<number[]>([])
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)

  // 筛选和排序皮肤
  const filteredAndSortedTemplates = React.useMemo(() => {
    let filtered = templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRarity = selectedRarity === 'ALL' || template.rarity === selectedRarity
      const isAvailable = template.isActive
      
      return matchesSearch && matchesRarity && isAvailable
    })

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (a.price || 100) - (b.price || 100)
        case 'rarity':
          const rarityOrder = { 'COMMON': 0, 'RARE': 1, 'EPIC': 2, 'LEGENDARY': 3 }
          return rarityOrder[b.rarity as keyof typeof rarityOrder] - rarityOrder[a.rarity as keyof typeof rarityOrder]
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return filtered
  }, [templates, searchTerm, selectedRarity, sortBy])

  // 加载用户拥有的皮肤 - 暂时禁用避免死循环
  useEffect(() => {
    // 暂时设置为空数组，避免死循环
    // TODO: 实现正确的用户拥有皮肤查询
    setUserOwnedSkins([])
  }, [address])

  // 监听购买状态变化
  useEffect(() => {
    if (purchaseState.step === 'success') {
      setShowPurchaseModal(false)
      setSelectedTemplate(null)
      // 简化处理，避免调用可能导致循环的函数
      setTimeout(() => {
        refreshData()
        refetchBalance()
        resetPurchaseState()
      }, 1000)
    }
  }, [purchaseState.step]) // 只依赖购买状态

  const handlePurchaseClick = (template: any) => {
    setSelectedTemplate(template)
    setShowPurchaseModal(true)
  }

  const handleConfirmPurchase = async () => {
    if (!selectedTemplate) return

    const price = selectedTemplate.price || 100
    await purchaseSkin(selectedTemplate.templateId, price)
  }

  if (!address) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <MinimalBackground />
        <div className="relative z-10 min-h-screen flex flex-col">
          <Header showGameButton={true} showStoreButton={false} showManagerButton={true} />
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
                <div className="text-6xl mb-4">🔗</div>
                <h2 className="text-2xl font-bold text-white mb-4">连接钱包</h2>
                <p className="text-white/70 mb-6">请连接您的钱包以访问皮肤商店</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (isLoadingTemplates) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <MinimalBackground />
        <div className="relative z-10 min-h-screen flex flex-col">
          <Header showGameButton={true} showStoreButton={false} showManagerButton={true} />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <div className="ml-4 text-white/70">正在加载皮肤商店...</div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <MinimalBackground />
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <Header
          title="泡泡大作战"
          subtitle="探索独特的游戏皮肤，个性化您的游戏体验"
          showGameButton={true}
          showStoreButton={false}
          showManagerButton={true}
        />

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* 页面标题 */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">🛍️ 皮肤商店</h1>
              <p className="text-white/70 text-lg">购买独特的游戏皮肤，个性化您的游戏体验</p>
            </div>

        {/* 用户信息栏 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl">💰</div>
              <div>
                <div className="text-white font-semibold">您的余额</div>
                <div className="text-white/70">{tokenBalance?.toLocaleString() || 0} BUB</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                contractConnected 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                <div className={`w-2 h-2 rounded-full ${contractConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                {contractConnected ? '合约已连接' : '合约连接失败'}
              </div>
              
              <Button onClick={refreshData} variant="ghost" size="sm">
                🔄 刷新
              </Button>
            </div>
          </div>
        </div>

        {/* 筛选和搜索栏 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 搜索框 */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="搜索皮肤名称或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
              />
            </div>
            
            {/* 稀有度筛选 */}
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
            >
              <option value="ALL">所有稀有度</option>
              <option value="COMMON">普通</option>
              <option value="RARE">稀有</option>
              <option value="EPIC">史诗</option>
              <option value="LEGENDARY">传说</option>
            </select>
            
            {/* 排序方式 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'rarity')}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
            >
              <option value="name">按名称排序</option>
              <option value="price">按价格排序</option>
              <option value="rarity">按稀有度排序</option>
            </select>
          </div>
          
          {/* 视图切换 */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-white/70 text-sm">
              找到 {filteredAndSortedTemplates.length} 个皮肤
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setViewMode('grid')}
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
              >
                🔲 网格
              </Button>
              <Button
                onClick={() => setViewMode('list')}
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
              >
                📋 列表
              </Button>
            </div>
          </div>
        </div>

        {/* 皮肤展示区域 */}
        {filteredAndSortedTemplates.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">未找到匹配的皮肤</h3>
            <p className="text-white/70">请尝试调整搜索条件或筛选选项</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredAndSortedTemplates.map((template) => (
              <SkinCard
                key={template.templateId}
                template={template}
                userBalance={tokenBalance || 0}
                onPurchase={handlePurchaseClick}
                isPurchasing={isPurchasing}
                userOwnedSkins={userOwnedSkins}
              />
            ))}
          </div>
            )}
          </div>
        </main>

        {/* 购买确认对话框 */}
        {showPurchaseModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full">
              <h3 className="text-xl font-semibold text-white mb-4">🛒 确认购买</h3>

              {/* 皮肤预览 */}
              <div className="mb-4">
                <ContentPreviewCard
                  content={selectedTemplate.content}
                  templateName={selectedTemplate.name}
                  templateId={selectedTemplate.templateId}
                />
              </div>

              {/* 皮肤信息 */}
              <div className="space-y-3 mb-6">
                <div>
                  <h4 className="text-lg font-bold text-white">{selectedTemplate.name}</h4>
                  <p className="text-white/70 text-sm">{selectedTemplate.description}</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/60">稀有度:</span>
                  <span className="text-white font-medium">{selectedTemplate.rarity}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/60">特效:</span>
                  <span className="text-white font-medium">{selectedTemplate.effectType}</span>
                </div>

                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="text-white">价格:</span>
                  <span className="text-white">{selectedTemplate.price || 100} BUB</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/60">您的余额:</span>
                  <span className="text-white">{tokenBalance.toLocaleString()} BUB</span>
                </div>
              </div>

              {/* 购买状态显示 */}
              {purchaseState.step !== 'idle' && (
                <div className="mb-4 p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                  <div className="flex items-center gap-2">
                    {purchaseState.step === 'approving' && (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="text-blue-300">正在授权代币使用...</span>
                      </>
                    )}
                    {purchaseState.step === 'minting' && (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="text-blue-300">正在铸造皮肤...</span>
                      </>
                    )}
                    {purchaseState.step === 'success' && (
                      <>
                        <span className="text-green-300">✅ 购买成功！</span>
                      </>
                    )}
                    {purchaseState.step === 'error' && (
                      <>
                        <span className="text-red-300">❌ 购买失败</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 按钮 */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowPurchaseModal(false)
                    setSelectedTemplate(null)
                    resetPurchaseState()
                  }}
                  variant="ghost"
                  className="flex-1"
                  disabled={isPurchasing}
                >
                  取消
                </Button>
                <Button
                  onClick={handleConfirmPurchase}
                  variant="primary"
                  className="flex-1"
                  disabled={isPurchasing || !hasEnoughBalance(selectedTemplate.price || 100)}
                >
                  {isPurchasing ? (
                    <LoadingSpinner size="sm" />
                  ) : !hasEnoughBalance(selectedTemplate.price || 100) ? (
                    '余额不足'
                  ) : (
                    '确认购买'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
