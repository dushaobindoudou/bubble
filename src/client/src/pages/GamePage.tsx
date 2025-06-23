import React, { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { cleanupGameIntegration, setupGameCommunication } from '../utils/gameIntegration'
import { WalletStatusCompact } from '../components/WalletStatus'
import { NetworkStatusCompact } from '../components/NetworkStatus'

const GamePage: React.FC = () => {
  const { logout, session, user } = useAuth()
  const gameContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Setup communication between React and legacy game
    setupGameCommunication()

    // Listen for logout events from legacy game
    const handleLogout = () => {
      logout()
    }

    window.addEventListener('bubble-brawl-logout', handleLogout)

    // Cleanup on unmount
    return () => {
      window.removeEventListener('bubble-brawl-logout', handleLogout)
      cleanupGameIntegration()
    }
  }, [logout])

  // The actual game content will be loaded by the legacy HTML
  // This component just provides the React wrapper
  return (
    <div ref={gameContainerRef} className="game-page">
      {/* Game mode indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`px-4 py-2 rounded-full text-white font-semibold text-sm backdrop-blur-md border border-white/20 ${
          user?.isGuest 
            ? 'bg-gray-600/90' 
            : 'bg-purple-600/90'
        }`}>
          {user?.isGuest ? '👤 游客模式' : '🔗 Web3模式'}
        </div>
      </div>

      {/* Wallet and Network Status for Web3 users */}
      {!user?.isGuest && user?.address && (
        <div className="fixed top-4 left-4 z-50 space-y-2">
          <WalletStatusCompact />
          <NetworkStatusCompact />
        </div>
      )}

      {/* Session info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50">
          <details className="bg-black/50 backdrop-blur-md rounded-lg p-2 text-white text-xs">
            <summary className="cursor-pointer">Session Info</summary>
            <pre className="mt-2 text-xs">
              {JSON.stringify(session, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* The legacy game will be rendered here by the existing HTML structure */}
      {/* This div will be populated by the legacy game initialization */}
      <div id="legacy-game-container" className="w-full h-full">
        {/* Legacy game content will be injected here */}
      </div>
    </div>
  )
}

export default GamePage
