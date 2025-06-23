import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'

import { AnimatedBackground } from '../components/ui/AnimatedBackground'
import { WalletInfo } from '../components/WalletInfo'
import { AnimatedBubble, SmallBubble } from '../components/ui/AnimatedBubble'
import { BubbleCluster } from '../components/ui/InteractiveBubbles'

const LoginPage: React.FC = () => {

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        {/* Cute Header */}
        <header className="text-center mb-12 animate-slide-down">
          <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
            <div className="relative group cursor-pointer">
              <div className="animate-gentle-float transition-transform duration-300 group-hover:scale-110">
                <AnimatedBubble
                  size={80}
                  gradient="rainbow"
                  opacity={0.9}
                  glowIntensity="high"
                  animationType="pulse"
                />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-pulse group-hover:scale-125 transition-transform duration-300"></div>
            </div>
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 bg-clip-text text-transparent">
                泡泡大作战
              </h1>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg mt-2 animate-pulse">
                <span className="text-xs">✨</span>
                <span>Web3 Gaming</span>
                <span className="text-xs">✨</span>
              </div>
            </div>
          </div>
          <p className="text-xl text-white/95 font-medium drop-shadow-md">
            🌟 多人泡泡大作战 🌟
          </p>
        </header>

        {/* Cute Main Content */}
        <main className="bg-white/15 backdrop-blur-xl rounded-3xl p-8 md:p-10 max-w-lg w-full shadow-2xl border-2 border-white/30 animate-slide-up relative overflow-hidden">
          {/* Decorative bubble cluster */}
          <div className="absolute inset-0 pointer-events-none">
            <BubbleCluster count={4} />
          </div>

          {/* Additional decorative elements */}
          <div className="absolute top-4 right-4 animate-gentle-float">
            <AnimatedBubble size={20} gradient="cyan" opacity={0.6} animationType="pulse" />
          </div>
          <div className="absolute bottom-4 left-4 animate-bounce">
            <AnimatedBubble size={16} gradient="purple" opacity={0.5} animationType="static" />
          </div>

          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl">🎮</span>
              <h2 className="text-2xl font-bold text-white drop-shadow-md">
                欢迎来到泡泡世界
              </h2>
              <span className="text-2xl">🎮</span>
            </div>
            <p className="text-white/95 leading-relaxed text-lg">
              连接您的 Web3 钱包，开始泡泡大冒险吧！
            </p>
            <div className="flex justify-center gap-3 mt-4">
              <div className="animate-bounce" style={{ animationDelay: '0s' }}>
                <SmallBubble gradient="blue" opacity={0.8} animationType="static" />
              </div>
              <span className="text-lg animate-bounce" style={{ animationDelay: '0.2s' }}>💖</span>
              <div className="animate-bounce" style={{ animationDelay: '0.4s' }}>
                <SmallBubble gradient="pink" opacity={0.8} animationType="static" />
              </div>
            </div>
          </div>

          {/* Cute Wallet Section */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl p-6 border border-white/20 mb-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-xl">👛</span>
                  <span className="text-white font-semibold">选择您的钱包</span>
                  <span className="text-xl">✨</span>
                </div>

                {/* Enhanced RainbowKit Connect Button */}
                <div className="flex justify-center">
                  <div className="rainbowkit-connect-wrapper">
                    <ConnectButton
                      label="连接钱包"
                      accountStatus={{
                        smallScreen: 'avatar',
                        largeScreen: 'full',
                      }}
                      chainStatus={{
                        smallScreen: 'icon',
                        largeScreen: 'full',
                      }}
                      showBalance={{
                        smallScreen: false,
                        largeScreen: true,
                      }}
                    />
                  </div>
                </div>

                <p className="text-white/80 text-sm mt-4">
                  支持 36+ 种钱包，包括 MetaMask、Rainbow、Coinbase 等
                </p>
              </div>
            </div>

            {/* Cute Features Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-white/95 bg-white/10 rounded-xl p-3 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                <span className="text-xl">🎮</span>
                <span className="font-medium">多人对战</span>
              </div>
              <div className="flex items-center gap-2 text-white/95 bg-white/10 rounded-xl p-3 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                <span className="text-xl">🏆</span>
                <span className="font-medium">NFT 奖励</span>
              </div>
              <div className="flex items-center gap-2 text-white/95 bg-white/10 rounded-xl p-3 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                <span className="text-xl">�</span>
                <span className="font-medium">代币经济</span>
              </div>
              <div className="flex items-center gap-2 text-white/95 bg-white/10 rounded-xl p-3 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                <span className="text-xl">�️</span>
                <span className="font-medium">去中心化</span>
              </div>
            </div>
          </div>
        </main>

        {/* Enhanced Wallet Information */}
        <details className="mt-8 max-w-4xl w-full">
          <summary className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 cursor-pointer text-white font-semibold flex items-center gap-2 hover:bg-white/20 transition-colors">
            <span className="text-lg">💡</span>
            钱包信息与帮助
          </summary>
          <div className="mt-4">
            <WalletInfo />
          </div>
        </details>

        {/* Footer */}
        <footer className="mt-10 text-center text-white/70 text-sm">
          <p>© 2025 泡泡大作战. 基于 Monad 区块链构建.</p>
          <div className="flex justify-center gap-4 mt-3">
            <a href="#" className="hover:text-white transition-colors">🐦 Twitter</a>
            <a href="#" className="hover:text-white transition-colors">💬 Discord</a>
            <a href="#" className="hover:text-white transition-colors">📖 文档</a>
            <a href="/demo" className="hover:text-white transition-colors">🫧 泡泡演示</a>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default LoginPage
