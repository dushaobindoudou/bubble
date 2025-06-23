import { useState, useEffect, useCallback } from 'react'
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'react-hot-toast'
import { CONTRACT_ADDRESSES } from '../config/contracts'
import MarketplaceABI from '../contracts/abis/Marketplace.json'

const MARKETPLACE_ADDRESS = CONTRACT_ADDRESSES.Marketplace as `0x${string}`
const BUBBLE_TOKEN_ADDRESS = CONTRACT_ADDRESSES.BubbleToken as `0x${string}`
const BUBBLE_SKIN_NFT_ADDRESS = CONTRACT_ADDRESSES.BubbleSkinNFT as `0x${string}`

export interface MarketplaceListing {
  listingId: number
  seller: string
  nftContract: string
  tokenId: number
  paymentToken: string
  price: bigint
  createdAt: number
  expiresAt: number
  status: number // 0: ACTIVE, 1: SOLD, 2: CANCELLED
}

export interface MarketplaceSale {
  saleId: number
  listingId: number
  seller: string
  buyer: string
  nftContract: string
  tokenId: number
  paymentToken: string
  price: bigint
  fee: bigint
  timestamp: number
}

export interface MarketplaceStats {
  totalListings: number
  totalSales: number
  totalVolume: bigint
  activeListings: number
}

export const useMarketplace = () => {
  const { address } = useAccount()
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [userListings, setUserListings] = useState<MarketplaceListing[]>([])
  const [userPurchases, setUserPurchases] = useState<MarketplaceSale[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取活跃挂单 - 减少轮询频率
  const { data: activeListingsData, refetch: refetchListings } = useContractRead({
    address: MARKETPLACE_ADDRESS,
    abi: MarketplaceABI.abi,
    functionName: 'getActiveListings',
    args: [0, 100], // offset, limit
    cacheTime: 30_000, // 缓存30秒
    staleTime: 15_000, // 15秒内认为数据是新鲜的
  })

  // 获取用户挂单 - 减少轮询频率
  const { data: userListingsData, refetch: refetchUserListings } = useContractRead({
    address: MARKETPLACE_ADDRESS,
    abi: MarketplaceABI.abi,
    functionName: 'getUserListings',
    args: [address],
    enabled: !!address,
    cacheTime: 30_000,
    staleTime: 15_000,
  })

  // 获取用户购买历史 - 减少轮询频率
  const { data: userPurchasesData, refetch: refetchUserPurchases } = useContractRead({
    address: MARKETPLACE_ADDRESS,
    abi: MarketplaceABI.abi,
    functionName: 'getUserPurchases',
    args: [address],
    enabled: !!address,
    cacheTime: 60_000, // 购买历史缓存更久
    staleTime: 30_000,
  })

  // 获取市场统计 - 静态数据，缓存更久
  const { data: marketStatsData } = useContractRead({
    address: MARKETPLACE_ADDRESS,
    abi: MarketplaceABI.abi,
    functionName: 'getMarketStats',
    cacheTime: 60_000,
    staleTime: 30_000,
  })

  // 获取手续费比例 - 静态数据，缓存很久
  const { data: feePercentage } = useContractRead({
    address: MARKETPLACE_ADDRESS,
    abi: MarketplaceABI.abi,
    functionName: 'feePercentage',
    cacheTime: 300_000, // 缓存5分钟
    staleTime: 300_000,
  })

  // 上架 NFT
  const { config: listNFTConfig } = usePrepareContractWrite({
    address: MARKETPLACE_ADDRESS,
    abi: MarketplaceABI.abi,
    functionName: 'listNFT',
  })

  const { write: listNFTWrite, isLoading: isListing } = useContractWrite({
    ...listNFTConfig,
    onSuccess: () => {
      toast.success('NFT 上架成功！')
      refetchListings()
      refetchUserListings()
    },
    onError: (error) => {
      console.error('List NFT error:', error)
      toast.error('上架失败：' + error.message)
    },
  })

  // 购买 NFT
  const { config: buyNFTConfig } = usePrepareContractWrite({
    address: MARKETPLACE_ADDRESS,
    abi: MarketplaceABI.abi,
    functionName: 'buyNFT',
  })

  const { write: buyNFTWrite, isLoading: isBuying } = useContractWrite({
    ...buyNFTConfig,
    onSuccess: () => {
      toast.success('购买成功！')
      refetchListings()
      refetchUserPurchases()
    },
    onError: (error) => {
      console.error('Buy NFT error:', error)
      toast.error('购买失败：' + error.message)
    },
  })

  // 取消挂单
  const { config: cancelListingConfig } = usePrepareContractWrite({
    address: MARKETPLACE_ADDRESS,
    abi: MarketplaceABI.abi,
    functionName: 'cancelListing',
  })

  const { write: cancelListingWrite, isLoading: isCancelling } = useContractWrite({
    ...cancelListingConfig,
    onSuccess: () => {
      toast.success('挂单已取消')
      refetchListings()
      refetchUserListings()
    },
    onError: (error) => {
      console.error('Cancel listing error:', error)
      toast.error('取消失败：' + error.message)
    },
  })

  // 处理数据更新
  useEffect(() => {
    if (activeListingsData) {
      setListings(activeListingsData as MarketplaceListing[])
    }
  }, [activeListingsData])

  useEffect(() => {
    if (userListingsData) {
      setUserListings(userListingsData as MarketplaceListing[])
    }
  }, [userListingsData])

  useEffect(() => {
    if (userPurchasesData) {
      setUserPurchases(userPurchasesData as MarketplaceSale[])
    }
  }, [userPurchasesData])

  // 上架 NFT 函数
  const listNFT = useCallback(async (
    tokenId: number,
    price: string,
    duration: number = 7 * 24 * 60 * 60 // 默认7天
  ) => {
    if (!listNFTWrite) {
      toast.error('合约未准备就绪')
      return
    }

    try {
      const priceInWei = parseEther(price)
      listNFTWrite({
        args: [
          BUBBLE_SKIN_NFT_ADDRESS,
          tokenId,
          BUBBLE_TOKEN_ADDRESS,
          priceInWei,
          duration
        ]
      })
    } catch (error) {
      console.error('List NFT error:', error)
      toast.error('上架失败')
    }
  }, [listNFTWrite])

  // 购买 NFT 函数
  const buyNFT = useCallback(async (listingId: number) => {
    if (!buyNFTWrite) {
      toast.error('合约未准备就绪')
      return
    }

    try {
      buyNFTWrite({
        args: [listingId]
      })
    } catch (error) {
      console.error('Buy NFT error:', error)
      toast.error('购买失败')
    }
  }, [buyNFTWrite])

  // 取消挂单函数
  const cancelListing = useCallback(async (listingId: number) => {
    if (!cancelListingWrite) {
      toast.error('合约未准备就绪')
      return
    }

    try {
      cancelListingWrite({
        args: [listingId]
      })
    } catch (error) {
      console.error('Cancel listing error:', error)
      toast.error('取消失败')
    }
  }, [cancelListingWrite])

  // 计算手续费
  const calculateFee = useCallback((price: bigint): bigint => {
    if (!feePercentage) return BigInt(0)
    return (price * BigInt(feePercentage)) / BigInt(10000)
  }, [feePercentage])

  // 格式化价格
  const formatPrice = useCallback((price: bigint): string => {
    return formatEther(price)
  }, [])

  // 获取市场统计
  const getMarketStats = useCallback((): MarketplaceStats | null => {
    if (!marketStatsData) return null
    
    const [totalListings, totalSales, totalVolume, activeListings] = marketStatsData as [number, number, bigint, number]
    
    return {
      totalListings,
      totalSales,
      totalVolume,
      activeListings
    }
  }, [marketStatsData])

  // 刷新数据
  const refreshData = useCallback(async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        refetchListings(),
        refetchUserListings(),
        refetchUserPurchases()
      ])
    } catch (error) {
      console.error('Refresh data error:', error)
      setError('刷新数据失败')
    } finally {
      setIsLoading(false)
    }
  }, [refetchListings, refetchUserListings, refetchUserPurchases])

  return {
    // 数据
    listings,
    userListings,
    userPurchases,
    marketStats: getMarketStats(),
    feePercentage: feePercentage ? Number(feePercentage) : 250,
    
    // 状态
    isLoading,
    isListing,
    isBuying,
    isCancelling,
    error,
    
    // 函数
    listNFT,
    buyNFT,
    cancelListing,
    calculateFee,
    formatPrice,
    refreshData,
    
    // 合约地址
    MARKETPLACE_ADDRESS,
    BUBBLE_TOKEN_ADDRESS,
    BUBBLE_SKIN_NFT_ADDRESS
  }
}
