import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { useSkinAdmin } from '../../hooks/useSkinAdmin'
import { useSkinPurchase } from '../../hooks/useSkinPurchase'
import { useMarketplace } from '../../hooks/useMarketplace'
import { useTokenBalance } from '../../hooks/useTokenBalance'
import { useNFTSkins, NFTSkin } from '../../hooks/useNFTSkins'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Button } from '../ui/Button'
import { Header } from '../layout/Header'
import { MinimalBackground } from '../ui/AnimatedBackground'
import { EnhancedContentPreview } from '../ui/EnhancedContentPreview'
import { NFTListingCard } from '../marketplace/NFTListingCard'
import { SellNFTDialog } from '../marketplace/SellNFTDialog'
import { RPCMonitor } from '../debug/RPCMonitor'
import { CONTRACT_ADDRESSES } from '../../config/contracts'
import { toast } from 'react-hot-toast'
import { useDebounce } from '../../utils/rpcOptimization'
import '../../utils/contractDebug' // 导入合约调试工具
import '../../utils/marketplaceDebug' // 导入 Marketplace 调试工具

// 用户 NFT 卡片组件
interface UserNFTCardProps {
  nft: NFTSkin
  onSell: (nft: NFTSkin) => void
  isListed?: boolean
  isEquipped?: boolean
  listingPrice?: string
}

const UserNFTCard: React.FC<UserNFTCardProps> = ({
  nft,
  onSell,
  isListed = false,
  isEquipped = false,
  listingPrice
}) => {
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('zh-CN')
  }

  return (
    <div className={`bg-gradient-to-br ${getRarityColor(nft.rarity)} backdrop-blur-xl rounded-3xl p-4 border transition-all duration-300 hover:scale-[1.02] ${
      isEquipped ? 'ring-2 ring-green-400/50' : ''
    }`}>
      {/* 状态标签 */}
      <div className="flex justify-between items-start mb-3">
        <div className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRarityColor(nft.rarity)}`}>
          {getRarityIcon(nft.rarity)} {getRarityText(nft.rarity)}
        </div>

        <div className="flex flex-col gap-1">
          {isEquipped && (
            <div className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium border border-green-500/30">
              ⚔️ 已装备
            </div>
          )}
          {isListed && (
            <div className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium border border-blue-500/30">
              🏷️ 已上架
            </div>
          )}
          <div className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium border border-purple-500/30">
            NFT
          </div>
        </div>
      </div>

      {/* NFT 预览 */}
      <div className="mb-4">
        <EnhancedContentPreview
          content={nft.content}
          templateName={nft.name}
          templateId={parseInt(nft.templateId)}
          size="md"
          showLabel={false}
          enableFullView={true}
        />
      </div>

      {/* NFT 信息 */}
      <div className="space-y-3">
        <div>
          <h3 className="text-white font-semibold text-sm mb-1">{nft.name}</h3>
          <p className="text-white/70 text-xs line-clamp-2">{nft.description}</p>
        </div>

        {/* 详细信息 */}
        <div className="bg-black/20 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-white/60">Token ID:</span>
              <div className="text-white font-medium">#{nft.tokenId}</div>
            </div>
            <div>
              <span className="text-white/60">序列号:</span>
              <div className="text-white font-medium">#{nft.serialNumber}</div>
            </div>
            <div>
              <span className="text-white/60">特效:</span>
              <div className="text-white font-medium">{nft.effectType}</div>
            </div>
            <div>
              <span className="text-white/60">铸造时间:</span>
              <div className="text-white font-medium">{formatDate(nft.mintedAt)}</div>
            </div>
          </div>

          {isListed && listingPrice && (
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs">挂单价格:</span>
                <span className="text-green-400 font-bold">{listingPrice} BUB</span>
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="space-y-2">
          {!isListed && (
            <Button
              onClick={() => onSell(nft)}
              variant="primary"
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              disabled={isEquipped}
            >
              💰 出售 NFT
            </Button>
          )}

          {isListed && (
            <div className="text-center p-2 bg-blue-500/20 rounded-xl border border-blue-400/30">
              <span className="text-blue-400 font-semibold text-sm">已在市场上架</span>
            </div>
          )}

          {isEquipped && !isListed && (
            <div className="text-center p-2 bg-yellow-500/20 rounded-xl border border-yellow-400/30">
              <span className="text-yellow-400 font-semibold text-sm">装备中无法出售</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 皮肤模板卡片组件
interface SkinTemplateCardProps {
  template: any
  onPurchase: (template: any) => void
}

const SkinTemplateCard: React.FC<SkinTemplateCardProps> = ({ template, onPurchase }) => {
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
    <div className={`bg-gradient-to-br ${getRarityColor(template.rarity)} backdrop-blur-xl rounded-3xl p-4 border transition-all duration-300 hover:scale-[1.02]`}>
      {/* 稀有度标签 */}
      <div className="flex justify-between items-start mb-3">
        <div className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRarityColor(template.rarity)}`}>
          {getRarityIcon(template.rarity)} {template.rarity}
        </div>
        <div className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium border border-green-500/30">
          模板
        </div>
      </div>

      {/* 皮肤预览 */}
      <div className="mb-4 relative">
        <EnhancedContentPreview
          content={template.content}
          templateName={template.name}
          templateId={template.templateId}
          size="md"
          showLabel={true}
          enableFullView={true}
        />
      </div>

      {/* 皮肤信息 */}
      <div className="space-y-3">
        <div>
          <h3 className="text-white font-semibold text-sm mb-1">{template.name}</h3>
          <p className="text-white/70 text-xs line-clamp-2">{template.description}</p>
        </div>

        {/* 价格和库存 */}
        <div className="bg-black/20 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-xs">价格</span>
            <div className="text-right">
              <div className="text-white font-bold text-lg">{template.price || 100} BUB</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">库存</span>
            <span className="text-white">{template.currentSupply}/{template.maxSupply}</span>
          </div>
        </div>

        {/* 购买按钮 */}
        <Button
          onClick={() => onPurchase(template)}
          variant="primary"
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        >
          🛒 购买模板
        </Button>
      </div>
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
        <EnhancedContentPreview
          content={template.content}
          templateName={template.name}
          templateId={template.templateId}
          size="md"
          showLabel={true}
          enableFullView={true}
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

// Helper function to safely serialize objects with BigInt values
const safeStringify = (obj: any): string => {
  if (!obj) return '无'
  try {
    return JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  } catch (error) {
    return `序列化错误: ${error instanceof Error ? error.message : '未知错误'}`
  }
}

export const Store: React.FC = () => {
  const { address } = useAccount()
  const { templates, isLoadingTemplates } = useSkinAdmin()
  const { purchaseSkin, isPurchasing } = useSkinPurchase()
  const { balance: bubBalance } = useTokenBalance()
  const { skins: userNFTs, isLoading: isLoadingNFTs, refreshSkins } = useNFTSkins()

  const [activeTab, setActiveTab] = useState<'marketplace' | 'templates' | 'mynfts'>('marketplace')

  const {
    listings,
    userListings,
    marketStats,
    buyNFT,
    isBuying,
    isLoading: isLoadingMarketplace,
    error: marketplaceError,
    refreshData: refreshMarketplace
  } = useMarketplace()

  // 调试信息
  console.log('Store Debug Info:', {
    activeTab,
    listings: listings.length,
    userListings: userListings.length,
    marketStats,
    marketplaceError,
    userNFTs: userNFTs.length,
    templates: templates.length,
  })
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [selectedListing, setSelectedListing] = useState<any>(null)
  const [selectedNFT, setSelectedNFT] = useState<NFTSkin | null>(null)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [showBuyDialog, setShowBuyDialog] = useState(false)
  const [showSellDialog, setShowSellDialog] = useState(false)
  const [filter, setFilter] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all')
  const [nftFilter, setNftFilter] = useState<'all' | 'listed' | 'unlisted' | 'equipped'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'rarity' | 'price'>('name')
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'mid' | 'high'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // 筛选和排序 NFT 挂单
  const filteredAndSortedListings = React.useMemo(() => {
    let filtered = listings.filter(listing => {
      // 基本筛选：只显示活跃的挂单
      if (listing.status !== 0) return false

      // 价格范围筛选
      const price = parseFloat(formatEther(listing.price))
      if (priceRange === 'low' && price > 100) return false
      if (priceRange === 'mid' && (price <= 100 || price > 500)) return false
      if (priceRange === 'high' && price <= 500) return false

      return true
    })

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          // 安全地处理 BigInt 类型的价格比较
          const priceA = typeof a.price === 'bigint' ? Number(a.price) : a.price
          const priceB = typeof b.price === 'bigint' ? Number(b.price) : b.price
          return priceA - priceB
        case 'rarity':
          // 这里需要从 NFT 元数据获取稀有度，暂时按价格排序
          const priceA_rarity = typeof a.price === 'bigint' ? Number(a.price) : a.price
          const priceB_rarity = typeof b.price === 'bigint' ? Number(b.price) : b.price
          return priceB_rarity - priceA_rarity
        default:
          // 安全地处理 tokenId 比较
          const tokenIdA = typeof a.tokenId === 'bigint' ? Number(a.tokenId) : a.tokenId
          const tokenIdB = typeof b.tokenId === 'bigint' ? Number(b.tokenId) : b.tokenId
          return tokenIdA - tokenIdB
      }
    })

    return filtered
  }, [listings, priceRange, sortBy])

  // 筛选和排序用户 NFT
  const filteredAndSortedUserNFTs = React.useMemo(() => {
    // 获取当前装备的皮肤 ID
    const equippedSkinId = localStorage.getItem('bubble_brawl_equipped_skin') || 'default'

    // 创建用户挂单的映射
    const userListingMap = new Map()
    userListings.forEach(listing => {
      if (listing.status === 0) { // 只考虑活跃挂单
        userListingMap.set(listing.tokenId.toString(), {
          listingId: listing.listingId,
          price: formatEther(listing.price)
        })
      }
    })

    let filtered = userNFTs.filter(nft => {
      const isListed = userListingMap.has(nft.tokenId)
      const isEquipped = nft.templateId === equippedSkinId

      // 根据筛选条件过滤
      switch (nftFilter) {
        case 'listed': return isListed
        case 'unlisted': return !isListed
        case 'equipped': return isEquipped
        default: return true
      }
    })

    // 根据稀有度筛选
    if (filter !== 'all') {
      filtered = filtered.filter(nft => nft.rarity.toLowerCase() === filter)
    }

    // 搜索筛选
    if (searchTerm) {
      filtered = filtered.filter(nft =>
        nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          // 按挂单价格排序，未挂单的排在后面
          const priceA = userListingMap.get(a.tokenId)?.price || '999999'
          const priceB = userListingMap.get(b.tokenId)?.price || '999999'
          return parseFloat(priceA) - parseFloat(priceB)
        case 'rarity':
          const rarityOrder = { 'COMMON': 0, 'RARE': 1, 'EPIC': 2, 'LEGENDARY': 3 }
          return rarityOrder[b.rarity as keyof typeof rarityOrder] - rarityOrder[a.rarity as keyof typeof rarityOrder]
        default:
          return a.name.localeCompare(b.name)
      }
    })

    // 添加挂单信息
    return filtered.map(nft => ({
      ...nft,
      isListed: userListingMap.has(nft.tokenId),
      isEquipped: nft.templateId === equippedSkinId,
      listingPrice: userListingMap.get(nft.tokenId)?.price
    }))
  }, [userNFTs, userListings, nftFilter, filter, searchTerm, sortBy])

  // 筛选和排序皮肤模板
  const filteredAndSortedTemplates = React.useMemo(() => {
    let filtered = templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRarity = filter === 'all' || template.rarity.toLowerCase() === filter
      const isAvailable = template.isActive

      return matchesSearch && matchesRarity && isAvailable
    })

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          // 皮肤模板没有价格字段，按模板ID排序
          return a.templateId - b.templateId
        case 'rarity':
          const rarityOrder = { 'COMMON': 0, 'RARE': 1, 'EPIC': 2, 'LEGENDARY': 3 }
          return rarityOrder[b.rarity as keyof typeof rarityOrder] - rarityOrder[a.rarity as keyof typeof rarityOrder]
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return filtered
  }, [templates, searchTerm, filter, sortBy])

  // 处理 NFT 购买
  const handleBuyNFT = async (listingId: number) => {
    try {
      await buyNFT(listingId)
      // 刷新数据
    //   setTimeout(() => {
    //     refreshMarketplace()
    //   }, 2000)
    } catch (error) {
      console.error('Buy NFT error:', error)
    }
  }

  // 处理模板购买
  const handlePurchaseTemplate = (template: any) => {
    setSelectedTemplate(template)
    setShowPurchaseDialog(true)
  }

  const handleConfirmPurchase = async () => {
    if (!selectedTemplate) return

    try {
      const price = selectedTemplate.price || 100
      await purchaseSkin(selectedTemplate.templateId, price)
      setShowPurchaseDialog(false)
      setSelectedTemplate(null)
      // 刷新数据
      // setTimeout(() => {
      //   refreshTemplates()
      // }, 2000)
    } catch (error) {
      console.error('Purchase template error:', error)
    }
  }

  // 处理 NFT 出售
  const handleSellNFT = (nft: NFTSkin) => {
    setSelectedNFT(nft)
    setShowSellDialog(true)
  }

  // 出售成功回调
  const handleSellSuccess = () => {
    // 刷新相关数据
    setTimeout(() => {
      refreshMarketplace()
      refreshSkins()
    }, 2000)
    toast.success('NFT 上架成功！')
  }

  // 刷新所有数据 - 添加防抖机制
  const refreshAllDataImmediate = async () => {
    try {
      await Promise.all([
        refreshMarketplace(),
        // refreshTemplates(), // 模板数据不需要刷新
        refreshSkins()
      ])
      toast.success('数据刷新成功')
    } catch (error) {
      console.error('Refresh data error:', error)
      toast.error('数据刷新失败')
    }
  }

  // 防抖的刷新函数
  const refreshAllData = useDebounce(refreshAllDataImmediate, 1000)

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
              <p className="text-white/70 text-lg">探索 NFT 市场和皮肤模板，个性化您的游戏体验</p>
            </div>

            {/* 标签页导航 */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-2 border border-white/20">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === 'marketplace'
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-xl">🏪</span>
                  <span className="hidden sm:inline">NFT 市场</span>
                  <span className="sm:hidden">市场</span>
                  {marketStats && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {typeof marketStats.activeListings === 'bigint' ? Number(marketStats.activeListings) : marketStats.activeListings}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('mynfts')}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === 'mynfts'
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-xl">💎</span>
                  <span className="hidden sm:inline">我的 NFT</span>
                  <span className="sm:hidden">我的</span>
                  {userNFTs.length > 0 && (
                    <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                      {userNFTs.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === 'templates'
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-xl">🎨</span>
                  <span className="hidden sm:inline">皮肤模板</span>
                  <span className="sm:hidden">模板</span>
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    {templates.length}
                  </span>
                </button>
              </div>
            </div>

            {/* 用户信息栏 */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">💰</div>
                    <div>
                      <div className="text-white font-semibold">您的余额</div>
                      <div className="text-white/70">{bubBalance?.toLocaleString() || 0} BUB</div>
                    </div>
                  </div>

                  {marketStats && (
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">📊</div>
                      <div>
                        <div className="text-white font-semibold">市场统计</div>
                        <div className="text-white/70 text-sm">
                          {typeof marketStats.activeListings === 'bigint' ? Number(marketStats.activeListings) : marketStats.activeListings} 个挂单 • 总成交 {typeof marketStats.totalSales === 'bigint' ? Number(marketStats.totalSales) : marketStats.totalSales}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <Button onClick={refreshAllData} variant="ghost" size="sm">
                    🔄 刷新
                  </Button>
                </div>
              </div>
            </div>

            {/* 筛选和搜索栏 */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 搜索框 */}
                {(activeTab === 'templates' || activeTab === 'mynfts') && (
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder={activeTab === 'mynfts' ? "搜索我的 NFT..." : "搜索皮肤名称或描述..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    />
                  </div>
                )}

                {/* 筛选选项 */}
                {activeTab === 'marketplace' ? (
                  <>
                    <div className="md:col-span-2">
                      <select
                        value={priceRange}
                        onChange={(e) => setPriceRange(e.target.value as any)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                      >
                        <option value="all">所有价格</option>
                        <option value="low">低价 (≤100 BUB)</option>
                        <option value="mid">中价 (100-500 BUB)</option>
                        <option value="high">高价 (&gt;500 BUB)</option>
                      </select>
                    </div>
                  </>
                ) : activeTab === 'mynfts' ? (
                  <>
                    <select
                      value={nftFilter}
                      onChange={(e) => setNftFilter(e.target.value as any)}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                    >
                      <option value="all">所有 NFT</option>
                      <option value="unlisted">可出售</option>
                      <option value="listed">已上架</option>
                      <option value="equipped">已装备</option>
                    </select>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value as any)}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                    >
                      <option value="all">所有稀有度</option>
                      <option value="common">普通</option>
                      <option value="rare">稀有</option>
                      <option value="epic">史诗</option>
                      <option value="legendary">传说</option>
                    </select>
                  </>
                ) : (
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                  >
                    <option value="all">所有稀有度</option>
                    <option value="common">普通</option>
                    <option value="rare">稀有</option>
                    <option value="epic">史诗</option>
                    <option value="legendary">传说</option>
                  </select>
                )}

                {/* 排序方式 */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                >
                  <option value="name">按名称排序</option>
                  <option value="price">{activeTab === 'mynfts' ? '按挂单价格排序' : '按价格排序'}</option>
                  <option value="rarity">按稀有度排序</option>
                </select>
              </div>

              {/* 统计信息 */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-white/70 text-sm">
                  {activeTab === 'marketplace'
                    ? `找到 ${filteredAndSortedListings.length} 个 NFT 挂单`
                    : activeTab === 'mynfts'
                    ? `找到 ${filteredAndSortedUserNFTs.length} 个我的 NFT`
                    : `找到 ${filteredAndSortedTemplates.length} 个皮肤模板`
                  }
                </div>

                {activeTab === 'mynfts' && (
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-white/60">总计 {userNFTs.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-white/60">已上架 {filteredAndSortedUserNFTs.filter(nft => nft.isListed).length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-white/60">已装备 {filteredAndSortedUserNFTs.filter(nft => nft.isEquipped).length}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 主要内容区域 */}
            {activeTab === 'marketplace' ? (
              /* NFT 市场 */
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
                {isLoadingMarketplace ? (
                  <div className="text-center py-12">
                    <LoadingSpinner size="lg" />
                    <div className="mt-4 text-white/70">正在加载 NFT 市场数据...</div>
                  </div>
                ) : marketplaceError ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-xl font-semibold text-white mb-2">加载市场数据失败</h3>
                    <p className="text-white/70 mb-4">{marketplaceError}</p>
                    <Button
                      onClick={refreshMarketplace}
                      variant="primary"
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      🔄 重试
                    </Button>
                  </div>
                ) : listings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏪</div>
                    <h3 className="text-xl font-semibold text-white mb-2">暂无 NFT 挂单</h3>
                    <p className="text-white/70 mb-4">市场上还没有 NFT 皮肤在售</p>

                    {/* 开发环境调试信息 */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-4 p-4 bg-black/20 rounded-xl text-left text-xs text-white/60">
                        <div>调试信息:</div>
                        <div>• 合约地址: {CONTRACT_ADDRESSES.Marketplace}</div>
                        <div>• 挂单数量: {listings.length}</div>
                        <div>• 市场统计: {safeStringify(marketStats)}</div>
                        <div>• 错误信息: {marketplaceError || '无'}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredAndSortedListings.map((listing) => (
                      <NFTListingCard
                        key={listing.listingId}
                        listing={listing}
                        onBuy={handleBuyNFT}
                        isBuying={isBuying}
                        size="md"
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'mynfts' ? (
              /* 我的 NFT */
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
                {isLoadingNFTs ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                    <div className="ml-4 text-white/70">正在加载您的 NFT...</div>
                  </div>
                ) : userNFTs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💎</div>
                    <h3 className="text-xl font-semibold text-white mb-2">暂无 NFT</h3>
                    <p className="text-white/70 mb-4">您还没有拥有任何 NFT 皮肤</p>
                    <Button
                      onClick={() => setActiveTab('marketplace')}
                      variant="primary"
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      🏪 去市场购买
                    </Button>
                  </div>
                ) : filteredAndSortedUserNFTs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-white mb-2">未找到匹配的 NFT</h3>
                    <p className="text-white/70">请尝试调整筛选条件</p>
                  </div>
                ) : (
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredAndSortedUserNFTs.map((nft) => (
                      <UserNFTCard
                        key={nft.tokenId}
                        nft={nft}
                        onSell={handleSellNFT}
                        isListed={nft.isListed}
                        isEquipped={nft.isEquipped}
                        listingPrice={nft.listingPrice}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* 皮肤模板 */
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
                {isLoadingTemplates ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : filteredAndSortedTemplates.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎨</div>
                    <h3 className="text-xl font-semibold text-white mb-2">暂无皮肤模板</h3>
                    <p className="text-white/70">没有找到符合条件的皮肤模板</p>
                  </div>
                ) : (
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredAndSortedTemplates.map((template) => (
                      <SkinTemplateCard
                        key={template.templateId}
                        template={template}
                        onPurchase={handlePurchaseTemplate}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* 购买确认对话框 */}
        {showPurchaseDialog && selectedTemplate && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full">
              <h3 className="text-xl font-semibold text-white mb-4">🛒 确认购买</h3>

              {/* 皮肤预览 */}
              <div className="mb-4">
                <EnhancedContentPreview
                  content={selectedTemplate.content}
                  templateName={selectedTemplate.name}
                  templateId={selectedTemplate.templateId}
                  size="md"
                  showLabel={true}
                  enableFullView={true}
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
                  <span className="text-white">{bubBalance?.toLocaleString() || 0} BUB</span>
                </div>
              </div>



              {/* 按钮 */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowPurchaseDialog(false)
                    setSelectedTemplate(null)
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
                  disabled={isPurchasing}
                  loading={isPurchasing}
                >
                  确认购买
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 出售 NFT 对话框 */}
        {showSellDialog && selectedNFT && (
          <SellNFTDialog
            nft={selectedNFT}
            isOpen={showSellDialog}
            onClose={() => {
              setShowSellDialog(false)
              setSelectedNFT(null)
            }}
            onSuccess={handleSellSuccess}
          />
        )}

        {/* RPC 监控组件 - 仅在开发环境显示 */}
        {process.env.NODE_ENV === 'development' && <RPCMonitor />}
      </div>
    </div>
  )
}
