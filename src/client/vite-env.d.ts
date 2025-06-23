/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  readonly VITE_MONAD_RPC_URL: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global declarations for existing vanilla JS game
declare global {
  interface Window {
    // Game globals from app.js
    startGame: (mode: string) => void
    validNick: (nick: string) => boolean
    
    // Web3 globals
    ethereum?: any
    
    // Session management
    sessionManager?: any
    
    // Legacy authentication
    Web3Config?: any
    Web3AuthManager?: any
    AuthUI?: any
    BubbleBrawlWeb3?: any
    
    // Game state
    gameState?: any
    canvas?: HTMLCanvasElement
    ctx?: CanvasRenderingContext2D
    
    // WebSocket
    ws?: WebSocket
    
    // jQuery (if still used)
    $?: any
    jQuery?: any
  }
}

export {}
