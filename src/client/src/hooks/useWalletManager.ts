import { useState, useCallback, useEffect, useMemo } from 'react'
import { useAccount, useDisconnect, useConnect } from 'wagmi'
import { useConnectModal, useAccountModal, useChainModal } from '@rainbow-me/rainbowkit'
import { toast } from 'react-hot-toast'

export interface WalletManagerState {
  isConnected: boolean
  isConnecting: boolean
  isDisconnecting: boolean
  address: string | undefined
  connector: any
  error: string | null
}

export const useWalletManager = () => {
  const { address, isConnected, connector } = useAccount()
  const { disconnect, isLoading: isDisconnecting } = useDisconnect()
  const { isLoading: isConnecting } = useConnect()
  const { openConnectModal } = useConnectModal()
  const { openAccountModal } = useAccountModal()
  const { openChainModal } = useChainModal()

  const [state, setState] = useState<WalletManagerState>({
    isConnected: false,
    isConnecting: false,
    isDisconnecting: false,
    address: undefined,
    connector: undefined,
    error: null,
  })

  // Update state when wallet connection changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isConnected,
      isConnecting,
      isDisconnecting,
      address,
      connector,
    }))
  }, [isConnected, isConnecting, isDisconnecting, address, connector])

  // Connect wallet
  const connectWallet = useCallback(() => {
    try {
      if (openConnectModal) {
        openConnectModal()
      } else {
        toast.error('钱包连接功能不可用')
      }
    } catch (error: any) {
      console.error('Connect wallet failed:', error)
      toast.error(`连接失败: ${error.message}`)
      setState(prev => ({ ...prev, error: error.message }))
    }
  }, [openConnectModal])

  // Disconnect wallet with confirmation
  const disconnectWallet = useCallback(async (skipConfirmation = false) => {
    if (!isConnected) {
      toast.error('钱包未连接')
      return false
    }

    // Show confirmation dialog unless skipped
    if (!skipConfirmation) {
      const confirmed = window.confirm('确定要断开钱包连接吗？这将退出您的游戏会话。')
      if (!confirmed) {
        return false
      }
    }

    try {
      setState(prev => ({ ...prev, error: null }))
      
      // Disconnect using wagmi
      disconnect()
      
      toast.success('钱包已断开连接')
      return true
    } catch (error: any) {
      console.error('Disconnect failed:', error)
      toast.error(`断开连接失败: ${error.message}`)
      setState(prev => ({ ...prev, error: error.message }))
      return false
    }
  }, [isConnected, disconnect])

  // Force disconnect (for error recovery)
  const forceDisconnect = useCallback(async () => {
    try {
      // Clear any existing connections
      if (disconnect) {
        disconnect()
      }
      
      // Clear localStorage
      localStorage.removeItem('wagmi.connected')
      localStorage.removeItem('wagmi.wallet')
      localStorage.removeItem('wagmi.cache')
      
      // Clear session storage
      sessionStorage.removeItem('wagmi.connected')
      sessionStorage.removeItem('wagmi.wallet')
      
      toast.success('钱包连接已强制清除')
      return true
    } catch (error: any) {
      console.error('Force disconnect failed:', error)
      toast.error(`强制断开失败: ${error.message}`)
      return false
    }
  }, [disconnect])

  // Open account modal
  const openAccount = useCallback(() => {
    if (!isConnected) {
      toast.error('请先连接钱包')
      return
    }

    try {
      if (openAccountModal) {
        openAccountModal()
      } else {
        toast.error('账户管理功能不可用')
      }
    } catch (error: any) {
      console.error('Open account modal failed:', error)
      toast.error(`打开账户失败: ${error.message}`)
    }
  }, [isConnected, openAccountModal])

  // Open chain modal
  const openChain = useCallback(() => {
    if (!isConnected) {
      toast.error('请先连接钱包')
      return
    }

    try {
      if (openChainModal) {
        openChainModal()
      } else {
        toast.error('网络切换功能不可用')
      }
    } catch (error: any) {
      console.error('Open chain modal failed:', error)
      toast.error(`打开网络切换失败: ${error.message}`)
    }
  }, [isConnected, openChainModal])

  // Get wallet info for display
  const getWalletInfo = useCallback(() => {
    if (!isConnected || !address) {
      return null
    }

    return {
      address,
      shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
      connector: connector?.name || 'Unknown',
      isConnected: true,
    }
  }, [isConnected, address, connector])

  // Get connection status for UI
  const getConnectionStatus = useCallback(() => {
    if (isConnecting) {
      return {
        status: 'connecting' as const,
        message: '连接中...',
        color: 'yellow',
        icon: '🔄',
      }
    }

    if (isDisconnecting) {
      return {
        status: 'disconnecting' as const,
        message: '断开连接中...',
        color: 'orange',
        icon: '⏳',
      }
    }

    if (isConnected) {
      return {
        status: 'connected' as const,
        message: '已连接',
        color: 'green',
        icon: '✅',
      }
    }

    return {
      status: 'disconnected' as const,
      message: '未连接',
      color: 'gray',
      icon: '⚪',
    }
  }, [isConnected, isConnecting, isDisconnecting])

  // Check if wallet supports specific features
  const getWalletCapabilities = useCallback(() => {
    return {
      canConnect: !!openConnectModal,
      canDisconnect: isConnected && !!disconnect,
      canOpenAccount: isConnected && !!openAccountModal,
      canSwitchChain: isConnected && !!openChainModal,
      hasConnector: !!connector,
    }
  }, [isConnected, openConnectModal, disconnect, openAccountModal, openChainModal, connector])

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [state.error, clearError])

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    // State
    ...state,

    // Actions
    connectWallet,
    disconnectWallet,
    forceDisconnect,
    openAccount,
    openChain,
    clearError,

    // Info
    walletInfo: getWalletInfo(),
    connectionStatus: getConnectionStatus(),
    capabilities: getWalletCapabilities(),

    // Modal controls
    modals: {
      openConnect: openConnectModal,
      openAccount: openAccountModal,
      openChain: openChainModal,
    },
  }), [
    state,
    connectWallet,
    disconnectWallet,
    forceDisconnect,
    openAccount,
    openChain,
    clearError,
    getWalletInfo,
    getConnectionStatus,
    getWalletCapabilities,
    openConnectModal,
    openAccountModal,
    openChainModal,
  ])
}
