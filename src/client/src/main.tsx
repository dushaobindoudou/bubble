import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiConfig } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { Toaster } from 'react-hot-toast'

import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { wagmiConfig, chains } from './config/wagmi'
import { rainbowKitTheme } from './config/rainbowkit'

// Import global styles
import './styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
})

// Initialize React app
const root = ReactDOM.createRoot(
  document.getElementById('react-root') as HTMLElement
)

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider
            chains={chains}
            // theme={rainbowKitTheme}
            appInfo={{
              appName: 'Bubble Brawl',
              learnMoreUrl: 'https://bubble-brawl.game',
              disclaimer: ({ Text, Link }) => (
                <Text>
                  连接钱包即表示您同意我们的{' '}
                  <Link href="https://bubble-brawl.game/terms">使用条款</Link>{' '}
                  和{' '}
                  <Link href="https://bubble-brawl.game/privacy">隐私政策</Link>
                </Text>
              ),
            }}
            modalSize="wide"
            initialChain={chains[0]}
            showRecentTransactions={true}
          >
            <AuthProvider>
              <App />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10B981',
                      secondary: 'white',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#EF4444',
                      secondary: 'white',
                    },
                  },
                }}
              />
            </AuthProvider>
          </RainbowKitProvider>
        </WagmiConfig>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// Hot module replacement for development
if (import.meta.hot) {
  import.meta.hot.accept()
}
