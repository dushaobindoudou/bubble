import { lightTheme, darkTheme } from '@rainbow-me/rainbowkit'

// Custom RainbowKit theme for Bubble Brawl
export const rainbowKitTheme = lightTheme({
  accentColor: '#667eea',
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
})

// Dark theme variant
export const rainbowKitDarkTheme = darkTheme({
  accentColor: '#667eea',
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
})

// Custom CSS overrides for RainbowKit
export const rainbowKitCustomStyles = `
  /* Custom button styles */
  [data-rk] button[data-testid="rk-connect-button"] {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    border: 2px solid rgba(255, 255, 255, 0.3) !important;
    border-radius: 16px !important;
    padding: 16px 32px !important;
    font-size: 1.1rem !important;
    font-weight: 600 !important;
    color: white !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3) !important;
    font-family: 'Orbitron', sans-serif !important;
    min-width: 200px !important;
  }

  [data-rk] button[data-testid="rk-connect-button"]:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4) !important;
    border-color: rgba(255, 255, 255, 0.5) !important;
  }

  /* Enhanced wallet modal styling */
  [data-rk] [data-testid="rk-wallet-option"] {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 12px !important;
    transition: all 0.2s ease !important;
    padding: 16px !important;
    margin-bottom: 8px !important;
  }

  [data-rk] [data-testid="rk-wallet-option"]:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  }

  /* Wallet option text styling */
  [data-rk] [data-testid="rk-wallet-option"] span {
    color: white !important;
    font-weight: 500 !important;
  }

  /* Wallet group headers */
  [data-rk] h2 {
    color: white !important;
    font-weight: 600 !important;
    margin-bottom: 12px !important;
    font-size: 0.9rem !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
    opacity: 0.8 !important;
  }

  /* Enhanced modal backdrop */
  [data-rk] [data-testid="rk-modal-backdrop"] {
    backdrop-filter: blur(12px) !important;
    background: rgba(0, 0, 0, 0.6) !important;
  }

  /* Modal content styling */
  [data-rk] [data-testid="rk-modal"] {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%) !important;
    backdrop-filter: blur(20px) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 24px !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
  }

  /* Modal header styling */
  [data-rk] [data-testid="rk-modal-header"] {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
    padding-bottom: 16px !important;
    margin-bottom: 20px !important;
  }

  /* Modal title */
  [data-rk] [data-testid="rk-modal-title"] {
    color: white !important;
    font-weight: 700 !important;
    font-size: 1.25rem !important;
  }

  /* Close button */
  [data-rk] button[aria-label="Close"] {
    color: rgba(255, 255, 255, 0.7) !important;
    transition: all 0.2s ease !important;
  }

  [data-rk] button[aria-label="Close"]:hover {
    color: white !important;
    background: rgba(255, 255, 255, 0.1) !important;
  }

  /* Wallet icons enhancement */
  [data-rk] [data-testid="rk-wallet-option"] img {
    border-radius: 8px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  }

  /* Recent wallet indicator */
  [data-rk] [data-testid="rk-recent-badge"] {
    background: linear-gradient(45deg, #10b981, #059669) !important;
    color: white !important;
    font-size: 0.75rem !important;
    padding: 2px 8px !important;
    border-radius: 6px !important;
  }

  /* Get wallet section */
  [data-rk] [data-testid="rk-get-wallet"] {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 12px !important;
    padding: 16px !important;
    margin-top: 16px !important;
  }

  [data-rk] [data-testid="rk-get-wallet"]:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
  }

  /* Learn more links */
  [data-rk] a {
    color: #ffd700 !important;
    transition: color 0.2s ease !important;
  }

  [data-rk] a:hover {
    color: #ffed4e !important;
  }

  /* Modal customization */
  [data-rk] [data-testid="rk-modal-backdrop"] {
    backdrop-filter: blur(10px) !important;
  }

  [data-rk] [data-testid="rk-modal"] {
    border-radius: 24px !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    background: rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(20px) !important;
  }

  /* Wallet option styling */
  [data-rk] button[data-testid*="rk-wallet-option"] {
    background: rgba(255, 255, 255, 0.1) !important;
    border: 2px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 12px !important;
    transition: all 0.2s ease !important;
  }

  [data-rk] button[data-testid*="rk-wallet-option"]:hover {
    background: rgba(255, 255, 255, 0.2) !important;
    border-color: rgba(255, 255, 255, 0.4) !important;
    transform: translateY(-2px) !important;
  }

  /* Account modal styling */
  [data-rk] [data-testid="rk-account-button"] {
    background: rgba(255, 255, 255, 0.2) !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    border-radius: 12px !important;
    color: white !important;
    font-weight: 600 !important;
  }

  /* Network button styling */
  [data-rk] [data-testid="rk-chain-button"] {
    background: rgba(255, 255, 255, 0.2) !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    border-radius: 12px !important;
    color: white !important;
    font-weight: 600 !important;
  }

  /* Wrong network styling */
  [data-rk] [data-testid="rk-chain-button"][data-chain-unsupported="true"] {
    background: #ff4757 !important;
    border-color: #ff3742 !important;
  }

  /* Text color overrides */
  [data-rk] * {
    color: white !important;
  }

  /* Loading spinner */
  [data-rk] [data-testid="rk-loading-spinner"] {
    border-color: rgba(255, 255, 255, 0.3) !important;
    border-top-color: white !important;
  }
`

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = rainbowKitCustomStyles
  document.head.appendChild(styleElement)
}
