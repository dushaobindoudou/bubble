import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { useTokenAdmin } from '../../hooks/useTokenAdmin'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Button } from '../ui/Button'
import { toast } from 'react-hot-toast'

export const TokenManager: React.FC = () => {
  const { address } = useAccount()
  const {
    tokenStats,
    allocationData,
    mintHistory,
    transferHistory,
    quickMintAmounts,
    hasGameRewardRole,
    hasAdminRole,
    canMint,
    isLoading,
    isMinting,
    isBurning,
    isTransferring,
    isPausing,
    isUnpausing,
    error,
    mintToAddress,
    burnTokens,
    transferTokens,
    pauseToken,
    unpauseToken,
    batchMint,
    refreshData,
    releaseTeamTokens,
    releaseCommunityTokens,
    releaseLiquidityTokens,
    setDailyRewardLimit,
    mintGameRewardsBatch,
  } = useTokenAdmin()

  const [showMintModal, setShowMintModal] = useState(false)
  const [showBurnModal, setShowBurnModal] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [showHolderModal, setShowHolderModal] = useState(false)
  const [showAllocationModal, setShowAllocationModal] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)

  const [mintForm, setMintForm] = useState({
    to: '',
    amount: '',
    reason: '',
  })

  const [transferForm, setTransferForm] = useState({
    from: '',
    to: '',
    amount: '',
    reason: '',
  })

  const [burnAmount, setBurnAmount] = useState('')
  const [batchOperations, setBatchOperations] = useState([
    { to: '', amount: '' }
  ])

  const [holderAddress, setHolderAddress] = useState('')

  const [allocationForm, setAllocationForm] = useState({
    type: 'team', // 'team', 'community', 'liquidity'
    to: '',
    amount: ''
  })

  const [limitForm, setLimitForm] = useState({
    newLimit: ''
  })

  const handleMint = async () => {
    try {
      await mintToAddress(mintForm.to, mintForm.amount, mintForm.reason)
      toast.success(`成功铸造 ${mintForm.amount} BUB 代币`)
      setShowMintModal(false)
      setMintForm({ to: '', amount: '', reason: '' })
    } catch (err) {
      toast.error('铸造失败，请重试')
    }
  }

  const handleBurn = async () => {
    try {
      await burnTokens(burnAmount)
      toast.success(`成功销毁 ${burnAmount} BUB 代币`)
      setShowBurnModal(false)
      setBurnAmount('')
    } catch (err) {
      toast.error('销毁失败，请重试')
    }
  }

  const handleTransfer = async () => {
    try {
      await transferTokens(transferForm.from, transferForm.to, transferForm.amount, transferForm.reason)
      toast.success(`成功转账 ${transferForm.amount} BUB 代币`)
      setShowTransferModal(false)
      setTransferForm({ from: '', to: '', amount: '', reason: '' })
    } catch (err) {
      toast.error('转账失败，请重试')
    }
  }

  const handlePause = async () => {
    try {
      await pauseToken()
      toast.success('代币已暂停')
      setShowPauseModal(false)
    } catch (err) {
      toast.error('暂停失败，请重试')
    }
  }

  const handleUnpause = async () => {
    try {
      await unpauseToken()
      toast.success('代币已恢复')
      setShowPauseModal(false)
    } catch (err) {
      toast.error('恢复失败，请重试')
    }
  }

  const handleBatchMint = async () => {
    const validOperations = batchOperations.filter(op => op.to && op.amount)
    if (validOperations.length === 0) {
      toast.error('请至少添加一个有效的铸造操作')
      return
    }

    try {
      // Use the new batch contract method for better efficiency
      const players = validOperations.map(op => op.to)
      const amounts = validOperations.map(op => op.amount)
      const reason = 'Batch mint operation from admin panel'

      await mintGameRewardsBatch(players, amounts, reason)
      toast.success(`成功批量铸造 ${validOperations.length} 个操作`)
      setShowBatchModal(false)
      setBatchOperations([{ to: '', amount: '' }])
    } catch (err) {
      console.error('Batch mint failed:', err)
      // Fallback to individual minting if batch fails
      try {
        await batchMint(validOperations)
        toast.success(`成功批量铸造 ${validOperations.length} 个操作 (使用备用方法)`)
        setShowBatchModal(false)
        setBatchOperations([{ to: '', amount: '' }])
      } catch (fallbackErr) {
        toast.error('批量铸造失败，请重试')
      }
    }
  }

  const addBatchOperation = () => {
    setBatchOperations(prev => [...prev, { to: '', amount: '' }])
  }

  const removeBatchOperation = (index: number) => {
    setBatchOperations(prev => prev.filter((_, i) => i !== index))
  }

  const updateBatchOperation = (index: number, field: 'to' | 'amount', value: string) => {
    setBatchOperations(prev => prev.map((op, i) =>
      i === index ? { ...op, [field]: value } : op
    ))
  }

  const handleReleaseTokens = async () => {
    try {
      switch (allocationForm.type) {
        case 'team':
          await releaseTeamTokens(allocationForm.to, allocationForm.amount)
          break
        case 'community':
          await releaseCommunityTokens(allocationForm.to, allocationForm.amount)
          break
        case 'liquidity':
          await releaseLiquidityTokens(allocationForm.to, allocationForm.amount)
          break
      }
      toast.success(`成功释放${allocationForm.type === 'team' ? '团队' : allocationForm.type === 'community' ? '社区' : '流动性'}代币`)
      setShowAllocationModal(false)
      setAllocationForm({ type: 'team', to: '', amount: '' })
    } catch (error) {
      console.error('Failed to release tokens:', error)
      toast.error('释放代币失败')
    }
  }

  const handleSetDailyLimit = async () => {
    try {
      await setDailyRewardLimit(limitForm.newLimit)
      toast.success('每日奖励限制更新成功！')
      setShowLimitModal(false)
      setLimitForm({ newLimit: '' })
    } catch (error) {
      console.error('Failed to set daily limit:', error)
      toast.error('设置每日限制失败')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">🪙 代币管理</h2>
          <p className="text-white/70">管理 BUB 代币的铸造、销毁和分发</p>
          {!canMint && (
            <div className="mt-2 p-3 bg-red-500/20 rounded-xl border border-red-500/30">
              <div className="text-red-300 text-sm font-medium mb-2">
                ⚠️ 权限不足 - 无法执行铸造操作
              </div>
              <div className="text-red-200 text-xs space-y-1">
                <div>• 需要权限: GAME_REWARD_ROLE (游戏奖励角色) 或 ADMIN_ROLE (管理员角色)</div>
                <div>• 解决方案: 前往"权限管理"页面申请权限</div>
                <div>• 您的地址: {address?.slice(0, 6)}...{address?.slice(-4)}</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button onClick={refreshData} variant="ghost" disabled={isLoading}>
            🔄 刷新数据
          </Button>
        </div>
      </div>

      {/* Enhanced Token Statistics */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">📊 代币统计</h3>
        {tokenStats ? (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                <div className="text-blue-300 text-sm mb-1">代币名称</div>
                <div className="text-white font-bold text-lg">{tokenStats.name}</div>
              </div>
              <div className="p-4 bg-green-500/20 rounded-2xl border border-green-500/30">
                <div className="text-green-300 text-sm mb-1">代币符号</div>
                <div className="text-white font-bold text-lg">{tokenStats.symbol}</div>
              </div>
              <div className="p-4 bg-purple-500/20 rounded-2xl border border-purple-500/30">
                <div className="text-purple-300 text-sm mb-1">小数位数</div>
                <div className="text-white font-bold text-lg">{tokenStats.decimals}</div>
              </div>
              <div className="p-4 bg-orange-500/20 rounded-2xl border border-orange-500/30">
                <div className="text-orange-300 text-sm mb-1">总供应量</div>
                <div className="text-white font-bold text-lg">{parseFloat(tokenStats.totalSupply).toLocaleString()} BUB</div>
              </div>
            </div>

            {/* Advanced Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-cyan-500/20 rounded-2xl border border-cyan-500/30">
                <div className="text-cyan-300 text-sm mb-1">合约所有者</div>
                <div className="text-white font-mono text-xs break-all">{tokenStats.owner}</div>
              </div>
              <div className="p-4 bg-yellow-500/20 rounded-2xl border border-yellow-500/30">
                <div className="text-yellow-300 text-sm mb-1">合约状态</div>
                <div className={`text-lg font-bold ${tokenStats.paused ? 'text-red-400' : 'text-green-400'}`}>
                  {tokenStats.paused ? '⏸️ 已暂停' : '▶️ 正常运行'}
                </div>
              </div>
              <div className="p-4 bg-pink-500/20 rounded-2xl border border-pink-500/30">
                <div className="text-pink-300 text-sm mb-1">铸造历史</div>
                <div className="text-white font-bold text-lg">{mintHistory.length} 次操作</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <LoadingSpinner size="md" />
            <div className="text-white/70 mt-2">加载代币信息中...</div>
          </div>
        )}
      </div>

      {/* Token Allocation Statistics */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">🏦 代币分配统计</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl border border-blue-500/30">
            <div className="text-blue-300 text-sm mb-1">游戏奖励池</div>
            <div className="text-white font-bold text-lg">
              {parseFloat(allocationData.remainingGameRewards).toLocaleString()} BUB
            </div>
            <div className="text-blue-200 text-xs">剩余可用</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/30">
            <div className="text-purple-300 text-sm mb-1">团队代币</div>
            <div className="text-white font-bold text-lg">
              {parseFloat(allocationData.remainingTeamTokens).toLocaleString()} BUB
            </div>
            <div className="text-purple-200 text-xs">剩余可释放</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-2xl border border-green-500/30">
            <div className="text-green-300 text-sm mb-1">社区代币</div>
            <div className="text-white font-bold text-lg">
              {parseFloat(allocationData.remainingCommunityTokens).toLocaleString()} BUB
            </div>
            <div className="text-green-200 text-xs">剩余可释放</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl border border-orange-500/30">
            <div className="text-orange-300 text-sm mb-1">流动性代币</div>
            <div className="text-white font-bold text-lg">
              {parseFloat(allocationData.remainingLiquidityTokens).toLocaleString()} BUB
            </div>
            <div className="text-orange-200 text-xs">剩余可释放</div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">今日剩余奖励额度</span>
            <span className="text-white font-medium">
              {parseFloat(allocationData.todayRemainingRewards).toLocaleString()} BUB
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-white/70">状态</span>
            <span className="text-green-400 font-medium">
              {parseFloat(allocationData.todayRemainingRewards) > 0 ? '可用' : '已用完'}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">⚡ 快速操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            onClick={() => setShowMintModal(true)}
            variant="primary"
            className="p-6 h-auto flex-col gap-2"
            disabled={!canMint}
          >
            <div className="text-2xl">🪙</div>
            <div className="font-semibold">铸造代币</div>
            <div className="text-sm opacity-80">
              {canMint ? '为指定地址铸造 BUB 代币' : '需要铸造权限'}
            </div>
          </Button>

          <Button
            onClick={() => setShowBatchModal(true)}
            variant="primary"
            className="p-6 h-auto flex-col gap-2"
            disabled={!canMint}
          >
            <div className="text-2xl">📦</div>
            <div className="font-semibold">批量铸造</div>
            <div className="text-sm opacity-80">
              {canMint ? '批量为多个地址铸造代币' : '需要铸造权限'}
            </div>
          </Button>

          <Button
            onClick={() => setShowTransferModal(true)}
            variant="primary"
            className="p-6 h-auto flex-col gap-2"
          >
            <div className="text-2xl">💸</div>
            <div className="font-semibold">管理员转账</div>
            <div className="text-sm opacity-80">在地址间转移代币</div>
          </Button>

          <Button
            onClick={() => setShowBurnModal(true)}
            variant="ghost"
            className="p-6 h-auto flex-col gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/20"
          >
            <div className="text-2xl">🔥</div>
            <div className="font-semibold">销毁代币</div>
            <div className="text-sm opacity-80">从自己账户销毁代币</div>
          </Button>

          <Button
            onClick={() => setShowPauseModal(true)}
            variant="ghost"
            className={`p-6 h-auto flex-col gap-2 border ${
              tokenStats?.paused
                ? 'border-green-500/30 text-green-400 hover:bg-green-500/20'
                : 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
            }`}
          >
            <div className="text-2xl">{tokenStats?.paused ? '▶️' : '⏸️'}</div>
            <div className="font-semibold">{tokenStats?.paused ? '恢复合约' : '暂停合约'}</div>
            <div className="text-sm opacity-80">{tokenStats?.paused ? '恢复代币转账功能' : '暂停所有代币操作'}</div>
          </Button>

          <Button
            onClick={() => setShowHolderModal(true)}
            variant="ghost"
            className="p-6 h-auto flex-col gap-2 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
          >
            <div className="text-2xl">👥</div>
            <div className="font-semibold">持有者查询</div>
            <div className="text-sm opacity-80">查看地址代币余额</div>
          </Button>

          <Button
            onClick={() => setShowAllocationModal(true)}
            variant="ghost"
            className="p-6 h-auto flex-col gap-2 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
            disabled={!hasAdminRole}
          >
            <div className="text-2xl">🏦</div>
            <div className="font-semibold">代币分配</div>
            <div className="text-sm opacity-80">
              {hasAdminRole ? '释放团队/社区/流动性代币' : '需要管理员权限'}
            </div>
          </Button>

          <Button
            onClick={() => setShowLimitModal(true)}
            variant="ghost"
            className="p-6 h-auto flex-col gap-2 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
            disabled={!hasAdminRole}
          >
            <div className="text-2xl">⏱️</div>
            <div className="font-semibold">每日限制</div>
            <div className="text-sm opacity-80">
              {hasAdminRole ? '设置每日奖励限制' : '需要管理员权限'}
            </div>
          </Button>
        </div>
      </div>

      {/* Quick Mint Amounts */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">🎯 快速铸造金额</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {quickMintAmounts.map((preset) => (
            <Button
              key={preset.amount}
              onClick={() => {
                setMintForm(prev => ({ ...prev, amount: preset.amount }))
                setShowMintModal(true)
              }}
              variant="ghost"
              className="p-4 flex-col gap-1"
              disabled={!canMint}
            >
              <div className="font-bold">{preset.label}</div>
              <div className="text-xs opacity-70">{preset.amount} BUB</div>
            </Button>
          ))}
        </div>
      </div>

      {/* Mint History */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">📜 铸造历史</h3>
        {mintHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📝</div>
            <div className="text-white/70">暂无铸造记录</div>
          </div>
        ) : (
          <div className="space-y-3">
            {mintHistory.slice(0, 5).map((operation, index) => (
              <div key={index} className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-white font-medium">
                      铸造 {operation.amount} BUB 到 {operation.to.slice(0, 6)}...{operation.to.slice(-4)}
                    </div>
                    {operation.reason && (
                      <div className="text-white/60 text-sm">{operation.reason}</div>
                    )}
                  </div>
                  <div className="text-green-400 text-sm">✅ 完成</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mint Modal */}
      {showMintModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">🪙 铸造代币</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">接收地址</label>
                <input
                  type="text"
                  value={mintForm.to}
                  onChange={(e) => setMintForm(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="0x..."
                />
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-2">数量 (BUB)</label>
                <input
                  type="number"
                  value={mintForm.amount}
                  onChange={(e) => setMintForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="100"
                />
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-2">备注 (可选)</label>
                <input
                  type="text"
                  value={mintForm.reason}
                  onChange={(e) => setMintForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="铸造原因..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowMintModal(false)}
                variant="ghost"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleMint}
                variant="primary"
                className="flex-1"
                disabled={isMinting || !mintForm.to || !mintForm.amount}
              >
                {isMinting ? <LoadingSpinner size="sm" /> : '铸造'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">� 管理员转账</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">发送方地址</label>
                <input
                  type="text"
                  value={transferForm.from}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="0x..."
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">接收方地址</label>
                <input
                  type="text"
                  value={transferForm.to}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="0x..."
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">转账数量 (BUB)</label>
                <input
                  type="number"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">备注 (可选)</label>
                <input
                  type="text"
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="转账原因..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowTransferModal(false)}
                variant="ghost"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleTransfer}
                variant="primary"
                className="flex-1"
                disabled={isTransferring || !transferForm.from || !transferForm.to || !transferForm.amount}
              >
                {isTransferring ? <LoadingSpinner size="sm" /> : '确认转账'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Burn Modal */}
      {showBurnModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">🔥 销毁代币</h3>

            <div className="space-y-4">
              <div className="p-4 bg-red-500/20 rounded-xl border border-red-500/30">
                <div className="text-red-300 text-sm">
                  ⚠️ 警告：销毁的代币将永久从总供应量中移除，此操作不可逆转。
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">销毁数量 (BUB)</label>
                <input
                  type="number"
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="100"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowBurnModal(false)}
                variant="ghost"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleBurn}
                variant="ghost"
                className="flex-1 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                disabled={isBurning || !burnAmount}
              >
                {isBurning ? <LoadingSpinner size="sm" /> : '确认销毁'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pause/Unpause Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              {tokenStats?.paused ? '▶️ 恢复合约' : '⏸️ 暂停合约'}
            </h3>

            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${
                tokenStats?.paused
                  ? 'bg-green-500/20 border-green-500/30'
                  : 'bg-yellow-500/20 border-yellow-500/30'
              }`}>
                <div className={`text-sm ${
                  tokenStats?.paused ? 'text-green-300' : 'text-yellow-300'
                }`}>
                  {tokenStats?.paused
                    ? '⚠️ 恢复合约将允许所有代币转账和操作继续进行。'
                    : '⚠️ 暂停合约将停止所有代币转账和操作，只有管理员可以恢复。'
                  }
                </div>
              </div>

              <div className="text-white/70 text-sm">
                当前状态: <span className={`font-bold ${tokenStats?.paused ? 'text-red-400' : 'text-green-400'}`}>
                  {tokenStats?.paused ? '已暂停' : '正常运行'}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowPauseModal(false)}
                variant="ghost"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={tokenStats?.paused ? handleUnpause : handlePause}
                variant="primary"
                className="flex-1"
                disabled={isPausing || isUnpausing}
              >
                {(isPausing || isUnpausing) ? <LoadingSpinner size="sm" /> :
                  (tokenStats?.paused ? '确认恢复' : '确认暂停')
                }
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Holder Balance Modal */}
      {showHolderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">👥 持有者查询</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">钱包地址</label>
                <input
                  type="text"
                  value={holderAddress}
                  onChange={(e) => setHolderAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="0x..."
                />
              </div>

              <div className="p-4 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <div className="text-blue-300 text-sm mb-1">查询结果</div>
                <div className="text-white font-bold text-lg">
                  {holderAddress ? '0 BUB' : '请输入地址'}
                </div>
                <div className="text-blue-200 text-xs mt-1">
                  {holderAddress ? '占总供应量 0%' : ''}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowHolderModal(false)
                  setHolderAddress('')
                }}
                variant="ghost"
                className="flex-1"
              >
                关闭
              </Button>
              <Button
                onClick={() => {
                  // Implement balance query logic here
                  toast('余额查询功能开发中...', { icon: 'ℹ️' })
                }}
                variant="primary"
                className="flex-1"
                disabled={!holderAddress}
              >
                查询余额
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Token Allocation Modal */}
      {showAllocationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">🏦 代币分配</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">分配类型</label>
                <select
                  value={allocationForm.type}
                  onChange={(e) => setAllocationForm(prev => ({ ...prev, type: e.target.value as 'team' | 'community' | 'liquidity' }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                >
                  <option value="team">团队代币</option>
                  <option value="community">社区代币</option>
                  <option value="liquidity">流动性代币</option>
                </select>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">接收地址</label>
                <input
                  type="text"
                  value={allocationForm.to}
                  onChange={(e) => setAllocationForm(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="0x..."
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">释放数量 (BUB)</label>
                <input
                  type="number"
                  value={allocationForm.amount}
                  onChange={(e) => setAllocationForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="1000"
                />
              </div>

              <div className="p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
                <div className="text-yellow-300 text-sm">
                  ⚠️ 注意：此操作将从预分配池中释放代币，请确认接收地址和数量正确。
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowAllocationModal(false)}
                variant="ghost"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleReleaseTokens}
                variant="primary"
                className="flex-1"
                disabled={!allocationForm.to || !allocationForm.amount}
              >
                释放代币
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">⏱️ 每日奖励限制</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">新的每日限制 (BUB)</label>
                <input
                  type="number"
                  value={limitForm.newLimit}
                  onChange={(e) => setLimitForm({ newLimit: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="10000"
                />
              </div>

              <div className="p-4 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <div className="text-blue-300 text-sm mb-1">今日剩余额度</div>
                <div className="text-white font-bold">
                  {parseFloat(allocationData.todayRemainingRewards).toLocaleString()} BUB
                </div>
                <div className="text-blue-200 text-xs mt-1">
                  状态: {parseFloat(allocationData.todayRemainingRewards) > 0 ? '可用' : '已用完'}
                </div>
              </div>

              <div className="p-4 bg-orange-500/20 rounded-xl border border-orange-500/30">
                <div className="text-orange-300 text-sm">
                  💡 提示：每日奖励限制用于控制游戏奖励的发放速度，防止代币通胀过快。
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowLimitModal(false)}
                variant="ghost"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleSetDailyLimit}
                variant="primary"
                className="flex-1"
                disabled={!limitForm.newLimit}
              >
                更新限制
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/20 rounded-2xl border border-red-500/30">
          <div className="text-red-400 font-medium">错误</div>
          <div className="text-red-300 text-sm">{error}</div>
        </div>
      )}
    </div>
  )
}
