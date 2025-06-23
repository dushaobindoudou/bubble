import React from 'react'
import { useWalletManager } from '../hooks/useWalletManager'
import { useNetworkManager } from '../hooks/useNetworkManager'
import { Button } from './ui/Button'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { NetworkStatusCompact } from './NetworkStatus'

interface WalletStatusProps {
  className?: string
  showDetails?: boolean
  showNetworkStatus?: boolean
}

export const WalletStatus: React.FC<WalletStatusProps> = ({ 
  className = '', 
  showDetails = false,
  showNetworkStatus = true
}) => {
  const walletManager = useWalletManager()
  const networkManager = useNetworkManager()

  const { connectionStatus, walletInfo, capabilities } = walletManager

  return (
    <div className={`wallet-status ${className}`}>
      {/* Connection Status */}
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        connectionStatus.status === 'connected' 
          ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
          : connectionStatus.status === 'connecting'
          ? 'bg-yellow-500/20 text-yellow-100 border border-yellow-400/30'
          : connectionStatus.status === 'disconnecting'
          ? 'bg-orange-500/20 text-orange-100 border border-orange-400/30'
          : 'bg-gray-500/20 text-gray-100 border border-gray-400/30'
      }`}>
        <span className="text-base">{connectionStatus.icon}</span>
        <span>{connectionStatus.message}</span>
        
        {(walletManager.isConnecting || walletManager.isDisconnecting) && (
          <LoadingSpinner size="sm" />
        )}
      </div>

      {/* Wallet Information */}
      {walletInfo && (
        <div className="mt-2 flex items-center gap-2">
          <div className="text-xs text-white/70">
            {walletInfo.shortAddress}
          </div>
          <div className="text-xs text-white/50">
            via {walletInfo.connector}
          </div>
        </div>
      )}

      {/* Network Status */}
      {showNetworkStatus && walletManager.isConnected && (
        <div className="mt-2">
          <NetworkStatusCompact />
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-3 space-y-2">
        {!walletManager.isConnected ? (
          <Button
            onClick={walletManager.connectWallet}
            disabled={walletManager.isConnecting}
            variant="primary"
            size="sm"
            className="w-full"
          >
            {walletManager.isConnecting ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">连接中...</span>
              </>
            ) : (
              <>
                <span className="mr-2">🔗</span>
                连接钱包
              </>
            )}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={walletManager.openAccount}
              disabled={!capabilities.canOpenAccount}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              <span className="mr-1">👤</span>
              账户
            </Button>
            
            <Button
              onClick={walletManager.openChain}
              disabled={!capabilities.canSwitchChain}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              <span className="mr-1">🌐</span>
              网络
            </Button>
            
            <Button
              onClick={() => walletManager.disconnectWallet()}
              disabled={walletManager.isDisconnecting || !capabilities.canDisconnect}
              variant="danger"
              size="sm"
              className="flex-1"
            >
              {walletManager.isDisconnecting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <span className="mr-1">🚪</span>
                  断开
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Detailed Information */}
      {showDetails && walletManager.isConnected && walletInfo && (
        <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="text-lg">👛</span>
            钱包详情
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">钱包类型:</span>
              <span className="text-white font-medium">{walletInfo.connector}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/70">地址:</span>
              <span className="text-white font-mono text-xs">{walletInfo.address}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/70">短地址:</span>
              <span className="text-white font-mono">{walletInfo.shortAddress}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/70">连接状态:</span>
              <span className="text-green-400 font-medium">已连接</span>
            </div>
          </div>

          {/* Wallet Capabilities */}
          <div className="mt-4">
            <h5 className="text-white/80 font-medium mb-2 text-sm">钱包功能</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`flex items-center gap-1 ${capabilities.canOpenAccount ? 'text-green-400' : 'text-red-400'}`}>
                <span>{capabilities.canOpenAccount ? '✅' : '❌'}</span>
                <span>账户管理</span>
              </div>
              <div className={`flex items-center gap-1 ${capabilities.canSwitchChain ? 'text-green-400' : 'text-red-400'}`}>
                <span>{capabilities.canSwitchChain ? '✅' : '❌'}</span>
                <span>网络切换</span>
              </div>
              <div className={`flex items-center gap-1 ${capabilities.canDisconnect ? 'text-green-400' : 'text-red-400'}`}>
                <span>{capabilities.canDisconnect ? '✅' : '❌'}</span>
                <span>断开连接</span>
              </div>
              <div className={`flex items-center gap-1 ${capabilities.hasConnector ? 'text-green-400' : 'text-red-400'}`}>
                <span>{capabilities.hasConnector ? '✅' : '❌'}</span>
                <span>连接器</span>
              </div>
            </div>
          </div>

          {/* Advanced Actions */}
          <div className="mt-4 space-y-2">
            <Button
              onClick={walletManager.openAccount}
              disabled={!capabilities.canOpenAccount}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              <span className="mr-2">👤</span>
              打开账户管理
            </Button>
            
            <Button
              onClick={walletManager.openChain}
              disabled={!capabilities.canSwitchChain}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              <span className="mr-2">🌐</span>
              打开网络切换
            </Button>
            
            <Button
              onClick={walletManager.forceDisconnect}
              variant="danger"
              size="sm"
              className="w-full"
            >
              <span className="mr-2">⚠️</span>
              强制断开连接
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {walletManager.error && (
        <div className="mt-2 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-red-400 text-sm">⚠️</span>
            <div className="flex-1">
              <p className="text-red-100 text-sm font-medium">钱包错误</p>
              <p className="text-red-200 text-xs mt-1">{walletManager.error}</p>
            </div>
            <button
              onClick={walletManager.clearError}
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
export const WalletStatusCompact: React.FC<{ className?: string }> = ({ className = '' }) => {
  const walletManager = useWalletManager()

  const { connectionStatus, walletInfo } = walletManager

  if (!walletManager.isConnected) {
    return (
      <Button
        onClick={walletManager.connectWallet}
        disabled={walletManager.isConnecting}
        variant="primary"
        size="sm"
        className={className}
      >
        {walletManager.isConnecting ? (
          <>
            <LoadingSpinner size="sm" />
            <span className="ml-2">连接中</span>
          </>
        ) : (
          <>
            <span className="mr-2">🔗</span>
            连接钱包
          </>
        )}
      </Button>
    )
  }

  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all bg-green-500/20 text-green-100 border border-green-400/30 hover:bg-green-500/30 ${className}`}
      onClick={walletManager.openAccount}
      title={`钱包已连接: ${walletInfo?.address || 'Unknown'}`}
    >
      <span>{connectionStatus.icon}</span>
      <span>{walletInfo?.shortAddress || 'Unknown'}</span>
      
      {(walletManager.isConnecting || walletManager.isDisconnecting) && (
        <LoadingSpinner size="sm" />
      )}
    </div>
  )
}
