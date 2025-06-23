import React, { useState, useEffect } from 'react'
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { parseEther, formatEther, formatGwei } from 'viem'
import { toast } from 'react-hot-toast'
import { NFTSkin } from '../../hooks/useNFTSkins'
import { useMarketplace } from '../../hooks/useMarketplace'
import { useTokenBalance } from '../../hooks/useTokenBalance'
import { EnhancedContentPreview } from '../ui/EnhancedContentPreview'
import { Button } from '../ui/Button'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { CONTRACT_ADDRESSES } from '../../config/contracts'
import { BubbleSkinNFTABI, MarketplaceABI } from '../../config/contracts'

interface SellNFTDialogProps {
  nft: NFTSkin
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const SellNFTDialog: React.FC<SellNFTDialogProps> = ({
  nft,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { address } = useAccount()
  const { feePercentage, calculateFee, formatPrice } = useMarketplace()
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState(7) // 默认7天
  const [isApproving, setIsApproving] = useState(false)
  const [isListing, setIsListing] = useState(false)
  const [needsApproval, setNeedsApproval] = useState(true)


  // 检查 NFT 授权状态 - 减少轮询频率
  const { data: isApprovedForAll } = useContractRead({
    address: CONTRACT_ADDRESSES.BubbleSkinNFT as `0x${string}`,
    abi: BubbleSkinNFTABI,
    functionName: 'isApprovedForAll',
    args: [address, CONTRACT_ADDRESSES.Marketplace],
    enabled: !!address,
    cacheTime: 60_000, // 缓存1分钟
    staleTime: 30_000,
  })

  const { data: approvedAddress } = useContractRead({
    address: CONTRACT_ADDRESSES.BubbleSkinNFT as `0x${string}`,
    abi: BubbleSkinNFTABI,
    functionName: 'getApproved',
    args: [parseInt(nft.tokenId)],
    enabled: !!nft.tokenId,
    cacheTime: 60_000,
    staleTime: 30_000,
  })

  // 授权 NFT
  const { config: approveConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESSES.BubbleSkinNFT as `0x${string}`,
    abi: BubbleSkinNFTABI,
    functionName: 'setApprovalForAll',
    args: [CONTRACT_ADDRESSES.Marketplace, true],
    enabled: needsApproval,
  })

  const { write: approveWrite, isLoading: isApproveTxLoading } = useContractWrite({
    ...approveConfig,
    onSuccess: (data) => {
      console.log('Approve transaction sent:', data.hash)
      toast.success('授权交易已提交，请等待确认...')
    },
    onError: (error) => {
      console.error('Approve error:', error)
      toast.error('授权失败：' + error.message)
      setIsApproving(false)
    },
  })

  // 调试信息
  console.log('SellNFTDialog Debug Info:', {
    address,
    needsApproval,
    isApprovedForAll,
    approvedAddress,
    approveConfig,
    approveWrite: !!approveWrite,
    contractAddresses: CONTRACT_ADDRESSES,
    nftTokenId: nft.tokenId,
  })

  // 上架 NFT
  const { config: listConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESSES.Marketplace as `0x${string}`,
    abi: MarketplaceABI.abi,
    functionName: 'listNFT',
    args: price && !needsApproval && parseFloat(price) > 0 ? [
      CONTRACT_ADDRESSES.BubbleSkinNFT,
      BigInt(parseInt(nft.tokenId)),
      CONTRACT_ADDRESSES.BubbleToken,
      parseEther(price),
      BigInt(duration * 24 * 60 * 60) // 转换为秒
    ] : [],
    enabled: !!price && !needsApproval && parseFloat(price) > 0,
  })

  const { write: listWrite, isLoading: isListTxLoading } = useContractWrite({
    ...listConfig,
    onSuccess: (data) => {
      console.log('List transaction sent:', data.hash)
      toast.success('上架交易已提交，请等待确认...')
      setIsListing(false)
      onSuccess?.()
      onClose()
    },
    onError: (error) => {
      console.error('List error:', error)
      toast.error('上架失败：' + error.message)
      setIsListing(false)
    },
  })

  // 检查授权状态
  useEffect(() => {
    if (isApprovedForAll || approvedAddress === CONTRACT_ADDRESSES.Marketplace) {
      setNeedsApproval(false)
      setIsApproving(false)
    } else {
      setNeedsApproval(true)
    }
  }, [isApprovedForAll, approvedAddress])

  // 监听授权交易状态
  useEffect(() => {
    if (isApproveTxLoading) {
      setIsApproving(true)
    }
  }, [isApproveTxLoading])

  // 监听上架交易状态
  useEffect(() => {
    if (isListTxLoading) {
      setIsListing(true)
    }
  }, [isListTxLoading])



  const handleApprove = async () => {
    console.log('handleApprove called', {
      approveWrite: !!approveWrite,
      address,
      needsApproval,
      approveConfig,
      contractAddresses: CONTRACT_ADDRESSES,
    })

    if (!approveWrite) {
      console.error('approveWrite is not available:', {
        approveConfig,
        needsApproval,
        address,
        contractAddress: CONTRACT_ADDRESSES.BubbleSkinNFT,
        marketplaceAddress: CONTRACT_ADDRESSES.Marketplace,
      })
      toast.error('授权功能未准备就绪。请检查：1) 钱包已连接 2) 网络正确 3) NFT 确实需要授权')
      return
    }

    if (!address) {
      toast.error('请先连接钱包')
      return
    }

    try {
      setIsApproving(true)
      console.log('Calling approveWrite...')
      approveWrite()
    } catch (error: any) {
      console.error('Approve error:', error)
      setIsApproving(false)

      if (error.code === 4001) {
        toast.error('用户取消了授权交易')
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('余额不足，无法支付 gas 费用')
      } else {
        toast.error('授权失败：' + (error.message || '未知错误'))
      }
    }
  }

  const handleList = async () => {
    if (!listWrite) {
      toast.error('上架功能未准备就绪，请检查网络连接')
      return
    }

    if (!price || parseFloat(price) <= 0) {
      toast.error('请输入有效的价格（大于 0）')
      return
    }

    if (parseFloat(price) > 1000000) {
      toast.error('价格过高，请输入合理的价格')
      return
    }

    if (duration < 1 || duration > 30) {
      toast.error('挂单时长必须在 1-30 天之间')
      return
    }

    try {
      setIsListing(true)
      listWrite?.()
    } catch (error: any) {
      console.error('List error:', error)
      setIsListing(false)

      if (error.code === 4001) {
        toast.error('用户取消了上架交易')
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('余额不足，无法支付 gas 费用')
      } else if (error.message?.includes('not approved')) {
        toast.error('NFT 未授权，请先完成授权')
        setNeedsApproval(true)
      } else {
        toast.error('上架失败：' + (error.message || '未知错误'))
      }
    }
  }

  const calculateNetAmount = () => {
    if (!price) return '0'
    try {
      const priceInWei = parseEther(price)
      const fee = calculateFee(priceInWei)
      const netAmount = priceInWei - fee
      return formatEther(netAmount)
    } catch (error) {
      console.error('Error calculating net amount:', error)
      return '0'
    }
  }

  const calculateFeeAmount = () => {
    if (!price) return '0'
    try {
      const priceInWei = parseEther(price)
      const fee = calculateFee(priceInWei)
      return formatEther(fee)
    } catch (error) {
      console.error('Error calculating fee amount:', error)
      return '0'
    }
  }



  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">出售 NFT</h3>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* NFT 预览 */}
          <div className="space-y-4">
            <div className="aspect-square bg-white/5 rounded-2xl overflow-hidden">
              <EnhancedContentPreview
                content={nft.content}
                templateName={nft.name}
                templateId={nft.templateId}
                size="lg"
                showLabel={true}
                enableFullView={false}
              />
            </div>
            
            <div className="text-center">
              <h4 className="text-lg font-bold text-white">{nft.name}</h4>
              <p className="text-white/70 text-sm">Token ID: #{nft.tokenId}</p>
            </div>
          </div>

          {/* 价格设置 */}
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">设置价格 (BUB)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="输入价格"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">挂单时长</label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
              >
                <option value={1}>1 天</option>
                <option value={3}>3 天</option>
                <option value={7}>7 天</option>
                <option value={14}>14 天</option>
                <option value={30}>30 天</option>
              </select>
            </div>
          </div>

          {/* 费用明细 */}
          {price && (
            <div className="bg-black/20 rounded-xl p-4 space-y-3">
              <div className="text-white font-semibold text-sm mb-2">💰 费用明细</div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">售价:</span>
                  <span className="text-white font-medium">{price} BUB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">手续费 ({(feePercentage / 100).toFixed(1)}%):</span>
                  <span className="text-red-400 font-medium">-{calculateFeeAmount()} BUB</span>
                </div>

                {/* Gas 费用提示 */}
                <div className="border-t border-white/10 pt-2">
                  <div className="text-white/70 text-xs mb-1">⛽ Gas 费用:</div>
                  <div className="text-yellow-400 text-xs">
                    {needsApproval ? '需要支付授权和上架两笔交易的 gas 费用' : '需要支付上架交易的 gas 费用'}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-2">
                  <div className="flex justify-between">
                    <span className="text-white font-semibold">您将获得:</span>
                    <span className="text-green-400 font-bold">{calculateNetAmount()} BUB</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="space-y-3">
            {needsApproval ? (
              <div className="space-y-2">
                <Button
                  onClick={handleApprove}
                  variant="primary"
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  loading={isApproving}
                  disabled={!address || !approveWrite}
                >
                  {isApproving ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">授权中...</span>
                    </>
                  ) : (
                    '🔓 授权 NFT'
                  )}
                </Button>

                {/* 调试信息 */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-white/50 bg-black/20 rounded p-2">
                    <div>钱包: {address ? '✅' : '❌'}</div>
                    <div>需要授权: {needsApproval ? '✅' : '❌'}</div>
                    <div>授权函数: {approveWrite ? '✅' : '❌'}</div>
                    <div>全局授权: {isApprovedForAll ? '✅' : '❌'}</div>
                    <div>单独授权: {approvedAddress === CONTRACT_ADDRESSES.Marketplace ? '✅' : '❌'}</div>
                  </div>
                )}

                <div className="text-center text-xs text-white/60">
                  需要先授权 NFT 才能上架出售
                </div>

                {!approveWrite && (
                  <div className="text-center text-xs text-red-400">
                    ⚠️ 授权功能未就绪，请检查钱包连接和网络
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={handleList}
                  variant="primary"
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  loading={isListing}
                  disabled={!price || parseFloat(price) <= 0 || parseFloat(price) > 1000000}
                >
                  {isListing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">上架中...</span>
                    </>
                  ) : (
                    '🏷️ 确认上架'
                  )}
                </Button>
                {(!price || parseFloat(price) <= 0) && (
                  <div className="text-center text-xs text-red-400">
                    请输入有效的价格
                  </div>
                )}
                {price && parseFloat(price) > 1000000 && (
                  <div className="text-center text-xs text-red-400">
                    价格过高，请输入合理的价格
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={onClose}
              variant="secondary"
              className="w-full"
              disabled={isApproving || isListing}
            >
              {isApproving || isListing ? '处理中...' : '取消'}
            </Button>
          </div>

          {/* 提示信息 */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="text-blue-400 text-xs">
              <div className="font-semibold mb-2 flex items-center">
                <span className="text-lg mr-1">💡</span>
                <span>重要提示</span>
              </div>
              <div className="space-y-2">
                <div className="bg-blue-500/10 rounded-lg p-2">
                  <div className="font-medium text-blue-300 mb-1">📋 交易流程:</div>
                  <ul className="space-y-1 text-blue-300/80 text-xs">
                    {needsApproval && <li>• 1. 授权 NFT 给市场合约</li>}
                    <li>• {needsApproval ? '2' : '1'}. 设置价格并上架 NFT</li>
                    <li>• {needsApproval ? '3' : '2'}. 等待买家购买</li>
                    <li>• {needsApproval ? '4' : '3'}. 自动收到 BUB 代币</li>
                  </ul>
                </div>

                <div className="bg-yellow-500/10 rounded-lg p-2">
                  <div className="font-medium text-yellow-300 mb-1">⚠️ 注意事项:</div>
                  <ul className="space-y-1 text-yellow-300/80 text-xs">
                    <li>• 手续费: {(feePercentage / 100).toFixed(1)}% (从售价中扣除)</li>
                    <li>• 挂单期限: {duration} 天后自动下架</li>
                    <li>• 可随时取消挂单 (需支付 gas 费)</li>
                    <li>• 已装备的 NFT 无法出售</li>
                  </ul>
                </div>

                <div className="bg-green-500/10 rounded-lg p-2">
                  <div className="font-medium text-green-300 mb-1">✅ 安全保障:</div>
                  <ul className="space-y-1 text-green-300/80 text-xs">
                    <li>• 智能合约自动执行交易</li>
                    <li>• 资金安全由区块链保障</li>
                    <li>• 交易记录永久可查</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
