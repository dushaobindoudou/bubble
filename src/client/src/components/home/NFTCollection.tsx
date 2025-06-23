import React, { useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { useNFTSkins, NFTSkin } from '../../hooks/useNFTSkins'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Button } from '../ui/Button'
import { EnhancedContentPreview } from '../ui/EnhancedContentPreview'
import { toast } from 'react-hot-toast'

// 使用增强版内容预览组件

// NFT 卡片组件
interface NFTCardProps {
  nft: NFTSkin
  isSelected: boolean
  isEquipped: boolean
  onSelect: (nft: NFTSkin) => void
  onEquip: (nft: NFTSkin) => void
  viewMode: 'grid' | 'list'
}

const NFTCard: React.FC<NFTCardProps> = ({ 
  nft, 
  isSelected, 
  isEquipped, 
  onSelect, 
  onEquip,
  viewMode 
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

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '未知时间'
    return new Date(timestamp * 1000).toLocaleDateString('zh-CN')
  }

  if (viewMode === 'list') {
    return (
      <div 
        className={`bg-gradient-to-r ${getRarityColor(nft.rarity)} backdrop-blur-xl rounded-2xl p-4 border transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
          isSelected ? 'ring-2 ring-blue-400' : ''
        } ${isEquipped ? 'ring-2 ring-green-400' : ''}`}
        onClick={() => onSelect(nft)}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 flex-shrink-0">
            <EnhancedContentPreview
              content={nft.content}
              templateName={nft.name}
              templateId={nft.templateId}
              size="sm"
              showLabel={false}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold truncate">{nft.name}</h3>
              <span className="text-xs">{getRarityIcon(nft.rarity)}</span>
            </div>
            <p className="text-white/70 text-sm truncate">{nft.description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-white/60">
              <span>Token ID: {nft.tokenId}</span>
              <span>获得时间: {formatDate(nft.mintedAt)}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {isEquipped ? (
              <div className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium border border-green-500/30">
                ✅ 已装备
              </div>
            ) : (
              <Button
                onClick={() => onEquip(nft)}
                variant="primary"
                size="sm"
                className="text-xs"
              >
                装备
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`bg-gradient-to-br ${getRarityColor(nft.rarity)} backdrop-blur-xl rounded-3xl p-4 border transition-all duration-300 hover:scale-105 cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-400' : ''
      } ${isEquipped ? 'ring-2 ring-green-400' : ''}`}
      onClick={() => onSelect(nft)}
    >
      {/* 状态标签 */}
      <div className="flex justify-between items-start mb-3">
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(nft.rarity)}`}>
          {getRarityIcon(nft.rarity)} {nft.rarity}
        </div>
        {isEquipped && (
          <div className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium border border-green-500/30">
            ✅ 已装备
          </div>
        )}
      </div>

      {/* NFT 预览 */}
      <div className="mb-3">
        <EnhancedContentPreview
          content={nft.content}
          templateName={nft.name}
          templateId={nft.templateId}
          size="md"
          showLabel={true}
          enableFullView={true}
        />
      </div>

      {/* NFT 信息 */}
      <div className="space-y-2">
        <h3 className="text-white font-semibold text-sm truncate">{nft.name}</h3>
        <p className="text-white/70 text-xs line-clamp-2">{nft.description}</p>
        
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>#{nft.tokenId}</span>
          <span>{formatDate(nft.mintedAt)}</span>
        </div>

        {!isEquipped && (
          <Button
            onClick={() => onEquip(nft)}
            variant="primary"
            size="sm"
            className="w-full mt-2"
          >
            装备
          </Button>
        )}
      </div>
    </div>
  )
}

// 主要的 NFT 收藏组件
export const NFTCollection: React.FC = () => {
  const { address } = useAccount()
  const navigate = useNavigate()
  const { skins: nftSkins, isLoading, error, totalSkins } = useNFTSkins()
  
  const [selectedNFT, setSelectedNFT] = useState<NFTSkin | null>(null)
  const [equippedSkinId, setEquippedSkinId] = useState<string>(() => 
    localStorage.getItem('bubble_brawl_equipped_skin') || 'default'
  )
  const [filterRarity, setFilterRarity] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'date' | 'rarity' | 'name'>('date')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // 计算收藏统计
  const collectionStats = useMemo(() => {
    const rarityCount = nftSkins.reduce((acc, nft) => {
      acc[nft.rarity] = (acc[nft.rarity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 简单的价值估算（基于稀有度）
    const estimatedValue = nftSkins.reduce((total, nft) => {
      const values = { COMMON: 10, RARE: 50, EPIC: 200, LEGENDARY: 1000 }
      return total + (values[nft.rarity] || 10)
    }, 0)

    return {
      total: totalSkins,
      rarityCount,
      estimatedValue
    }
  }, [nftSkins, totalSkins])

  // 筛选和排序 NFT
  const filteredAndSortedNFTs = useMemo(() => {
    let filtered = nftSkins.filter(nft => {
      if (filterRarity === 'ALL') return true
      return nft.rarity === filterRarity
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.mintedAt - a.mintedAt
        case 'rarity':
          const rarityOrder = { 'LEGENDARY': 3, 'EPIC': 2, 'RARE': 1, 'COMMON': 0 }
          return rarityOrder[b.rarity] - rarityOrder[a.rarity]
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return filtered
  }, [nftSkins, filterRarity, sortBy])

  const handleEquipSkin = (nft: NFTSkin) => {
    setEquippedSkinId(nft.tokenId)
    localStorage.setItem('bubble_brawl_equipped_skin', nft.tokenId)
    toast.success(`已装备 ${nft.name}`)
  }

  if (!address) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
        <div className="text-6xl mb-4">🔗</div>
        <h3 className="text-xl font-semibold text-white mb-2">连接钱包</h3>
        <p className="text-white/70 mb-4">请连接您的钱包以查看 NFT 收藏</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
          <div className="ml-4 text-white/70">正在加载您的 NFT 收藏...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-white mb-2">加载失败</h3>
        <p className="text-white/70 mb-4">{error}</p>
      </div>
    )
  }

  if (totalSkins === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
        <div className="text-6xl mb-4">🛍️</div>
        <h3 className="text-xl font-semibold text-white mb-2">暂无 NFT 收藏</h3>
        <p className="text-white/70 mb-6">您还没有任何皮肤 NFT，快去商店购买吧！</p>
        <Button
          onClick={() => navigate('/store')}
          variant="primary"
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        >
          🛍️ 前往商店
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 收藏统计 */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          我的 NFT 收藏
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{collectionStats.total}</div>
            <div className="text-white/70 text-sm">总数量</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{collectionStats.rarityCount.LEGENDARY || 0}</div>
            <div className="text-white/70 text-sm">传说级</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{collectionStats.rarityCount.EPIC || 0}</div>
            <div className="text-white/70 text-sm">史诗级</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{collectionStats.estimatedValue}</div>
            <div className="text-white/70 text-sm">估值 (BUB)</div>
          </div>
        </div>
      </div>

      {/* 筛选和控制栏 */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-4">
            {/* 稀有度筛选 */}
            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-white/40"
            >
              <option value="ALL">所有稀有度</option>
              <option value="LEGENDARY">传说</option>
              <option value="EPIC">史诗</option>
              <option value="RARE">稀有</option>
              <option value="COMMON">普通</option>
            </select>

            {/* 排序方式 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'rarity' | 'name')}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-white/40"
            >
              <option value="date">按获得时间</option>
              <option value="rarity">按稀有度</option>
              <option value="name">按名称</option>
            </select>
          </div>

          {/* 视图切换 */}
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

      {/* NFT 展示区域 */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <div className="mb-4 text-white/70 text-sm">
          找到 {filteredAndSortedNFTs.length} 个 NFT
        </div>
        
        <div className={`grid gap-4 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {filteredAndSortedNFTs.map((nft) => (
            <NFTCard
              key={nft.tokenId}
              nft={nft}
              isSelected={selectedNFT?.tokenId === nft.tokenId}
              isEquipped={equippedSkinId === nft.tokenId}
              onSelect={setSelectedNFT}
              onEquip={handleEquipSkin}
              viewMode={viewMode}
            />
          ))}
        </div>
      </div>

      {/* NFT 详情预览 */}
      {selectedNFT && (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">👁️</span>
            NFT 详情
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <EnhancedContentPreview
                content={selectedNFT.content}
                templateName={selectedNFT.name}
                templateId={selectedNFT.templateId}
                size="lg"
                showLabel={true}
                enableFullView={true}
                className="w-full max-w-sm mx-auto"
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-bold text-white">{selectedNFT.name}</h4>
                <p className="text-white/70 text-sm mt-1">{selectedNFT.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Token ID:</span>
                  <div className="text-white font-medium">#{selectedNFT.tokenId}</div>
                </div>
                <div>
                  <span className="text-white/60">模板 ID:</span>
                  <div className="text-white font-medium">#{selectedNFT.templateId}</div>
                </div>
                <div>
                  <span className="text-white/60">稀有度:</span>
                  <div className="text-white font-medium">{selectedNFT.rarity}</div>
                </div>
                <div>
                  <span className="text-white/60">特效:</span>
                  <div className="text-white font-medium">{selectedNFT.effectType}</div>
                </div>
                <div>
                  <span className="text-white/60">序列号:</span>
                  <div className="text-white font-medium">#{selectedNFT.serialNumber}</div>
                </div>
                <div>
                  <span className="text-white/60">获得时间:</span>
                  <div className="text-white font-medium">
                    {new Date(selectedNFT.mintedAt * 1000).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>

              {equippedSkinId !== selectedNFT.tokenId && (
                <Button
                  onClick={() => handleEquipSkin(selectedNFT)}
                  variant="primary"
                  className="w-full"
                >
                  装备此皮肤
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
