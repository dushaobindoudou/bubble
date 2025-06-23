import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Button } from '../ui/Button'
import { toast } from 'react-hot-toast'
import { CONTRACT_ADDRESSES } from '../../config/contracts'

interface MarketplaceStats {
  totalListings: number
  totalSales: number
  totalVolume: string
  activeListings: number
  feePercentage: number
  feeRecipient: string
}

interface SupportedToken {
  address: string
  symbol: string
  name: string
  supported: boolean
}

export const MarketplaceManager: React.FC = () => {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'fees' | 'tokens' | 'nfts'>('overview')

  // Mock data - in real implementation, fetch from contract
  const [stats] = useState<MarketplaceStats>({
    totalListings: 156,
    totalSales: 89,
    totalVolume: '12,450.5',
    activeListings: 67,
    feePercentage: 250, // 2.5%
    feeRecipient: '0x20F49671A6f9ca3733363a90dDabA2234D98F716'
  })

  const [feeForm, setFeeForm] = useState({
    percentage: '250',
    recipient: '0x20F49671A6f9ca3733363a90dDabA2234D98F716'
  })

  const [supportedTokens] = useState<SupportedToken[]>([
    {
      address: CONTRACT_ADDRESSES.BubbleToken,
      symbol: 'BUB',
      name: 'Bubble Token',
      supported: true
    },
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      supported: false
    }
  ])

  const [tokenForm, setTokenForm] = useState({
    address: '',
    supported: true
  })

  const [nftForm, setNftForm] = useState({
    address: '',
    supported: true
  })

  const handleUpdateFees = async () => {
    try {
      setIsLoading(true)
      // TODO: Implement actual contract call
      // await marketplaceContract.setFeePercentage(feeForm.percentage)
      // await marketplaceContract.setFeeRecipient(feeForm.recipient)
      toast.success('手续费设置更新成功！')
    } catch (error) {
      console.error('Failed to update fees:', error)
      toast.error('更新手续费设置失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateTokenSupport = async () => {
    try {
      setIsLoading(true)
      // TODO: Implement actual contract call
      // await marketplaceContract.setSupportedPaymentToken(tokenForm.address, tokenForm.supported)
      toast.success(`代币支持状态更新成功！`)
      setTokenForm({ address: '', supported: true })
    } catch (error) {
      console.error('Failed to update token support:', error)
      toast.error('更新代币支持状态失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateNFTSupport = async () => {
    try {
      setIsLoading(true)
      // TODO: Implement actual contract call
      // await marketplaceContract.setSupportedNFTContract(nftForm.address, nftForm.supported)
      toast.success(`NFT合约支持状态更新成功！`)
      setNftForm({ address: '', supported: true })
    } catch (error) {
      console.error('Failed to update NFT support:', error)
      toast.error('更新NFT合约支持状态失败')
    } finally {
      setIsLoading(false)
    }
  }

  if (!address) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">🛒 市场管理</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔌</div>
          <div className="text-white/70">请先连接钱包</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">🛒 市场管理</h2>
          <p className="text-white/70">管理NFT交易市场的配置和设置</p>
        </div>
        <div className="text-sm text-white/60">
          合约地址: {CONTRACT_ADDRESSES.Marketplace}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 bg-white/5 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
        {[
          { id: 'overview', label: '概览', icon: '📊' },
          { id: 'fees', label: '手续费', icon: '💰' },
          { id: 'tokens', label: '支付代币', icon: '🪙' },
          { id: 'nfts', label: 'NFT合约', icon: '🎨' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl">📋</div>
              <div className="text-sm text-white/60">总挂单</div>
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalListings}</div>
            <div className="text-sm text-white/70">历史总数</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl">✅</div>
              <div className="text-sm text-white/60">成功交易</div>
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalSales}</div>
            <div className="text-sm text-white/70">已完成交易</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl">💎</div>
              <div className="text-sm text-white/60">交易量</div>
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalVolume}</div>
            <div className="text-sm text-white/70">BUB 代币</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl">🔥</div>
              <div className="text-sm text-white/60">活跃挂单</div>
            </div>
            <div className="text-2xl font-bold text-white">{stats.activeListings}</div>
            <div className="text-sm text-white/70">当前可购买</div>
          </div>
        </div>
      )}

      {/* Fees Tab */}
      {activeTab === 'fees' && (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-6">💰 手续费设置</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Settings */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-white">当前设置</h4>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70">手续费比例</span>
                  <span className="text-white font-medium">{stats.feePercentage / 100}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">手续费接收地址</span>
                  <span className="text-white font-mono text-sm">
                    {stats.feeRecipient.slice(0, 6)}...{stats.feeRecipient.slice(-4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Update Form */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-white">更新设置</h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    手续费比例 (基点, 250 = 2.5%)
                  </label>
                  <input
                    type="number"
                    value={feeForm.percentage}
                    onChange={(e) => setFeeForm({ ...feeForm, percentage: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="250"
                    min="0"
                    max="1000"
                  />
                  <div className="text-xs text-white/50 mt-1">
                    最大值: 1000 (10%)
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    手续费接收地址
                  </label>
                  <input
                    type="text"
                    value={feeForm.recipient}
                    onChange={(e) => setFeeForm({ ...feeForm, recipient: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                    placeholder="0x..."
                  />
                </div>

                <Button
                  onClick={handleUpdateFees}
                  disabled={isLoading}
                  variant="primary"
                  className="w-full"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : '更新手续费设置'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tokens Tab */}
      {activeTab === 'tokens' && (
        <div className="space-y-6">
          {/* Supported Tokens List */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-6">🪙 支持的支付代币</h3>

            <div className="space-y-3">
              {supportedTokens.map((token, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {token.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-medium">{token.name}</div>
                      <div className="text-white/60 text-sm font-mono">{token.address}</div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    token.supported
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {token.supported ? '✅ 支持' : '❌ 不支持'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add/Update Token Support */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-6">➕ 管理代币支持</h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  代币合约地址
                </label>
                <input
                  type="text"
                  value={tokenForm.address}
                  onChange={(e) => setTokenForm({ ...tokenForm, address: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  placeholder="0x..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  支持状态
                </label>
                <select
                  value={tokenForm.supported.toString()}
                  onChange={(e) => setTokenForm({ ...tokenForm, supported: e.target.value === 'true' })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="true">✅ 支持</option>
                  <option value="false">❌ 不支持</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleUpdateTokenSupport}
              disabled={isLoading || !tokenForm.address}
              variant="primary"
              className="mt-4"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : '更新代币支持状态'}
            </Button>
          </div>
        </div>
      )}

      {/* NFTs Tab */}
      {activeTab === 'nfts' && (
        <div className="space-y-6">
          {/* Supported NFT Contracts */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-6">🎨 支持的NFT合约</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    🎨
                  </div>
                  <div>
                    <div className="text-white font-medium">Bubble Skin NFT</div>
                    <div className="text-white/60 text-sm font-mono">{CONTRACT_ADDRESSES.BubbleSkinNFT}</div>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                  ✅ 支持
                </div>
              </div>
            </div>
          </div>

          {/* Add/Update NFT Contract Support */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-6">➕ 管理NFT合约支持</h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  NFT合约地址
                </label>
                <input
                  type="text"
                  value={nftForm.address}
                  onChange={(e) => setNftForm({ ...nftForm, address: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  placeholder="0x..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  支持状态
                </label>
                <select
                  value={nftForm.supported.toString()}
                  onChange={(e) => setNftForm({ ...nftForm, supported: e.target.value === 'true' })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="true">✅ 支持</option>
                  <option value="false">❌ 不支持</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleUpdateNFTSupport}
              disabled={isLoading || !nftForm.address}
              variant="primary"
              className="mt-4"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : '更新NFT合约支持状态'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
