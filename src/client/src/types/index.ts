// Type definitions for Bubble Brawl client

export interface User {
  address?: string | undefined
  chainId?: number | undefined
  loginMethod: 'wallet' | 'guest'
  isGuest: boolean
  timestamp: number
  expiresAt: number
}

export interface Session {
  id: string
  address?: string | undefined
  chainId?: number | undefined
  loginMethod: 'wallet' | 'guest'
  isGuest: boolean
  timestamp: number
  expiresAt: number
  userAgent: string
  ip?: string | undefined
  lastActivity: number
}

export interface WalletConnectionState {
  isConnecting: boolean
  isConnected: boolean
  address?: string | undefined
  chainId?: number | undefined
  error?: string | undefined
}

export interface NetworkInfo {
  chainId: number
  name: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls: string[]
  testnet?: boolean
}

export interface ContractAddresses {
  BubbleToken: string
  BubbleSkinNFT: string
  GameRewards: string
  Marketplace: string
  RandomGenerator: string
  AccessControlManager: string
}

export interface UserBalances {
  MON: string
  BUB: string
  NFTs: string[]
}

export interface GameConfig {
  apiBaseUrl: string
  wsUrl: string
  monadTestnet: NetworkInfo
  contractAddresses: ContractAddresses
}

export interface AuthContextType {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (method: 'wallet' | 'guest') => Promise<void>
  logout: () => void
  walletState: WalletConnectionState
  userBalances: UserBalances | null
  refreshBalances: () => Promise<void>
}

export interface LoginFormData {
  method: 'wallet' | 'guest'
  walletType?: string
}

// Game-related types (for integration with existing game)
export interface GameState {
  isPlaying: boolean
  playerName: string
  score: number
  level: number
}

export interface GamePlayer {
  id: string
  name: string
  address?: string
  score: number
  position: { x: number; y: number }
  isAlive: boolean
}

// Error types
export interface AuthError {
  code: string
  message: string
  details?: any
}

export interface NetworkError extends AuthError {
  chainId?: number
  expectedChainId?: number
}

export interface WalletError extends AuthError {
  walletType?: string
}

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export type Theme = 'light' | 'dark'

export interface AppConfig {
  theme: Theme
  language: string
  notifications: boolean
  autoConnect: boolean
}
