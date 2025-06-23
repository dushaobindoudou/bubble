import React from 'react'
import { useAccount, useBalance } from 'wagmi'
import { useTokenBalance } from '../../hooks/useTokenBalance'
import { useNFTSkins } from '../../hooks/useNFTSkins'
import { CONTRACT_ADDRESSES, isContractDeployed } from '../../config/contracts'
import {
  getContractValidationSummary,
  detectContractChanges,
  getAllContractStatuses,
  getExplorerUrl,
  formatAddress
} from '../../utils/contractValidator'

export const ContractDebug: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { data: ethBalance } = useBalance({ address })
  const { balance: bubBalance, isLoading: bubLoading, error: bubError } = useTokenBalance()
  const { skins, isLoading: skinsLoading, error: skinsError } = useNFTSkins()

  // Get contract validation data
  const { validation, summary } = getContractValidationSummary()
  const contractChanges = detectContractChanges()
  const contractStatuses = getAllContractStatuses()

  if (!isConnected) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
        <h3 className="font-bold text-red-800">钱包未连接</h3>
        <p className="text-red-600">请连接钱包以测试合约集成功能</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">🔧 智能合约调试中心</h2>
        <p className="text-white/70">Monad 测试网合约集成状态监控</p>
      </div>

      {/* Wallet Info */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4">👛 钱包信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-white/60 text-sm">钱包地址</div>
            <div className="text-white font-mono text-sm bg-white/5 p-2 rounded">
              {formatAddress(address || '')}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-white/60 text-sm">MON 余额</div>
            <div className="text-white font-bold text-lg">
              {ethBalance?.formatted} {ethBalance?.symbol}
            </div>
          </div>
        </div>
      </div>

      {/* Contract Status Summary */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4">📊 合约部署概览</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-500/20 rounded-xl text-center border border-blue-500/30">
            <div className="text-3xl font-bold text-blue-400">{summary.total}</div>
            <div className="text-sm text-blue-300 mt-1">总合约数</div>
          </div>
          <div className="p-4 bg-green-500/20 rounded-xl text-center border border-green-500/30">
            <div className="text-3xl font-bold text-green-400">{summary.deployed}</div>
            <div className="text-sm text-green-300 mt-1">已部署</div>
          </div>
          <div className="p-4 bg-purple-500/20 rounded-xl text-center border border-purple-500/30">
            <div className="text-3xl font-bold text-purple-400">{summary.valid}</div>
            <div className="text-sm text-purple-300 mt-1">有效地址</div>
          </div>
          <div className="p-4 bg-orange-500/20 rounded-xl text-center border border-orange-500/30">
            <div className="text-3xl font-bold text-orange-400">{Object.keys(contractChanges).length}</div>
            <div className="text-sm text-orange-300 mt-1">地址变更</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/70">部署进度</span>
            <span className="text-white font-bold">{summary.deployed}/{summary.total}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(summary.deployed / summary.total) * 100}%` }}
            />
          </div>
          <div className="text-center">
            <span className="text-white/70 text-sm">
              {Math.round((summary.deployed / summary.total) * 100)}% 完成
            </span>
          </div>
        </div>
      </div>

      {/* Contract Details */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4">🏗️ 合约详细状态</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contractStatuses.map((contract) => (
            <div key={contract.name} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="text-white font-semibold">{contract.name}</div>
                <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                  contract.isDeployed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {contract.isDeployed ? '✅ 已部署' : '❌ 未部署'}
                </div>
              </div>
              <div className="text-xs text-white/60 font-mono mb-3 bg-white/5 p-2 rounded">
                {contract.address}
              </div>
              <a
                href={contract.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                🔍 在浏览器中查看
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Contract Integration Tests */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4">🧪 实时合约集成测试</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* BubbleToken Test */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h4 className="text-white font-semibold mb-3">🪙 BubbleToken 集成</h4>
            {bubLoading ? (
              <div className="text-yellow-400">正在加载 BUB 余额...</div>
            ) : bubError ? (
              <div className="p-3 bg-red-500/20 rounded border border-red-500/30">
                <div className="text-red-400 font-medium">❌ 集成错误</div>
                <div className="text-red-300 text-sm">{bubError}</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-green-500/20 rounded border border-green-500/30">
                  <div className="text-green-400 font-medium">✅ 集成成功</div>
                  <div className="text-white text-lg font-bold">{bubBalance} BUB</div>
                </div>
                <div className="text-xs text-white/60 font-mono bg-white/5 p-2 rounded">
                  {CONTRACT_ADDRESSES.BubbleToken}
                </div>
              </div>
            )}
          </div>

          {/* BubbleSkinNFT Test */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h4 className="text-white font-semibold mb-3">🎨 BubbleSkinNFT 集成</h4>
            {skinsLoading ? (
              <div className="text-yellow-400">正在加载 NFT 皮肤...</div>
            ) : skinsError ? (
              <div className="p-3 bg-red-500/20 rounded border border-red-500/30">
                <div className="text-red-400 font-medium">❌ 集成错误</div>
                <div className="text-red-300 text-sm">{skinsError}</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-green-500/20 rounded border border-green-500/30">
                  <div className="text-green-400 font-medium">✅ 集成成功</div>
                  <div className="text-white text-lg font-bold">{skins.length} 个 NFT 皮肤</div>
                </div>
                <div className="text-xs text-white/60 font-mono bg-white/5 p-2 rounded">
                  {CONTRACT_ADDRESSES.BubbleSkinNFT}
                </div>
                {skins.length > 0 && (
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {skins.map((skin) => (
                      <div key={skin.tokenId} className="text-xs bg-white/5 p-2 rounded">
                        <div className="text-white">#{skin.tokenId}: {skin.name}</div>
                        <div className="text-white/60">{skin.rarity} • {skin.effectType}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Network Information */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4">🌐 网络配置信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-500/20 rounded-xl border border-blue-500/30">
            <div className="text-blue-300 text-sm mb-1">链 ID</div>
            <div className="text-white font-bold text-lg">10143</div>
            <div className="text-blue-200 text-xs">Monad Testnet</div>
          </div>
          <div className="p-4 bg-green-500/20 rounded-xl border border-green-500/30">
            <div className="text-green-300 text-sm mb-1">RPC 节点</div>
            <div className="text-white font-mono text-xs break-all">
              https://testnet-rpc.monad.xyz
            </div>
          </div>
          <div className="p-4 bg-orange-500/20 rounded-xl border border-orange-500/30">
            <div className="text-orange-300 text-sm mb-1">区块浏览器</div>
            <a
              href="https://testnet.monadexplorer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-orange-200 font-mono text-xs break-all underline"
            >
              testnet.monadexplorer.com
            </a>
          </div>
        </div>
      </div>

      {/* Testing Guide */}
      <div className="bg-blue-500/10 rounded-2xl p-6 border border-blue-500/30">
        <h3 className="text-xl font-semibold text-white mb-4">📋 测试指南</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Test Steps */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold">⚡ 快速测试步骤</h4>
            <div className="space-y-2">
              {[
                '确保连接到 Monad 测试网 (Chain ID: 10143)',
                '检查所有合约显示为"已部署"状态',
                '验证 BUB 代币余额正确显示',
                '确认 NFT 皮肤正常加载',
                '查看是否有错误信息显示'
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-2 bg-white/5 rounded">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="text-white/80 text-sm">{step}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Expected Results */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold">✅ 预期结果</h4>
            <div className="space-y-2">
              {[
                `${summary.deployed}/${summary.total} 合约显示已部署`,
                'BUB 代币余额正常显示',
                'NFT 皮肤正常加载',
                '实时数据更新正常工作',
                '无合约调用错误'
              ].map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-2 bg-white/5 rounded">
                  <div className="text-green-400">✓</div>
                  <div className="text-white/80 text-sm">{result}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-6 p-4 bg-orange-500/20 rounded-xl border border-orange-500/30">
          <h4 className="text-orange-300 font-semibold mb-2">⚠️ 重要提醒</h4>
          <ul className="text-orange-200 text-sm space-y-1">
            <li>• 由于合约地址更新，之前的数据可能不可用</li>
            <li>• 如果遇到问题，请清理浏览器缓存后重试</li>
            <li>• 确保钱包已正确切换到 Monad 测试网</li>
            <li>• 新部署的合约可能需要时间同步数据</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
