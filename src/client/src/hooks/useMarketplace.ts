import { useState, useEffect, useCallback } from 'react'
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useNetwork } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'react-hot-toast'
import { CONTRACT_ADDRESSES, MONAD_TESTNET_CHAIN_ID } from '../config/contracts'
import MarketplaceABI from '../contracts/abis/Marketplace.json'
import BubbleTokenABI from '../contracts/abis/BubbleToken.json'

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
  createdAt: number | bigint
  expiresAt: number | bigint
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
  timestamp: number | bigint
}

export interface MarketplaceStats {
  totalListings: number | bigint
  totalSales: number | bigint
  totalVolume: bigint
  activeListings: number | bigint
}

export const useMarketplace = () => {
  const { address, isConnected } = useAccount()
  const { chain } = useNetwork()
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [userListings, setUserListings] = useState<MarketplaceListing[]>([])
  const [userPurchases, setUserPurchases] = useState<MarketplaceSale[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 网络检查
  const isCorrectNetwork = chain?.id === MONAD_TESTNET_CHAIN_ID

  // 获取活跃挂单 - 减少轮询频率
  const {
    data: activeListingsData,
    isLoading: isLoadingListings,
    refetch: refetchListings
  } = useContractRead({
    address: MARKETPLACE_ADDRESS,
    abi: MarketplaceABI.abi,
    functionName: 'getActiveListings',
    args: [0, 100], // offset, limit
    cacheTime: 30_000, // 缓存30秒
    staleTime: 15_000, // 15秒内认为数据是新鲜的
    onError: (error) => {
      setError('获取市场挂单失败: ' + error.message)
    }
  })

  // 获取用户挂单 - 减少轮询频率
  const {
    data: userListingsData,
    refetch: refetchUserListings
  } = useContractRead({
    address: MARKETPLACE_ADDRESS,
    abi: MarketplaceABI.abi,
    functionName: 'getUserListings',
    args: [address],
    enabled: !!address,
    cacheTime: 30_000,
    staleTime: 15_000,
    onError: () => {
      // Handle error silently or show user-friendly message
    }
  })

  // 获取用户购买历史 - 减少轮询频率
  const {
    data: userPurchasesData,
    refetch: refetchUserPurchases
  } = useContractRead({
    address: MARKETPLACE_ADDRESS,
    abi: MarketplaceABI.abi,
    functionName: 'getUserPurchases',
    args: [address],
    enabled: !!address,
    cacheTime: 60_000, // 购买历史缓存更久
    staleTime: 30_000,
  })

  // 获取市场统计 - 静态数据，缓存更久
  const {
    data: marketStatsData,
    isLoading: isLoadingMarketStats
  } = useContractRead({
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

  // 获取用户 BubbleToken 余额
  const { data: userTokenBalance } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BubbleTokenABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
    cacheTime: 30_000,
    staleTime: 15_000,
  })

  // 获取用户对 Marketplace 的授权额度
  const { data: allowance, refetch: refetchAllowance } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BubbleTokenABI,
    functionName: 'allowance',
    args: [address, MARKETPLACE_ADDRESS],
    enabled: !!address,
    cacheTime: 30_000,
    staleTime: 15_000,
  })

  // 合约写入状态 - 添加执行标志避免重复执行
  const [listNFTArgs, setListNFTArgs] = useState<readonly unknown[] | undefined>(undefined)
  const [buyNFTArgs, setBuyNFTArgs] = useState<readonly unknown[] | undefined>(undefined)
  const [cancelListingArgs, setCancelListingArgs] = useState<readonly unknown[] | undefined>(undefined)
  const [approveArgs, setApproveArgs] = useState<readonly unknown[] | undefined>(undefined)

  // 执行标志，防止重复执行
  const [hasExecutedBuyNFT, setHasExecutedBuyNFT] = useState(false)
  const [hasExecutedListNFT, setHasExecutedListNFT] = useState(false)
  const [hasExecutedCancelListing, setHasExecutedCancelListing] = useState(false)
  const [hasExecutedApprove, setHasExecutedApprove] = useState(false)

  // 购买流程状态
  const [pendingPurchase, setPendingPurchase] = useState<{listingId: number, price: bigint} | null>(null)



  // 上架 NFT
  const { config: listNFTConfig } = usePrepareContractWrite(
    listNFTArgs && listNFTArgs.length > 0 && !hasExecutedListNFT && isConnected && isCorrectNetwork ? {
      address: MARKETPLACE_ADDRESS,
      abi: MarketplaceABI.abi,
      functionName: 'listNFT',
      args: listNFTArgs,
    } : undefined
  )

  const { write: listNFTWrite, isLoading: isListing } = useContractWrite({
    ...(listNFTConfig || {}),
    onSuccess: () => {
      toast.success('NFT 上架成功！')
      // 重置状态
      setListNFTArgs(undefined)
      setHasExecutedListNFT(false)
      // 延迟刷新数据，等待区块确认
      setTimeout(() => {
        refetchListings()
        refetchUserListings()
      }, 2000)
    },
    onError: (error) => {
      toast.error('上架失败：' + (error.message || '未知错误'))
      // 重置状态
      setListNFTArgs(undefined)
      setHasExecutedListNFT(false)
    },
  })

  const { config: buyNFTConfig } = usePrepareContractWrite(
    buyNFTArgs && buyNFTArgs.length > 0 && !hasExecutedBuyNFT && isConnected && isCorrectNetwork ? {
      address: MARKETPLACE_ADDRESS,
      abi: MarketplaceABI.abi,
      functionName: 'buyNFT',
      args: buyNFTArgs,
    } : undefined
  )

  const { write: buyNFTWrite, isLoading: isBuying } = useContractWrite({
    ...(buyNFTConfig || {}),
    onSuccess: () => {
      toast.success('购买成功！')
      // 重置状态
      setBuyNFTArgs(undefined)
      setHasExecutedBuyNFT(false)
      setPendingPurchase(null)
      // 延迟刷新数据，等待区块确认
      setTimeout(() => {
        refetchListings()
        refetchUserPurchases()
      }, 2000)
    },
    onError: (error) => {
      toast.error('购买失败：' + (error.message || '未知错误'))
      // 重置状态
      setBuyNFTArgs(undefined)
      setHasExecutedBuyNFT(false)
      setPendingPurchase(null)
    },
  })

  // 取消挂单
  const { config: cancelListingConfig } = usePrepareContractWrite(
    cancelListingArgs && cancelListingArgs.length > 0 && !hasExecutedCancelListing && isConnected && isCorrectNetwork ? {
      address: MARKETPLACE_ADDRESS,
      abi: MarketplaceABI.abi,
      functionName: 'cancelListing',
      args: cancelListingArgs,
    } : undefined
  )

  // Approve BubbleToken
  const { config: approveConfig } = usePrepareContractWrite(
    approveArgs && approveArgs.length > 0 && !hasExecutedApprove && isConnected && isCorrectNetwork ? {
      address: BUBBLE_TOKEN_ADDRESS,
      abi: BubbleTokenABI,
      functionName: 'approve',
      args: approveArgs,
    } : undefined
  )

  const { write: cancelListingWrite, isLoading: isCancelling } = useContractWrite({
    ...(cancelListingConfig || {}),
    onSuccess: () => {
      toast.success('挂单已取消')
      // 重置状态
      setCancelListingArgs(undefined)
      setHasExecutedCancelListing(false)
      // 延迟刷新数据，等待区块确认
      setTimeout(() => {
        refetchListings()
        refetchUserListings()
      }, 2000)
    },
    onError: (error) => {
      toast.error('取消失败：' + (error.message || '未知错误'))
      // 重置状态
      setCancelListingArgs(undefined)
      setHasExecutedCancelListing(false)
    },
  })

  const { write: approveWrite, isLoading: isApproving } = useContractWrite({
    ...(approveConfig || {}),
    onSuccess: () => {
      toast.success('授权成功！')
      // 重置状态
      setApproveArgs(undefined)
      setHasExecutedApprove(false)
      // 刷新授权额度
      setTimeout(() => {
        refetchAllowance()
        // 如果有待处理的购买，继续执行
        if (pendingPurchase) {
          const args = [pendingPurchase.listingId] as const
          setBuyNFTArgs(args)
          setHasExecutedBuyNFT(false)
        }
      }, 2000)
    },
    onError: (error) => {
      toast.error('授权失败：' + (error.message || '未知错误'))
      // 重置状态
      setApproveArgs(undefined)
      setHasExecutedApprove(false)
      setPendingPurchase(null)
    },
  })

  // 计算总体加载状态
  const isLoadingData = isLoadingListings || isLoadingMarketStats

  // 更新 isLoading 状态
  useEffect(() => {
    setIsLoading(isLoadingData)
  }, [isLoadingData])

  // 处理数据更新
  useEffect(() => {
    if (activeListingsData) {
      setListings(activeListingsData as MarketplaceListing[])
      setError(null) // 清除错误状态
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

  // 自动执行合约写入
  useEffect(() => {
    if (buyNFTArgs && buyNFTArgs.length > 0 && buyNFTWrite && buyNFTConfig && !hasExecutedBuyNFT) {
      setHasExecutedBuyNFT(true)
      buyNFTWrite()
    }
  }, [buyNFTArgs, buyNFTWrite, buyNFTConfig, hasExecutedBuyNFT])

  useEffect(() => {
    if (listNFTArgs && listNFTArgs.length > 0 && listNFTWrite && listNFTConfig && !hasExecutedListNFT) {
      setHasExecutedListNFT(true)
      listNFTWrite()
    }
  }, [listNFTArgs, listNFTWrite, listNFTConfig, hasExecutedListNFT])

  useEffect(() => {
    if (cancelListingArgs && cancelListingArgs.length > 0 && cancelListingWrite && cancelListingConfig && !hasExecutedCancelListing) {
      setHasExecutedCancelListing(true)
      cancelListingWrite()
    }
  }, [cancelListingArgs, cancelListingWrite, cancelListingConfig, hasExecutedCancelListing])

  useEffect(() => {
    if (approveArgs && approveArgs.length > 0 && approveWrite && approveConfig && !hasExecutedApprove) {
      setHasExecutedApprove(true)
      approveWrite()
    }
  }, [approveArgs, approveWrite, approveConfig, hasExecutedApprove])



  // 上架 NFT 函数
  const listNFT = useCallback(async (
    tokenId: number,
    price: string,
    duration: number = 7 * 24 * 60 * 60 // 默认7天
  ) => {
    try {
      // 参数验证
      if (!tokenId || tokenId <= 0) {
        toast.error('无效的 Token ID')
        return
      }

      if (!price || parseFloat(price) <= 0) {
        toast.error('价格必须大于 0')
        return
      }

      if (isListing) {
        toast.error('正在处理中，请稍候...')
        return
      }

      // 重置执行标志和参数
      setHasExecutedListNFT(false)
      setListNFTArgs(undefined)

      // 短暂延迟后设置新参数
      setTimeout(() => {
        const priceInWei = parseEther(price)
        const args = [
          BUBBLE_SKIN_NFT_ADDRESS,
          tokenId,
          BUBBLE_TOKEN_ADDRESS,
          priceInWei,
          duration
        ] as const


        setListNFTArgs(args)
      }, 100)
    } catch (error) {
      toast.error('上架失败：' + (error instanceof Error ? error.message : '未知错误'))
      setListNFTArgs(undefined)
      setHasExecutedListNFT(false)
    }
  }, [isListing])

  // 购买 NFT 函数
  const buyNFT = useCallback(async (listingId: number) => {
    try {
      // 参数验证
      if (!listingId || listingId <= 0) {
        toast.error('无效的挂单 ID')
        return
      }

      // 检查钱包连接状态
      if (!isConnected) {
        toast.error('请先连接钱包')
        return
      }

      // 检查网络状态
      if (!isCorrectNetwork) {
        toast.error(`请切换到 Monad Testnet (Chain ID: ${MONAD_TESTNET_CHAIN_ID})`)
        return
      }

      // 检查是否正在执行中
      if (isBuying || isApproving) {
        toast.error('正在处理中，请稍候...')
        return
      }

      // 查找对应的挂单
      const listing = listings.find(l => l.listingId === listingId)
      if (!listing) {
        toast.error('挂单不存在')
        return
      }

      const requiredAmount = listing.price as bigint

      // 检查用户余额
      if (!userTokenBalance || (userTokenBalance as bigint) < requiredAmount) {
        toast.error('余额不足')
        return
      }

      // 检查授权额度
      const currentAllowance = allowance as bigint || BigInt(0)

      if (currentAllowance < requiredAmount) {
        toast.loading('需要先授权代币...')

        // 设置待处理的购买
        setPendingPurchase({ listingId, price: requiredAmount })

        // 授权足够的金额（价格 + 一些余量）
        const approveAmount = requiredAmount * BigInt(2) // 授权2倍金额以避免频繁授权
        const approveArgs = [MARKETPLACE_ADDRESS, approveAmount] as const

        setApproveArgs(approveArgs)
        setHasExecutedApprove(false)
        return
      }

      // 如果授权足够，直接购买
      setHasExecutedBuyNFT(false)
      const args = [listingId] as const
      setBuyNFTArgs(args)

    } catch (error) {
      toast.error('购买失败：' + (error instanceof Error ? error.message : '未知错误'))
      setBuyNFTArgs(undefined)
      setHasExecutedBuyNFT(false)
      setPendingPurchase(null)
    }
  }, [isBuying, isApproving, buyNFTArgs, hasExecutedBuyNFT, buyNFTWrite, buyNFTConfig, userTokenBalance, allowance, listings, isConnected, isCorrectNetwork, chain?.id])

  // 取消挂单函数
  const cancelListing = useCallback(async (listingId: number) => {
    try {
      // 参数验证
      if (!listingId || listingId <= 0) {
        toast.error('无效的挂单 ID')
        return
      }

      if (isCancelling) {
        toast.error('正在处理中，请稍候...')
        return
      }

      // 重置执行标志和参数
      setHasExecutedCancelListing(false)
      setCancelListingArgs(undefined)

      // 短暂延迟后设置新参数
      setTimeout(() => {
        const args = [listingId] as const

        setCancelListingArgs(args)
      }, 100)
    } catch (error) {
      toast.error('取消失败：' + (error instanceof Error ? error.message : '未知错误'))
      setCancelListingArgs(undefined)
      setHasExecutedCancelListing(false)
    }
  }, [isCancelling])

  // 计算手续费
  const calculateFee = useCallback((price: bigint): bigint => {
    if (!feePercentage || feePercentage === 0) return BigInt(0)
    try {
      const feePercent = typeof feePercentage === 'bigint' ? feePercentage : BigInt(Number(feePercentage))
      return (price * feePercent) / BigInt(10000)
    } catch (error) {
      return BigInt(0)
    }
  }, [feePercentage])

  // 格式化价格
  const formatPrice = useCallback((price: bigint): string => {
    return formatEther(price)
  }, [])

  // 验证挂单状态
  const validateListing = useCallback((listing: MarketplaceListing): { isValid: boolean; reason?: string } => {
    if (listing.status !== 0) {
      return { isValid: false, reason: '挂单已失效' }
    }

    const now = Math.floor(Date.now() / 1000)
    const expiresAt = typeof listing.expiresAt === 'bigint' ? Number(listing.expiresAt) : listing.expiresAt

    if (now > expiresAt) {
      return { isValid: false, reason: '挂单已过期' }
    }

    return { isValid: true }
  }, [])

  // 估算 Gas 费用（简化版本）
  const estimateGasFee = useCallback(async (functionName: string): Promise<string> => {
    try {
      // 这里可以添加实际的 Gas 估算逻辑
      // 暂时返回固定值作为示例
      switch (functionName) {
        case 'listNFT':
          return '0.001' // 估算值
        case 'buyNFT':
          return '0.002' // 估算值
        case 'cancelListing':
          return '0.001' // 估算值
        default:
          return '0.001'
      }
    } catch (error) {
      return '0.001' // 默认值
    }
  }, [])

  // 检查用户余额是否足够
  const checkSufficientBalance = useCallback(async (_requiredAmount: bigint): Promise<boolean> => {
    try {
      // 这里应该检查用户的 BUB 代币余额
      // 暂时返回 true，实际应用中需要调用代币合约
      return true
    } catch (error) {
      return false
    }
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
    isApproving,
    error,

    // 代币相关
    userTokenBalance: userTokenBalance ? formatEther(userTokenBalance as bigint) : '0',
    allowance: allowance ? formatEther(allowance as bigint) : '0',

    // 主要功能函数
    listNFT,
    buyNFT,
    cancelListing,
    refreshData,

    // 辅助函数
    calculateFee,
    formatPrice,
    validateListing,
    estimateGasFee,
    checkSufficientBalance,

    // 合约地址
    MARKETPLACE_ADDRESS,
    BUBBLE_TOKEN_ADDRESS,
    BUBBLE_SKIN_NFT_ADDRESS
  }
}
