/**
 * 优化的合约读取 Hook
 * 减少对 RPC 的频繁请求
 */

import { useEffect, useState, useCallback } from 'react'
import { useContractRead } from 'wagmi'
import { 
  createCacheKey, 
  getCachedData, 
  setCachedData,
  RPC_OPTIMIZATION_CONFIG 
} from '../utils/rpcOptimization'

interface UseOptimizedContractReadConfig {
  address: `0x${string}`
  abi: any
  functionName: string
  args?: any[]
  enabled?: boolean
  cacheTime?: number
  staleTime?: number
  refetchInterval?: number
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}

interface UseOptimizedContractReadResult<T> {
  data: T | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * 优化的合约读取 Hook
 */
export function useOptimizedContractRead<T = any>({
  address,
  abi,
  functionName,
  args = [],
  enabled = true,
  cacheTime = RPC_OPTIMIZATION_CONFIG.CACHE_TIMES.USER_DATA,
  staleTime = RPC_OPTIMIZATION_CONFIG.CACHE_TIMES.USER_DATA / 2,
  refetchInterval,
  onSuccess,
  onError,
}: UseOptimizedContractReadConfig): UseOptimizedContractReadResult<T> {
  
  const [cachedData, setCachedDataState] = useState<T | undefined>(undefined)
  const [isLoadingState, setIsLoadingState] = useState(false)
  const [errorState, setErrorState] = useState<Error | null>(null)
  
  // 创建缓存键
  const cacheKey = createCacheKey(address, functionName, args)
  
  // 使用 wagmi 的 useContractRead，但禁用自动轮询
  const {
    data: contractData,
    isLoading: contractIsLoading,
    error: contractError,
    refetch: contractRefetch
  } = useContractRead({
    address,
    abi,
    functionName,
    args,
    enabled: false, // 禁用自动请求，手动控制
    cacheTime,
    staleTime,
  })

  // 检查缓存并决定是否需要请求
  const checkCacheAndFetch = useCallback(async () => {
    if (!enabled) return

    // 先检查缓存
    const cached = getCachedData<T>(cacheKey)
    if (cached) {
      setCachedDataState(cached)
      onSuccess?.(cached)
      return
    }

    // 缓存未命中，发起请求
    setIsLoadingState(true)
    setErrorState(null)
    
    try {
      const result = await contractRefetch()
      if (result.data) {
        setCachedData(cacheKey, result.data, cacheTime)
        setCachedDataState(result.data)
        onSuccess?.(result.data)
      }
    } catch (error) {
      const err = error as Error
      setErrorState(err)
      onError?.(err)
    } finally {
      setIsLoadingState(false)
    }
  }, [
    enabled,
    cacheKey,
    cacheTime,
    contractRefetch,
    onSuccess,
    onError
  ])

  // 手动刷新函数
  const refetch = useCallback(async () => {
    await checkCacheAndFetch()
  }, [checkCacheAndFetch])

  // 初始加载
  useEffect(() => {
    checkCacheAndFetch()
  }, [checkCacheAndFetch])

  // 定时刷新（如果设置了 refetchInterval）
  useEffect(() => {
    if (!refetchInterval || !enabled) return

    const interval = setInterval(() => {
      checkCacheAndFetch()
    }, refetchInterval)

    return () => clearInterval(interval)
  }, [refetchInterval, enabled, checkCacheAndFetch])

  // 监听合约数据变化
  useEffect(() => {
    if (contractData && !contractIsLoading && !contractError) {
      setCachedData(cacheKey, contractData, cacheTime)
      setCachedDataState(contractData)
      onSuccess?.(contractData)
    }
  }, [contractData, contractIsLoading, contractError, cacheKey, cacheTime, onSuccess])

  // 监听合约错误
  useEffect(() => {
    if (contractError) {
      setErrorState(contractError)
      onError?.(contractError)
    }
  }, [contractError, onError])

  return {
    data: cachedData,
    isLoading: isLoadingState || contractIsLoading,
    error: errorState || contractError,
    refetch,
  }
}

/**
 * 预设的优化配置
 */
export const OPTIMIZED_CONTRACT_CONFIGS = {
  // 静态数据配置
  STATIC_DATA: {
    cacheTime: RPC_OPTIMIZATION_CONFIG.CACHE_TIMES.STATIC,
    staleTime: RPC_OPTIMIZATION_CONFIG.CACHE_TIMES.STATIC,
    refetchInterval: undefined, // 不自动刷新
  },
  
  // 用户权限配置
  USER_PERMISSIONS: {
    cacheTime: RPC_OPTIMIZATION_CONFIG.CACHE_TIMES.PERMISSIONS,
    staleTime: RPC_OPTIMIZATION_CONFIG.CACHE_TIMES.PERMISSIONS,
    refetchInterval: undefined,
  },
  
  // NFT 元数据配置
  NFT_METADATA: {
    cacheTime: RPC_OPTIMIZATION_CONFIG.CACHE_TIMES.NFT_METADATA,
    staleTime: RPC_OPTIMIZATION_CONFIG.CACHE_TIMES.NFT_METADATA,
    refetchInterval: undefined,
  },
  
  // 市场数据配置
  MARKET_DATA: {
    cacheTime: RPC_OPTIMIZATION_CONFIG.CACHE_TIMES.MARKET_DATA,
    staleTime: RPC_OPTIMIZATION_CONFIG.CACHE_TIMES.MARKET_DATA,
    refetchInterval: 60_000, // 每分钟刷新一次
  },
  
  // 用户数据配置
  USER_DATA: {
    cacheTime: RPC_OPTIMIZATION_CONFIG.CACHE_TIMES.USER_DATA,
    staleTime: RPC_OPTIMIZATION_CONFIG.CACHE_TIMES.USER_DATA,
    refetchInterval: 30_000, // 每30秒刷新一次
  },
  
  // 授权状态配置
  APPROVAL_STATUS: {
    cacheTime: RPC_OPTIMIZATION_CONFIG.CACHE_TIMES.APPROVAL_STATUS,
    staleTime: RPC_OPTIMIZATION_CONFIG.CACHE_TIMES.APPROVAL_STATUS,
    refetchInterval: undefined, // 手动刷新
  },
}

/**
 * 批量合约读取 Hook
 */
export function useBatchContractRead<T = any>(
  configs: UseOptimizedContractReadConfig[]
): UseOptimizedContractReadResult<T[]> {
  const [batchData, setBatchData] = useState<T[]>([])
  const [batchIsLoading, setBatchIsLoading] = useState(false)
  const [batchError, setBatchError] = useState<Error | null>(null)

  const results = configs.map(config => 
    useOptimizedContractRead<T>(config)
  )

  const refetchAll = useCallback(async () => {
    setBatchIsLoading(true)
    try {
      await Promise.all(results.map(result => result.refetch()))
    } catch (error) {
      setBatchError(error as Error)
    } finally {
      setBatchIsLoading(false)
    }
  }, [results])

  useEffect(() => {
    const data = results.map(result => result.data).filter(Boolean) as T[]
    const isLoading = results.some(result => result.isLoading)
    const error = results.find(result => result.error)?.error || null

    setBatchData(data)
    setBatchIsLoading(isLoading)
    setBatchError(error)
  }, [results])

  return {
    data: batchData,
    isLoading: batchIsLoading,
    error: batchError,
    refetch: refetchAll,
  }
}
