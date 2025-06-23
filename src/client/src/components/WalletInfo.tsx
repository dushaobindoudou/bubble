import React from 'react'

interface WalletInfoProps {
  className?: string
}

export const WalletInfo: React.FC<WalletInfoProps> = ({ className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Supported Wallets */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🔗</span>
          支持的钱包
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2 text-white/90">
            <span className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center text-xs font-bold">M</span>
            <span>MetaMask</span>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <span className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-xs">🌈</span>
            <span>Rainbow</span>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <span className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center text-xs font-bold">C</span>
            <span>Coinbase</span>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <span className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-xs">🔗</span>
            <span>WalletConnect</span>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <span className="w-6 h-6 bg-blue-700 rounded-lg flex items-center justify-center text-xs font-bold">T</span>
            <span>Trust Wallet</span>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <span className="w-6 h-6 bg-gray-600 rounded-lg flex items-center justify-center text-xs">+</span>
            <span>更多钱包</span>
          </div>
        </div>
        
        <p className="text-white/70 text-xs mt-4">
          点击"连接钱包"查看完整的钱包列表，包括移动端钱包和硬件钱包选项
        </p>
      </div>

      {/* Network Information */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🌐</span>
          网络信息
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white/80">网络名称:</span>
            <span className="text-white font-semibold">Monad Testnet</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/80">Chain ID:</span>
            <span className="text-white font-semibold">10143</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/80">货币符号:</span>
            <span className="text-white font-semibold">MON</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/80">RPC URL:</span>
            <span className="text-white font-mono text-xs">testnet-rpc.monad.xyz</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
          <p className="text-blue-100 text-sm">
            <span className="font-semibold">💡 提示:</span> 如果您的钱包没有 Monad 测试网，系统会自动为您添加网络配置
          </p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          安全提醒
        </h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-0.5">✓</span>
            <span className="text-white/90">仅连接您信任的钱包应用</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-0.5">✓</span>
            <span className="text-white/90">确认钱包地址和网络设置</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-0.5">✓</span>
            <span className="text-white/90">测试网代币无实际价值</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 mt-0.5">⚠</span>
            <span className="text-white/90">请勿在测试网中使用真实资产</span>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🔗</span>
          快速链接
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a 
            href="https://metamask.io" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10 hover:border-white/20"
          >
            <span className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-sm font-bold">M</span>
            <div>
              <div className="text-white font-semibold text-sm">下载 MetaMask</div>
              <div className="text-white/70 text-xs">最受欢迎的Web3钱包</div>
            </div>
          </a>
          
          <a 
            href="https://testnet.monadexplorer.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10 hover:border-white/20"
          >
            <span className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-sm">🔍</span>
            <div>
              <div className="text-white font-semibold text-sm">Monad 浏览器</div>
              <div className="text-white/70 text-xs">查看交易和区块信息</div>
            </div>
          </a>
          
          <a 
            href="https://rainbow.me" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10 hover:border-white/20"
          >
            <span className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-sm">🌈</span>
            <div>
              <div className="text-white font-semibold text-sm">Rainbow 钱包</div>
              <div className="text-white/70 text-xs">现代化的移动端钱包</div>
            </div>
          </a>
          
          <a 
            href="https://www.coinbase.com/wallet" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10 hover:border-white/20"
          >
            <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold">C</span>
            <div>
              <div className="text-white font-semibold text-sm">Coinbase Wallet</div>
              <div className="text-white/70 text-xs">安全可靠的钱包选择</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
