import React from 'react'
import { useNetworkManager } from '../hooks/useNetworkManager'
import { useWalletManager } from '../hooks/useWalletManager'
import { Button } from './ui/Button'
import { LoadingSpinner } from './ui/LoadingSpinner'

interface NetworkStatusProps {
  className?: string
  showDetails?: boolean
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const networkManager = useNetworkManager()
  const walletManager = useWalletManager()

  if (!walletManager.isConnected) {
    return null
  }

  const { networkStatus } = networkManager

  return (
    <div className={`network-status ${className}`}>
      {/* Network Status Indicator */}
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        networkStatus.status === 'correct' 
          ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
          : networkStatus.status === 'wrong'
          ? 'bg-red-500/20 text-red-100 border border-red-400/30'
          : 'bg-gray-500/20 text-gray-100 border border-gray-400/30'
      }`}>
        <span className="text-base">{networkStatus.icon}</span>
        <span>{networkStatus.message}</span>
        
        {networkManager.isLoading && (
          <LoadingSpinner size="sm" />
        )}
      </div>

      {/* Network Switch Button */}
      {!networkManager.isCorrectNetwork && networkManager.canSwitchNetwork && (
        <div className="mt-2">
          <Button
            onClick={networkManager.switchToMonad}
            disabled={networkManager.isLoading}
            variant="primary"
            size="sm"
            className="w-full"
          >
            {networkManager.isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">切换中...</span>
              </>
            ) : (
              <>
                <span className="mr-2">🔄</span>
                切换到 Monad 测试网
              </>
            )}
          </Button>
        </div>
      )}

      {/* Add Network Button */}
      {!networkManager.isCorrectNetwork && !networkManager.canSwitchNetwork && (
        <div className="mt-2">
          <Button
            onClick={networkManager.addMonadNetwork}
            disabled={networkManager.isLoading}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            {networkManager.isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">添加中...</span>
              </>
            ) : (
              <>
                <span className="mr-2">➕</span>
                添加 Monad 测试网
              </>
            )}
          </Button>
        </div>
      )}

      {/* Detailed Network Information */}
      {showDetails && (
        <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="text-lg">🌐</span>
            网络详情
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">当前网络:</span>
              <span className="text-white font-medium">{networkManager.currentNetworkName}</span>
            </div>
            
            {networkManager.currentChainId && (
              <div className="flex justify-between">
                <span className="text-white/70">Chain ID:</span>
                <span className="text-white font-mono">{networkManager.currentChainId}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-white/70">目标网络:</span>
              <span className="text-white font-medium">{networkManager.targetNetwork.name}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/70">目标 Chain ID:</span>
              <span className="text-white font-mono">{networkManager.targetNetwork.id}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/70">RPC URL:</span>
              <span className="text-white font-mono text-xs">
                {networkManager.targetNetwork.rpcUrls.default.http[0]}
              </span>
            </div>
          </div>

          {/* Network Actions */}
          <div className="mt-4 space-y-2">
            {networkManager.canSwitchNetwork && (
              <Button
                onClick={networkManager.switchToMonad}
                disabled={networkManager.isLoading || networkManager.isCorrectNetwork}
                variant={networkManager.isCorrectNetwork ? "ghost" : "primary"}
                size="sm"
                className="w-full"
              >
                {networkManager.isCorrectNetwork ? (
                  <>
                    <span className="mr-2">✅</span>
                    已连接到正确网络
                  </>
                ) : networkManager.isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">切换中...</span>
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔄</span>
                    切换到 Monad 测试网
                  </>
                )}
              </Button>
            )}
            
            <Button
              onClick={networkManager.addMonadNetwork}
              disabled={networkManager.isLoading}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              {networkManager.isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">添加中...</span>
                </>
              ) : (
                <>
                  <span className="mr-2">➕</span>
                  重新添加 Monad 测试网
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {networkManager.error && (
        <div className="mt-2 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-red-400 text-sm">⚠️</span>
            <div className="flex-1">
              <p className="text-red-100 text-sm font-medium">网络错误</p>
              <p className="text-red-200 text-xs mt-1">{networkManager.error}</p>
            </div>
            <button
              onClick={networkManager.clearError}
              className="text-red-300 hover:text-red-100 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for header/navbar use
export const NetworkStatusCompact: React.FC<{ className?: string }> = ({ className = '' }) => {
  const networkManager = useNetworkManager()
  const walletManager = useWalletManager()

  if (!walletManager.isConnected) {
    return null
  }

  const { networkStatus } = networkManager

  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${
        networkStatus.status === 'correct' 
          ? 'bg-green-500/20 text-green-100 border border-green-400/30 hover:bg-green-500/30' 
          : networkStatus.status === 'wrong'
          ? 'bg-red-500/20 text-red-100 border border-red-400/30 hover:bg-red-500/30'
          : 'bg-gray-500/20 text-gray-100 border border-gray-400/30 hover:bg-gray-500/30'
      } ${className}`}
      onClick={() => {
        if (!networkManager.isCorrectNetwork && networkManager.canSwitchNetwork) {
          networkManager.switchToMonad()
        }
      }}
      title={
        networkManager.isCorrectNetwork 
          ? '已连接到 Monad 测试网' 
          : `点击切换到 Monad 测试网 (当前: ${networkManager.currentNetworkName})`
      }
    >
      <span>{networkStatus.icon}</span>
      <span>{networkStatus.message}</span>
      
      {networkManager.isLoading && (
        <LoadingSpinner size="sm" />
      )}
      
      {!networkManager.isCorrectNetwork && networkManager.canSwitchNetwork && (
        <span className="text-xs opacity-70">点击切换</span>
      )}
    </div>
  )
}
