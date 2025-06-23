import { useState, useCallback } from 'react'
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { parseEther } from 'viem'
import { getContractAddress } from '../config/contracts'
import BubbleTokenABI from '../contracts/abis/BubbleToken.json'
import BubbleSkinNFTABI from '../contracts/abis/BubbleSkinNFT.json'
import { toast } from 'react-hot-toast'

const BUBBLE_TOKEN_ADDRESS = getContractAddress('BubbleToken')
const BUBBLE_SKIN_NFT_ADDRESS = getContractAddress('BubbleSkinNFT')

export interface PurchaseState {
  step: 'idle' | 'approving' | 'minting' | 'success' | 'error'
  txHash?: string
  error?: string
}

export const useSkinPurchase = () => {
  const { address } = useAccount()
  const [purchaseState, setPurchaseState] = useState<PurchaseState>({ step: 'idle' })
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)

  // 获取用户代币余额
  const { data: tokenBalance, refetch: refetchBalance } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BubbleTokenABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
    watch: true,
  })

  // 获取用户对 NFT 合约的代币授权额度
  const { data: allowance, refetch: refetchAllowance } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BubbleTokenABI,
    functionName: 'allowance',
    args: [address, BUBBLE_SKIN_NFT_ADDRESS],
    enabled: !!address,
    watch: true,
  })

  // 获取用户拥有的 NFT 数量
  const { data: userNFTBalance, refetch: refetchNFTBalance } = useContractRead({
    address: BUBBLE_SKIN_NFT_ADDRESS,
    abi: BubbleSkinNFTABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
    watch: true,
  })

  // 准备代币授权交易
  const { config: approveConfig } = usePrepareContractWrite({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BubbleTokenABI,
    functionName: 'approve',
    args: [BUBBLE_SKIN_NFT_ADDRESS, parseEther('1000000')], // 授权大额度
    enabled: !!address,
  })

  const { write: approveTokens, isLoading: isApproving } = useContractWrite(approveConfig)

  // 准备 NFT 铸造交易
  const { config: mintConfig } = usePrepareContractWrite({
    address: BUBBLE_SKIN_NFT_ADDRESS,
    abi: BubbleSkinNFTABI,
    functionName: 'mintSkinToAddress',
    args: [address, selectedTemplate],
    enabled: !!address && !!selectedTemplate,
  })

  const { write: mintSkin, isLoading: isMinting } = useContractWrite(mintConfig)

  // 检查是否需要授权
  const needsApproval = (price: number): boolean => {
    if (!allowance) return true
    const priceInWei = parseEther(price.toString())
    return BigInt(allowance.toString()) < priceInWei
  }

  // 检查余额是否足够
  const hasEnoughBalance = (price: number): boolean => {
    if (!tokenBalance) return false
    const priceInWei = parseEther(price.toString())
    return BigInt(tokenBalance.toString()) >= priceInWei
  }

  // 获取用户拥有的皮肤模板 ID 列表 - 使用 useCallback 避免无限循环
  const getUserOwnedSkins = useCallback(async (): Promise<number[]> => {
    try {
      if (!address || !userNFTBalance) return []

      const ownedSkins: number[] = []
      const balance = Number(userNFTBalance)

      // 这里需要调用合约方法获取用户拥有的每个 NFT 的模板 ID
      // 由于需要遍历用户的所有 NFT，这可能需要多次合约调用
      // 为了简化，我们先返回空数组，实际实现中需要调用 tokenOfOwnerByIndex 和 getTokenTemplate

      return ownedSkins
    } catch (error) {
      console.error('获取用户皮肤失败:', error)
      return []
    }
  }, [address, userNFTBalance])

  // 执行购买流程
  const purchaseSkin = async (templateId: number, price: number = 100) => {
    if (!address) {
      toast.error('请先连接钱包')
      return
    }

    if (!hasEnoughBalance(price)) {
      toast.error('余额不足')
      return
    }

    try {
      setPurchaseState({ step: 'idle' })
      setSelectedTemplate(templateId)

      // 步骤 1: 检查并处理代币授权
      if (needsApproval(price)) {
        setPurchaseState({ step: 'approving' })
        toast.loading('正在授权代币使用...', { id: 'purchase' })

        if (!approveTokens) {
          throw new Error('无法准备授权交易')
        }

        await approveTokens()
        
        // 等待授权交易确认
        await new Promise(resolve => setTimeout(resolve, 3000))
        await refetchAllowance()
      }

      // 步骤 2: 铸造 NFT
      setPurchaseState({ step: 'minting' })
      toast.loading('正在铸造皮肤...', { id: 'purchase' })

      if (!mintSkin) {
        throw new Error('无法准备铸造交易')
      }

      await mintSkin()

      // 等待铸造交易确认
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // 刷新数据
      await Promise.all([
        refetchBalance(),
        refetchAllowance(),
        refetchNFTBalance(),
      ])

      setPurchaseState({ step: 'success' })
      toast.success('皮肤购买成功！', { id: 'purchase' })

    } catch (error) {
      console.error('购买失败:', error)
      setPurchaseState({ 
        step: 'error', 
        error: (error as Error).message 
      })
      toast.error('购买失败，请重试', { id: 'purchase' })
    } finally {
      setSelectedTemplate(null)
    }
  }

  // 重置购买状态
  const resetPurchaseState = () => {
    setPurchaseState({ step: 'idle' })
    setSelectedTemplate(null)
  }

  return {
    // 状态
    purchaseState,
    isApproving,
    isMinting,
    isPurchasing: isApproving || isMinting || purchaseState.step !== 'idle',
    
    // 数据
    tokenBalance: tokenBalance ? Number(tokenBalance) / 1e18 : 0,
    userNFTBalance: userNFTBalance ? Number(userNFTBalance) : 0,
    allowance: allowance ? Number(allowance) / 1e18 : 0,
    
    // 方法
    purchaseSkin,
    resetPurchaseState,
    needsApproval,
    hasEnoughBalance,
    getUserOwnedSkins,
    
    // 刷新方法
    refetchBalance,
    refetchAllowance,
    refetchNFTBalance,
  }
}
