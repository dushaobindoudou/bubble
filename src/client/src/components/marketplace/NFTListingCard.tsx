import React, { useState, useEffect } from 'react'
import { useAccount, useContractRead } from 'wagmi'
import { formatEther } from 'viem'
import { MarketplaceListing } from '../../hooks/useMarketplace'
import { EnhancedContentPreview } from '../ui/EnhancedContentPreview'
import { Button } from '../ui/Button'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { CONTRACT_ADDRESSES } from '../../config/contracts'
import BubbleSkinNFTABI from '../../contracts/abis/BubbleSkinNFT.json'

interface NFTListingCardProps {
  listing: MarketplaceListing
  onBuy: (listingId: number) => void
  onCancel?: (listingId: number) => void
  isBuying?: boolean
  isCancelling?: boolean
  showActions?: boolean
  size?: 'sm' | 'md' | 'lg'
}

interface NFTMetadata {
  templateId: number
  name: string
  description: string
  rarity: string
  effectType: string
  content: string
  serialNumber: number
  mintedAt: number
}

export const NFTListingCard: React.FC<NFTListingCardProps> = ({
  listing,
  onBuy,
  onCancel,
  isBuying = false,
  isCancelling = false,
  showActions = true,
  size = 'md'
}) => {
  const { address } = useAccount()
  const [nftMetadata, setNftMetadata] = useState<NFTMetadata | null>(null)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true)

  // 获取 NFT 元数据 - NFT元数据很少变化，缓存更久
  const { data: skinTemplateData } = useContractRead({
    address: CONTRACT_ADDRESSES.BubbleSkinNFT as `0x${string}`,
    abi: BubbleSkinNFTABI.abi,
    functionName: 'getSkinTemplate',
    args: [listing.tokenId],
    enabled: !!listing.tokenId,
    cacheTime: 300_000, // 缓存5分钟
    staleTime: 300_000,
  })

  useEffect(() => {
    if (skinTemplateData) {
      const [templateId, name, description, rarity, effectType, content, serialNumber, mintedAt] = skinTemplateData as [
        number, string, string, string, string, string, number, number
      ]
      
      setNftMetadata({
        templateId,
        name,
        description,
        rarity,
        effectType,
        content,
        serialNumber,
        mintedAt
      })
      setIsLoadingMetadata(false)
    }
  }, [skinTemplateData])

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

  const formatTimeRemaining = (expiresAt: number) => {
    const now = Math.floor(Date.now() / 1000)
    const remaining = expiresAt - now
    
    if (remaining <= 0) return '已过期'
    
    const days = Math.floor(remaining / (24 * 60 * 60))
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((remaining % (60 * 60)) / 60)
    
    if (days > 0) return `${days}天${hours}小时`
    if (hours > 0) return `${hours}小时${minutes}分钟`
    return `${minutes}分钟`
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const isExpired = Math.floor(Date.now() / 1000) > listing.expiresAt
  const isOwner = address?.toLowerCase() === listing.seller.toLowerCase()
  const canBuy = !isOwner && !isExpired && listing.status === 0
  const canCancel = isOwner && listing.status === 0

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }

  if (isLoadingMetadata) {
    return (
      <div className={`bg-white/10 backdrop-blur-xl rounded-3xl ${sizeClasses[size]} border border-white/20`}>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="sm" />
          <div className="ml-2 text-white/70 text-sm">加载中...</div>
        </div>
      </div>
    )
  }

  if (!nftMetadata) {
    return (
      <div className={`bg-white/10 backdrop-blur-xl rounded-3xl ${sizeClasses[size]} border border-white/20`}>
        <div className="text-center py-8">
          <div className="text-white/50 text-sm">无法加载 NFT 信息</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br ${getRarityColor(nftMetadata.rarity)} backdrop-blur-xl rounded-3xl ${sizeClasses[size]} border transition-all duration-300 hover:scale-[1.02] ${
      isExpired ? 'opacity-60' : ''
    }`}>
      {/* 状态标签 */}
      <div className="flex justify-between items-start mb-3">
        <div className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRarityColor(nftMetadata.rarity)}`}>
          {getRarityIcon(nftMetadata.rarity)} {getRarityText(nftMetadata.rarity)}
        </div>
        
        <div className="flex flex-col gap-1">
          {isExpired && (
            <div className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-medium border border-red-500/30">
              已过期
            </div>
          )}
          {listing.status === 1 && (
            <div className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium border border-green-500/30">
              已售出
            </div>
          )}
          {listing.status === 2 && (
            <div className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs font-medium border border-gray-500/30">
              已取消
            </div>
          )}
        </div>
      </div>

      {/* NFT 预览 */}
      <div className="mb-4">
        <EnhancedContentPreview
          content={nftMetadata.content}
          templateName={nftMetadata.name}
          templateId={nftMetadata.templateId}
          size={size}
          showLabel={false}
          enableFullView={true}
        />
      </div>

      {/* NFT 信息 */}
      <div className="space-y-3">
        <div>
          <h3 className="text-white font-semibold text-sm mb-1">{nftMetadata.name}</h3>
          <p className="text-white/70 text-xs line-clamp-2">{nftMetadata.description}</p>
        </div>

        {/* 价格信息 */}
        <div className="bg-black/20 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-xs">价格</span>
            <div className="text-right">
              <div className="text-white font-bold text-lg">{formatEther(listing.price)} BUB</div>
              <div className="text-white/60 text-xs">≈ ${(parseFloat(formatEther(listing.price)) * 0.1).toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* 详细信息 */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-white/60">Token ID:</span>
            <div className="text-white font-medium">#{listing.tokenId}</div>
          </div>
          <div>
            <span className="text-white/60">序列号:</span>
            <div className="text-white font-medium">#{nftMetadata.serialNumber}</div>
          </div>
          <div>
            <span className="text-white/60">卖家:</span>
            <div className="text-white font-medium">{formatAddress(listing.seller)}</div>
          </div>
          <div>
            <span className="text-white/60">剩余时间:</span>
            <div className={`font-medium ${isExpired ? 'text-red-400' : 'text-white'}`}>
              {formatTimeRemaining(listing.expiresAt)}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        {showActions && (
          <div className="pt-2 space-y-2">
            {canBuy && (
              <Button
                onClick={() => onBuy(listing.listingId)}
                variant="primary"
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                loading={isBuying}
              >
                💰 立即购买
              </Button>
            )}
            
            {canCancel && onCancel && (
              <Button
                onClick={() => onCancel(listing.listingId)}
                variant="secondary"
                className="w-full"
                loading={isCancelling}
              >
                ❌ 取消挂单
              </Button>
            )}
            
            {isOwner && !canCancel && (
              <div className="text-center p-2 bg-blue-500/20 rounded-xl border border-blue-400/30">
                <span className="text-blue-400 font-semibold text-sm">您的挂单</span>
              </div>
            )}
            
            {!canBuy && !canCancel && !isOwner && (
              <div className="text-center p-2 bg-gray-500/20 rounded-xl border border-gray-400/30">
                <span className="text-gray-400 font-semibold text-sm">
                  {isExpired ? '挂单已过期' : '不可购买'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
