/**
 * RPC 请求优化工具
 * 用于减少对 Monad 测试网的频繁请求
 */

import { useCallback, useRef } from 'react'

// 请求缓存接口
interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

// 全局请求缓存
const requestCache = new Map<string, CacheEntry<any>>()

/**
 * 创建缓存键
 */
export const createCacheKey = (
  contractAddress: string,
  functionName: string,
  args: any[]
): string => {
  return `${contractAddress}-${functionName}-${JSON.stringify(args)}`
}

/**
 * 获取缓存数据
 */
export const getCachedData = <T>(key: string): T | null => {
  const entry = requestCache.get(key)
  if (!entry) return null
  
  const now = Date.now()
  if (now > entry.expiry) {
    requestCache.delete(key)
    return null
  }
  
  return entry.data
}

/**
 * 设置缓存数据
 */
export const setCachedData = <T>(
  key: string,
  data: T,
  ttl: number = 30000 // 默认30秒
): void => {
  const now = Date.now()
  requestCache.set(key, {
    data,
    timestamp: now,
    expiry: now + ttl
  })
}

/**
 * 清除过期缓存
 */
export const clearExpiredCache = (): void => {
  const now = Date.now()
  for (const [key, entry] of requestCache.entries()) {
    if (now > entry.expiry) {
      requestCache.delete(key)
    }
  }
}

/**
 * 清除所有缓存
 */
export const clearAllCache = (): void => {
  requestCache.clear()
}

/**
 * 防抖 Hook
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    }) as T,
    [callback, delay]
  )
}

/**
 * 节流 Hook
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCallRef = useRef<number>(0)

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now
        return callback(...args)
      }
    }) as T,
    [callback, delay]
  )
}

/**
 * 批量请求管理器
 */
class BatchRequestManager {
  private batches = new Map<string, {
    requests: Array<{
      resolve: (value: any) => void
      reject: (error: any) => void
      args: any[]
    }>
    timeout: NodeJS.Timeout
  }>()

  /**
   * 添加请求到批次
   */
  addRequest<T>(
    key: string,
    args: any[],
    executor: (batchArgs: any[][]) => Promise<T[]>,
    delay: number = 100
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batches.has(key)) {
        this.batches.set(key, {
          requests: [],
          timeout: setTimeout(() => {
            this.executeBatch(key, executor)
          }, delay)
        })
      }

      const batch = this.batches.get(key)!
      batch.requests.push({ resolve, reject, args })
    })
  }

  /**
   * 执行批次请求
   */
  private async executeBatch<T>(
    key: string,
    executor: (batchArgs: any[][]) => Promise<T[]>
  ): Promise<void> {
    const batch = this.batches.get(key)
    if (!batch) return

    this.batches.delete(key)
    clearTimeout(batch.timeout)

    try {
      const batchArgs = batch.requests.map(req => req.args)
      const results = await executor(batchArgs)
      
      batch.requests.forEach((req, index) => {
        req.resolve(results[index])
      })
    } catch (error) {
      batch.requests.forEach(req => {
        req.reject(error)
      })
    }
  }
}

export const batchRequestManager = new BatchRequestManager()

/**
 * RPC 请求优化配置
 */
export const RPC_OPTIMIZATION_CONFIG = {
  // 缓存时间配置（毫秒）
  CACHE_TIMES: {
    // 静态数据 - 很少变化
    STATIC: 300_000, // 5分钟
    // 用户权限 - 较少变化
    PERMISSIONS: 600_000, // 10分钟
    // NFT 元数据 - 较少变化
    NFT_METADATA: 300_000, // 5分钟
    // 市场数据 - 中等频率变化
    MARKET_DATA: 60_000, // 1分钟
    // 用户数据 - 较频繁变化
    USER_DATA: 30_000, // 30秒
    // 授权状态 - 中等频率变化
    APPROVAL_STATUS: 60_000, // 1分钟
  },
  
  // 防抖延迟配置（毫秒）
  DEBOUNCE_DELAYS: {
    SEARCH: 300,
    FILTER: 200,
    REFRESH: 1000,
  },
  
  // 节流延迟配置（毫秒）
  THROTTLE_DELAYS: {
    SCROLL: 100,
    RESIZE: 250,
    CLICK: 500,
  },
  
  // 批量请求延迟（毫秒）
  BATCH_DELAY: 100,
}

/**
 * 清理过期缓存的定时器
 */
setInterval(clearExpiredCache, 60_000) // 每分钟清理一次过期缓存
