import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNetwork, useSwitchNetwork } from 'wagmi'
import { toast } from 'react-hot-toast'
import { 
  monadTestnet, 
  isCorrectNetwork, 
  getNetworkName, 
  getNetworkErrorMessage,
  switchToMonadTestnet,
  addMonadTestnetToWallet,
  supportsNetworkSwitching,
  isSupportedChain
} from '../config/wagmi'

export interface NetworkManagerState {
  isCorrectNetwork: boolean
  currentChainId: number | undefined
  currentNetworkName: string
  isLoading: boolean
  error: string | null
  canSwitchNetwork: boolean
}

export const useNetworkManager = () => {
  const { chain } = useNetwork()
  const { switchNetwork, isLoading: isSwitchLoading } = useSwitchNetwork()
  
  const [state, setState] = useState<NetworkManagerState>({
    isCorrectNetwork: false,
    currentChainId: undefined,
    currentNetworkName: 'Unknown',
    isLoading: false,
    error: null,
    canSwitchNetwork: false,
  })

  // Update state when network changes
  useEffect(() => {
    const chainId = chain?.id
    const networkName = chainId ? getNetworkName(chainId) : 'Unknown'
    const isCorrect = chainId ? isCorrectNetwork(chainId) : false
    const canSwitch = supportsNetworkSwitching() && !!switchNetwork
    const errorMessage = chainId && !isCorrect ? getNetworkErrorMessage(chainId) : null

    setState(prev => ({
      ...prev,
      currentChainId: chainId,
      currentNetworkName: networkName,
      isCorrectNetwork: isCorrect,
      canSwitchNetwork: canSwitch,
      error: errorMessage,
      isLoading: isSwitchLoading,
    }))
  }, [chain?.id, switchNetwork, isSwitchLoading])

  // Switch to Monad Testnet using wagmi
  const switchToMonad = useCallback(async () => {
    if (!switchNetwork) {
      toast.error('网络切换功能不可用')
      return false
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // Use wagmi's switchNetwork if available
      switchNetwork(monadTestnet.id)
      
      toast.success('正在切换到 Monad 测试网...')
      return true
    } catch (error: any) {
      console.error('Network switch failed:', error)
      
      // Fallback to manual network switching
      try {
        await switchToMonadTestnet()
        toast.success('已切换到 Monad 测试网')
        return true
      } catch (fallbackError: any) {
        console.error('Fallback network switch failed:', fallbackError)
        toast.error(`网络切换失败: ${fallbackError.message}`)
        setState(prev => ({ 
          ...prev, 
          error: `网络切换失败: ${fallbackError.message}`,
          isLoading: false 
        }))
        return false
      }
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [switchNetwork])

  // Add Monad Testnet to wallet
  const addMonadNetwork = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      await addMonadTestnetToWallet()
      toast.success('Monad 测试网已添加到您的钱包')
      
      // Try to switch after adding
      setTimeout(() => {
        switchToMonad()
      }, 1000)
      
      return true
    } catch (error: any) {
      console.error('Add network failed:', error)
      toast.error(`添加网络失败: ${error.message}`)
      setState(prev => ({ 
        ...prev, 
        error: `添加网络失败: ${error.message}`,
        isLoading: false 
      }))
      return false
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [switchToMonad])

  // Auto-prompt for network switch when on wrong network
  const promptNetworkSwitch = useCallback(() => {
    if (!state.isCorrectNetwork && state.currentChainId && state.canSwitchNetwork) {
      const networkName = getNetworkName(state.currentChainId)
      
      toast.error(
        `您当前连接到 ${networkName}。请切换到 Monad 测试网以使用 Bubble Brawl。`,
        {
          duration: 6000,
          id: 'network-switch-prompt',
        }
      )
    }
  }, [state.isCorrectNetwork, state.currentChainId, state.canSwitchNetwork])

  // Check if current network is supported
  const isNetworkSupported = useCallback((chainId?: number) => {
    return chainId ? isSupportedChain(chainId) : false
  }, [])

  // Get network status for UI display
  const getNetworkStatus = useCallback(() => {
    if (!state.currentChainId) {
      return {
        status: 'disconnected' as const,
        message: '未连接',
        color: 'gray',
        icon: '⚪',
      }
    }

    if (state.isCorrectNetwork) {
      return {
        status: 'correct' as const,
        message: 'Monad 测试网',
        color: 'green',
        icon: '✅',
      }
    }

    return {
      status: 'wrong' as const,
      message: state.currentNetworkName,
      color: 'red',
      icon: '⚠️',
    }
  }, [state.isCorrectNetwork, state.currentChainId, state.currentNetworkName])

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    // State
    ...state,

    // Network info
    targetNetwork: monadTestnet,
    networkStatus: getNetworkStatus(),

    // Actions
    switchToMonad,
    addMonadNetwork,
    promptNetworkSwitch,
    clearError,

    // Utilities
    isNetworkSupported,
    getNetworkName: (chainId: number) => getNetworkName(chainId),
  }), [
    state,
    getNetworkStatus,
    switchToMonad,
    addMonadNetwork,
    promptNetworkSwitch,
    clearError,
    isNetworkSupported,
  ])
}
