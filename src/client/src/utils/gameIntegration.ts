import type { Session } from '../types'

/**
 * Initialize legacy game integration
 * This function bridges the React app with the existing vanilla JS game
 */
export const initializeLegacyGame = (session: Session | null) => {
  if (!session) {
    console.warn('No session provided for game initialization')
    return
  }

  // Set up global session manager for legacy code
  if (!window.sessionManager) {
    // Import the legacy session manager if it exists
    const legacySessionManager = {
      getCurrentSession: () => session,
      hasValidSession: () => true,
      isGuest: () => session.isGuest,
      hasWalletConnected: () => !session.isGuest && !!session.address,
      getUserAddress: () => session.address,
      getUserChainId: () => session.chainId,
      clearSession: () => {
        // This will be handled by React context
        console.log('Session clear requested from legacy code')
      },
    }
    
    window.sessionManager = legacySessionManager
  }

  // Set player name based on session
  const setPlayerName = () => {
    const playerNameInput = document.getElementById('playerNameInput') as HTMLInputElement
    if (playerNameInput) {
      if (session.isGuest) {
        playerNameInput.value = `Guest_${Date.now().toString().slice(-4)}`
      } else if (session.address) {
        playerNameInput.value = `Player_${session.address.slice(-4)}`
      }
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setPlayerName)
  } else {
    setPlayerName()
  }

  // Load legacy scripts if not already loaded
  loadLegacyScripts(session.isGuest)
}

/**
 * Load legacy game scripts based on authentication method
 */
const loadLegacyScripts = (isGuest: boolean) => {
  const scriptsToLoad = ['js/app.js']
  
  // Add Web3 scripts if not guest
  if (!isGuest) {
    scriptsToLoad.unshift(
      'js/web3-config.js',
      'js/web3-auth.js',
      'js/auth-ui.js',
      'js/web3-integration.js'
    )
  }

  // Load scripts sequentially
  loadScriptsSequentially(scriptsToLoad)
    .then(() => {
      console.log('✅ Legacy game scripts loaded successfully')
      initializeGameUI(isGuest)
    })
    .catch(error => {
      console.error('❌ Failed to load legacy game scripts:', error)
    })
}

/**
 * Load scripts sequentially
 */
const loadScriptsSequentially = (scripts: string[]): Promise<void> => {
  return scripts.reduce((promise, script) => {
    return promise.then(() => {
      return new Promise<void>((resolve, reject) => {
        // Check if script is already loaded
        const existingScript = document.querySelector(`script[src="${script}"]`)
        if (existingScript) {
          resolve()
          return
        }

        const scriptElement = document.createElement('script')
        scriptElement.src = script
        scriptElement.onload = () => resolve()
        scriptElement.onerror = () => reject(new Error(`Failed to load ${script}`))
        document.head.appendChild(scriptElement)
      })
    })
  }, Promise.resolve())
}

/**
 * Initialize game UI after scripts are loaded
 */
const initializeGameUI = (isGuest: boolean) => {
  // Add logout button to game interface
  addLogoutButton()
  
  // Initialize game mode indicator
  addGameModeIndicator(isGuest)
  
  // Set up Web3 integration if not guest
  if (!isGuest) {
    setupWeb3Integration()
  }
}

/**
 * Add logout button to game interface
 */
const addLogoutButton = () => {
  const startMenu = document.getElementById('startMenu')
  if (!startMenu) {
    console.warn('Start menu not found, cannot add logout button')
    return
  }

  // Check if logout button already exists
  if (document.getElementById('logoutButton')) {
    return
  }

  const logoutBtn = document.createElement('button')
  logoutBtn.id = 'logoutButton'
  logoutBtn.innerHTML = '🚪 退出登录'
  logoutBtn.style.cssText = `
    background: linear-gradient(135deg, #ff4757, #c44569);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    margin: 10px 0;
    transition: all 0.2s;
    width: 200px;
  `
  
  logoutBtn.addEventListener('click', () => {
    if (confirm('确定要退出登录吗？')) {
      // Trigger logout through React context
      window.dispatchEvent(new CustomEvent('bubble-brawl-logout'))
    }
  })
  
  logoutBtn.addEventListener('mouseenter', () => {
    logoutBtn.style.transform = 'translateY(-2px)'
    logoutBtn.style.boxShadow = '0 8px 20px rgba(255, 71, 87, 0.4)'
  })
  
  logoutBtn.addEventListener('mouseleave', () => {
    logoutBtn.style.transform = 'translateY(0)'
    logoutBtn.style.boxShadow = 'none'
  })
  
  startMenu.appendChild(logoutBtn)
}

/**
 * Add game mode indicator
 */
const addGameModeIndicator = (isGuest: boolean) => {
  const gameContainer = document.getElementById('gameContainer') || document.body
  
  // Check if indicator already exists
  if (document.getElementById('gameModeIndicator')) {
    return
  }

  const indicator = document.createElement('div')
  indicator.id = 'gameModeIndicator'
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${isGuest ? 'rgba(108, 117, 125, 0.9)' : 'rgba(102, 126, 234, 0.9)'};
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    z-index: 1000;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  `
  
  indicator.textContent = isGuest ? '👤 游客模式' : '🔗 Web3模式'
  gameContainer.appendChild(indicator)
}

/**
 * Setup Web3 integration for authenticated users
 */
const setupWeb3Integration = () => {
  // This would integrate with the existing Web3 functionality
  // For now, we'll just log that Web3 mode is active
  console.log('🔗 Web3 integration active')
  
  // You could add additional Web3-specific UI elements here
  // such as balance displays, NFT showcases, etc.
}

/**
 * Clean up game integration
 */
export const cleanupGameIntegration = () => {
  // Remove added UI elements
  const elementsToRemove = [
    'logoutButton',
    'gameModeIndicator',
  ]
  
  elementsToRemove.forEach(id => {
    const element = document.getElementById(id)
    if (element) {
      element.remove()
    }
  })
  
  // Clean up global references
  if (window.sessionManager) {
    delete window.sessionManager
  }
}

/**
 * Handle communication between React and legacy game
 */
export const setupGameCommunication = () => {
  // Listen for logout events from legacy game
  window.addEventListener('bubble-brawl-logout', () => {
    // This will be handled by the React app
    console.log('Logout requested from legacy game')
  })
  
  // Listen for game state changes
  window.addEventListener('bubble-brawl-game-state-change', (event: any) => {
    console.log('Game state changed:', event.detail)
  })
}

/**
 * Utility to check if legacy game is loaded
 */
export const isLegacyGameLoaded = (): boolean => {
  return typeof window.startGame === 'function'
}

/**
 * Utility to start the legacy game
 */
export const startLegacyGame = (mode: string = 'normal') => {
  if (isLegacyGameLoaded() && window.startGame) {
    window.startGame(mode)
  } else {
    console.error('Legacy game not loaded')
  }
}
