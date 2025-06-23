/**
 * RPC 请求监控组件
 * 用于调试和监控 RPC 请求频率
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/Button'

interface RPCRequest {
  id: string
  timestamp: number
  url: string
  method: string
  params?: any
  duration?: number
  status: 'pending' | 'success' | 'error'
  error?: string
}

interface RPCStats {
  totalRequests: number
  successRequests: number
  errorRequests: number
  averageResponseTime: number
  requestsPerMinute: number
  lastMinuteRequests: number
}

export const RPCMonitor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [requests, setRequests] = useState<RPCRequest[]>([])
  const [stats, setStats] = useState<RPCStats>({
    totalRequests: 0,
    successRequests: 0,
    errorRequests: 0,
    averageResponseTime: 0,
    requestsPerMinute: 0,
    lastMinuteRequests: 0,
  })

  // 拦截 fetch 请求
  useEffect(() => {
    const originalFetch = window.fetch
    
    window.fetch = async (...args) => {
      const [url, options] = args
      const requestId = Math.random().toString(36).substr(2, 9)
      const startTime = Date.now()
      
      // 检查是否是 RPC 请求
      const isRPCRequest = typeof url === 'string' && 
        (url.includes('testnet-rpc.monad.xyz') || url.includes('rpc'))
      
      if (isRPCRequest) {
        const newRequest: RPCRequest = {
          id: requestId,
          timestamp: startTime,
          url: typeof url === 'string' ? url : url.toString(),
          method: options?.method || 'GET',
          params: options?.body ? JSON.parse(options.body as string) : undefined,
          status: 'pending',
        }
        
        setRequests(prev => [newRequest, ...prev.slice(0, 99)]) // 保留最近100个请求
      }
      
      try {
        const response = await originalFetch(...args)
        const endTime = Date.now()
        const duration = endTime - startTime
        
        if (isRPCRequest) {
          setRequests(prev => prev.map(req => 
            req.id === requestId 
              ? { ...req, status: 'success' as const, duration }
              : req
          ))
        }
        
        return response
      } catch (error) {
        const endTime = Date.now()
        const duration = endTime - startTime
        
        if (isRPCRequest) {
          setRequests(prev => prev.map(req => 
            req.id === requestId 
              ? { 
                  ...req, 
                  status: 'error' as const, 
                  duration, 
                  error: error instanceof Error ? error.message : 'Unknown error'
                }
              : req
          ))
        }
        
        throw error
      }
    }
    
    return () => {
      window.fetch = originalFetch
    }
  }, [])

  // 计算统计信息
  useEffect(() => {
    const now = Date.now()
    const oneMinuteAgo = now - 60_000
    
    const recentRequests = requests.filter(req => req.timestamp > oneMinuteAgo)
    const completedRequests = requests.filter(req => req.status !== 'pending')
    const successRequests = requests.filter(req => req.status === 'success')
    const errorRequests = requests.filter(req => req.status === 'error')
    
    const totalDuration = completedRequests.reduce((sum, req) => sum + (req.duration || 0), 0)
    const averageResponseTime = completedRequests.length > 0 
      ? totalDuration / completedRequests.length 
      : 0
    
    setStats({
      totalRequests: requests.length,
      successRequests: successRequests.length,
      errorRequests: errorRequests.length,
      averageResponseTime,
      requestsPerMinute: recentRequests.length,
      lastMinuteRequests: recentRequests.length,
    })
  }, [requests])

  const clearRequests = useCallback(() => {
    setRequests([])
  }, [])

  const getStatusColor = (status: RPCRequest['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-400'
      case 'success': return 'text-green-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: RPCRequest['status']) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'success': return '✅'
      case 'error': return '❌'
      default: return '❓'
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="secondary"
          size="sm"
          className="bg-black/50 backdrop-blur-sm border border-white/20"
        >
          📊 RPC Monitor
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-black/90 backdrop-blur-xl rounded-xl border border-white/20 z-50 overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <h3 className="text-white font-semibold text-sm">📊 RPC Monitor</h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={clearRequests}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            清除
          </Button>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            ✕
          </Button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="p-3 border-b border-white/10">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center">
            <div className="text-white font-bold">{stats.totalRequests}</div>
            <div className="text-white/60">总请求</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-bold">{stats.lastMinuteRequests}</div>
            <div className="text-white/60">最近1分钟</div>
          </div>
          <div className="text-center">
            <div className="text-blue-400 font-bold">{stats.averageResponseTime.toFixed(0)}ms</div>
            <div className="text-white/60">平均响应</div>
          </div>
          <div className="text-center">
            <div className="text-red-400 font-bold">{stats.errorRequests}</div>
            <div className="text-white/60">错误请求</div>
          </div>
        </div>
        
        {stats.lastMinuteRequests > 20 && (
          <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300">
            ⚠️ 请求频率过高！最近1分钟有 {stats.lastMinuteRequests} 个请求
          </div>
        )}
      </div>

      {/* 请求列表 */}
      <div className="max-h-48 overflow-y-auto">
        {requests.length === 0 ? (
          <div className="p-4 text-center text-white/50 text-sm">
            暂无 RPC 请求
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {requests.slice(0, 20).map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-2 bg-white/5 rounded text-xs"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={getStatusColor(request.status)}>
                    {getStatusIcon(request.status)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white truncate">
                      {request.params?.method || request.method}
                    </div>
                    <div className="text-white/50 text-xs">
                      {new Date(request.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="text-white/60 text-xs">
                  {request.duration ? `${request.duration}ms` : '-'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
