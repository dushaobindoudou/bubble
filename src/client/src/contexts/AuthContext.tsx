import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAccount, useNetwork } from 'wagmi'
import toast from 'react-hot-toast'

import type { AuthContextType, Session, User, WalletConnectionState, UserBalances } from '../types'
import { SessionManager } from '../utils/sessionManager'
import { useWalletManager } from '../hooks/useWalletManager'
import { useNetworkManager } from '../hooks/useNetworkManager'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userBalances, setUserBalances] = useState<UserBalances | null>(null)

  // Wagmi hooks
  const { address, isConnected, isConnecting } = useAccount()
  const { chain } = useNetwork()

  // Custom hooks for wallet and network management
  const walletManager = useWalletManager()
  const networkManager = useNetworkManager()

  // Session manager instance
  const sessionManager = new SessionManager()

  // Wallet connection state
  const walletState: WalletConnectionState = {
    isConnecting,
    isConnected,
    address: address || undefined,
    chainId: chain?.id,
    error: walletManager.error || networkManager.error || undefined,
  }

  // Load existing session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const existingSession = sessionManager.getCurrentSession()
        if (existingSession && sessionManager.isSessionValid(existingSession)) {
          setSession(existingSession)
          setUser({
            address: existingSession.address,
            chainId: existingSession.chainId,
            loginMethod: existingSession.loginMethod,
            isGuest: existingSession.isGuest,
            timestamp: existingSession.timestamp,
            expiresAt: existingSession.expiresAt,
          })
          
          // Load balances if wallet connected
          if (!existingSession.isGuest && existingSession.address) {
            await refreshBalances()
          }
        }
      } catch (error) {
        console.error('Failed to load session:', error)
        sessionManager.clearSession()
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [])

  // Handle wallet connection changes
  useEffect(() => {
    if (isConnected && address && session?.loginMethod === 'wallet') {
      // Only update if address or chainId actually changed
      const currentAddress = session.address
      const currentChainId = session.chainId
      const newAddress = address as string
      const newChainId = chain?.id

      if (currentAddress !== newAddress || currentChainId !== newChainId) {
        const updatedSession = {
          ...session,
          address: newAddress,
          chainId: newChainId,
          lastActivity: Date.now(),
        }

        sessionManager.updateSession(updatedSession)
        setSession(updatedSession)
        setUser(prev => prev ? { ...prev, address: newAddress, chainId: newChainId } : null)
      }
    }
  }, [isConnected, address, chain?.id, session?.address, session?.chainId, session?.loginMethod])

  // 🔥 新增：监听钱包断开事件
  useEffect(() => {
    // 当钱包断开连接时，清除会话状态
    if (!isConnected && session?.loginMethod === 'wallet') {
      console.log('🔄 检测到钱包断开连接，清除会话状态')
      
      // 清除会话
      sessionManager.clearSession()
      setSession(null)
      setUser(null)
      setUserBalances(null)
      
      // 显示断开连接提示
      toast.error('钱包连接已断开')
      
      // 延迟跳转到登录页面，确保状态清除完成
      setTimeout(() => {
        // 检查当前是否在游戏页面，如果是则跳转到登录页面
        if (window.location.pathname === '/game') {
          console.log('🔄 钱包断开后跳转到登录页面')
          window.location.href = '/login'
        }
      }, 500)
    }
  }, [isConnected, session?.loginMethod])

  // Handle network checking and balance refresh separately
  useEffect(() => {
    if (isConnected && address && session?.loginMethod === 'wallet') {
      // Check network using network manager
      if (!networkManager.isCorrectNetwork) {
        networkManager.promptNetworkSwitch()
      } else {
        // Only refresh balances if we're on the correct network
        refreshBalances()
      }
    }
  }, [isConnected, address, session?.loginMethod, networkManager.isCorrectNetwork])

  // Login function
  const login = useCallback(async (method: 'wallet' | 'guest') => {
    setIsLoading(true)

    try {
      if (method === 'wallet') {
        // Use wallet manager to connect
        walletManager.connectWallet()

        // Wait for connection (handled by useEffect above)
        return
      } else {
        // Guest login
        const sessionData = {
          loginMethod: 'guest' as const,
          isGuest: true,
          timestamp: Date.now(),
        }

        const newSession = sessionManager.createSession(sessionData)
        setSession(newSession)
        setUser({
          address: undefined,
          chainId: undefined,
          loginMethod: 'guest',
          isGuest: true,
          timestamp: newSession.timestamp,
          expiresAt: newSession.expiresAt,
        })

        toast.success('游客登录成功')
      }
    } catch (error) {
      console.error('Login failed:', error)
      toast.error(`登录失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Disconnect wallet using wallet manager
      if (isConnected) {
        await walletManager.disconnectWallet(true) // Skip confirmation since we're already in logout flow
      }

      // Clear session
      sessionManager.clearSession()
      setSession(null)
      setUser(null)
      setUserBalances(null)

      toast.success('已退出登录')
    } catch (error) {
      console.error('Logout failed:', error)
      toast.error('退出登录失败')
    }
  }, [isConnected])

  // Refresh user balances
  const refreshBalances = useCallback(async () => {
    if (!address || !isConnected || !chain || !networkManager.isCorrectNetwork) {
      return
    }

    try {
      // This would typically call your contract read functions
      // For now, we'll use placeholder values
      const balances: UserBalances = {
        MON: '0.0',
        BUB: '0.0',
        NFTs: [],
      }

      // TODO: Implement actual balance fetching using wagmi hooks
      // const bubbleTokenBalance = await readContract({
      //   address: CONTRACT_ADDRESSES.BubbleToken,
      //   abi: bubbleTokenABI,
      //   functionName: 'balanceOf',
      //   args: [address],
      // })

      setUserBalances(balances)
    } catch (error) {
      console.error('Failed to refresh balances:', error)
    }
  }, [address, isConnected, chain?.id, networkManager.isCorrectNetwork])

  // Handle wallet connection success
  useEffect(() => {
    if (isConnected && address && !session) {
      // Create session for wallet connection
      const sessionData = {
        address: address as string,
        chainId: chain?.id || undefined,
        loginMethod: 'wallet' as const,
        isGuest: false,
        timestamp: Date.now(),
      }

      const newSession = sessionManager.createSession(sessionData)
      setSession(newSession)
      setUser({
        address: address as string,
        chainId: chain?.id || undefined,
        loginMethod: 'wallet',
        isGuest: false,
        timestamp: newSession.timestamp,
        expiresAt: newSession.expiresAt,
      })

      toast.success('钱包连接成功')
      setIsLoading(false)
    }
  }, [isConnected, address, chain?.id, session])

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!session && sessionManager.isSessionValid(session),
    isLoading,
    login,
    logout,
    walletState,
    userBalances,
    refreshBalances,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
