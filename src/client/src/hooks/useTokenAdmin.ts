import { useState, useEffect } from 'react'
import { useAccount, useContractRead, useContractWrite } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { getContractAddress } from '../config/contracts'
import BubbleTokenABI from '../contracts/abis/BubbleToken.json'

const BUBBLE_TOKEN_ADDRESS = getContractAddress('BubbleToken')
const BUBBLE_TOKEN_ABI = BubbleTokenABI

export interface TokenStats {
  totalSupply: string
  name: string
  symbol: string
  decimals: number
  owner: string
  paused: boolean
}

export interface MintOperation {
  to: string
  amount: string
  reason: string
  timestamp: number
}

export interface TransferOperation {
  from: string
  to: string
  amount: string
  reason: string
  timestamp: number
}

export interface HolderInfo {
  address: string
  balance: string
  percentage: number
}

// Role definitions
const TOKEN_ROLES = {
    DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
    // 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775
    ADMIN_ROLE: '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775',
    // 0xeed6f6cf0043b760a9fa371b917380a33d9fce74e6db2f9699f93922d78f979e
    GAME_REWARD_ROLE: '0xeed6f6cf0043b760a9fa371b917380a33d9fce74e6db2f9699f93922d78f979e',
    // 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
    MINTER_ROLE: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
};

export const useTokenAdmin = () => {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mintHistory, setMintHistory] = useState<MintOperation[]>([])
  const [transferHistory, setTransferHistory] = useState<TransferOperation[]>([])

  // Check user permissions
  const { data: hasGameRewardRole } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'hasGameRewardRole',
    args: [address],
    enabled: !!address,
  })

  const { data: hasAdminRole } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'hasRole',
    args: [TOKEN_ROLES.ADMIN_ROLE, address], // ADMIN_ROLE
    enabled: !!address,
  })

  // Get token basic info
  const { data: totalSupply, isLoading: isLoadingSupply, refetch: refetchSupply } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'totalSupply',
    watch: true,
  })

  const { data: tokenName, isLoading: isLoadingName } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'name',
  })

  const { data: tokenSymbol, isLoading: isLoadingSymbol } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'symbol',
  })

  const { data: tokenDecimals, isLoading: isLoadingDecimals } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'decimals',
  })

  const { data: tokenOwner } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'owner',
  })

//   const { data: tokenPaused } = useContractRead({
//     address: BUBBLE_TOKEN_ADDRESS,
//     abi: BUBBLE_TOKEN_ABI,
//     functionName: 'paused',
//     watch: true,
//   })

  // Allocation data reads
  const { data: remainingTeamTokens } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'getRemainingTeamTokens',
    watch: true,
  })

  const { data: remainingCommunityTokens } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'getRemainingCommunityTokens',
    watch: true,
  })

  const { data: remainingLiquidityTokens } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'getRemainingLiquidityTokens',
    watch: true,
  })

  const { data: remainingGameRewards } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'getRemainingGameRewards',
    watch: true,
  })

  const { data: todayRemainingRewards } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'getTodayRemainingRewards',
    watch: true,
  })

  const { data: allocationStats } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'getAllocationStats',
    watch: true,
  })

  // Simplified contract write functions using direct calls
  const { write: mintGameRewardWrite } = useContractWrite({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'mintGameReward',
  })

  const { write: burnWrite } = useContractWrite({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'burn',
  })

  const { write: transferWrite } = useContractWrite({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'transferFrom',
  })

  const { write: pauseWrite } = useContractWrite({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'pause',
  })

  const { write: unpauseWrite } = useContractWrite({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'unpause',
  })

  // New contract write functions for allocation management
  const { write: releaseTeamTokensWrite } = useContractWrite({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'releaseTeamTokens',
  })

  const { write: releaseCommunityTokensWrite } = useContractWrite({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'releaseCommunityTokens',
  })

  const { write: releaseLiquidityTokensWrite } = useContractWrite({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'releaseLiquidityTokens',
  })

  const { write: setDailyRewardLimitWrite } = useContractWrite({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'setDailyRewardLimit',
  })

  const { write: mintGameRewardsBatchWrite } = useContractWrite({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'mintGameRewardsBatch',
  })

  useEffect(() => {
    const loading = isLoadingSupply || isLoadingName || isLoadingSymbol || isLoadingDecimals
    setIsLoading(loading)
  }, [isLoadingSupply, isLoadingName, isLoadingSymbol, isLoadingDecimals])

  // Helper function to check and explain permissions
  const checkPermissions = (requiredRoles: string[]): { hasPermission: boolean; errorMessage?: string } => {
    const userRoles = []
    if (hasGameRewardRole) userRoles.push('GAME_REWARD_ROLE (游戏奖励角色)')
    if (hasAdminRole) userRoles.push('ADMIN_ROLE (管理员角色)')

    const hasAnyRequiredRole = requiredRoles.some(role => {
      if (role === 'GAME_REWARD_ROLE') return hasGameRewardRole
      if (role === 'ADMIN_ROLE') return hasAdminRole
      return false
    })

    if (!hasAnyRequiredRole) {
      const requiredRoleNames = requiredRoles.map(role => {
        if (role === 'GAME_REWARD_ROLE') return 'GAME_REWARD_ROLE (游戏奖励角色)'
        if (role === 'ADMIN_ROLE') return 'ADMIN_ROLE (管理员角色)'
        return role
      })

      return {
        hasPermission: false,
        errorMessage: `❌ 权限不足！

您当前的权限: ${userRoles.length > 0 ? userRoles.join(', ') : '无'}
需要的权限: ${requiredRoleNames.join(' 或 ')}

解决方案:
1. 前往"权限管理"页面查看详细权限状态
2. 联系合约管理员为您的地址授予相应权限
3. 确认您使用的是正确的钱包地址

您的地址: ${address}`
      }
    }

    return { hasPermission: true }
  }

  const getTokenStats = (): TokenStats | null => {
    if (!totalSupply || !tokenName || !tokenSymbol || tokenDecimals === undefined) {
      return null
    }

    return {
      totalSupply: formatEther(totalSupply as bigint),
      name: tokenName as string,
      symbol: tokenSymbol as string,
      decimals: tokenDecimals as number,
      owner: tokenOwner as string || '0x0000000000000000000000000000000000000000',
    //   paused: Boolean(tokenPaused),
      paused: false,
    }
  }

  // Enhanced mint function with better error handling
  const mintToAddress = async (to: string, amount: string, reason: string = '') => {
    try {
      // Enhanced permission check using helper function
      const permissionCheck = checkPermissions(['GAME_REWARD_ROLE', 'ADMIN_ROLE'])
      if (!permissionCheck.hasPermission) {
        setError(permissionCheck.errorMessage!)
        throw new Error(permissionCheck.errorMessage!)
      }

      if (!mintGameRewardWrite) {
        throw new Error('铸造功能不可用，请检查网络连接')
      }

      // Validate inputs
      if (!to || !amount) {
        throw new Error('请填写完整的接收地址和数量')
      }

      if (parseFloat(amount) <= 0) {
        throw new Error('铸造数量必须大于0')
      }

      const amountWei = parseEther(amount)

      // Call contract with better error handling
      try {
        await mintGameRewardWrite({
          args: [to as `0x${string}`, amountWei, reason || '管理员铸造']
        })
      } catch (contractError: any) {
        // Parse contract-specific errors
        if (contractError.message?.includes('AccessControlUnauthorizedAccount')) {
          throw new Error(`❌ 权限验证失败！

您的地址: ${address}
需要角色: GAME_REWARD_ROLE 或 ADMIN_ROLE

解决方案:
1. 前往"权限管理"页面
2. 联系合约管理员授予您铸造权限
3. 或使用具有相应权限的钱包地址`)
        } else if (contractError.message?.includes('Pausable: paused')) {
          throw new Error('❌ 合约已暂停，无法执行铸造操作')
        } else if (contractError.message?.includes('ERC20InvalidReceiver')) {
          throw new Error('❌ 接收地址无效，请检查地址格式')
        } else {
          throw new Error(`合约调用失败: ${contractError.message || '未知错误'}`)
        }
      }

      // Add to mint history
      const operation: MintOperation = {
        to,
        amount,
        reason: reason || '管理员铸造',
        timestamp: Date.now(),
      }
      setMintHistory(prev => [operation, ...prev])

      // Refresh total supply after minting
      setTimeout(() => {
        refetchSupply()
      }, 2000)

    } catch (err) {
      console.error('Failed to mint tokens:', err)
      const errorMessage = (err as Error).message
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Burn function
  const burnTokens = async (amount: string) => {
    try {
      if (!burnWrite) {
        throw new Error('Burn function not available')
      }

      const amountWei = parseEther(amount)

      await burnWrite({
        args: [amountWei]
      })

      // Refresh total supply after burning
      setTimeout(() => {
        refetchSupply()
      }, 2000)

    } catch (err) {
      console.error('Failed to burn tokens:', err)
      setError('Failed to burn tokens: ' + (err as Error).message)
      throw err
    }
  }

  // Transfer function
  const transferTokens = async (from: string, to: string, amount: string, reason: string = '') => {
    try {
      if (!transferWrite) {
        throw new Error('Transfer function not available')
      }

      const amountWei = parseEther(amount)

      await transferWrite({
        args: [from as `0x${string}`, to as `0x${string}`, amountWei]
      })

      // Add to transfer history
      const operation: TransferOperation = {
        from,
        to,
        amount,
        reason,
        timestamp: Date.now(),
      }
      setTransferHistory(prev => [operation, ...prev])

    } catch (err) {
      console.error('Failed to transfer tokens:', err)
      setError('Failed to transfer tokens: ' + (err as Error).message)
      throw err
    }
  }

  // Pause/Unpause functions
  const pauseToken = async () => {
    try {
      if (!pauseWrite) {
        throw new Error('Pause function not available')
      }

      await pauseWrite()
    } catch (err) {
      console.error('Failed to pause token:', err)
      setError('Failed to pause token: ' + (err as Error).message)
      throw err
    }
  }

  const unpauseToken = async () => {
    try {
      if (!unpauseWrite) {
        throw new Error('Unpause function not available')
      }

      await unpauseWrite()
    } catch (err) {
      console.error('Failed to unpause token:', err)
      setError('Failed to unpause token: ' + (err as Error).message)
      throw err
    }
  }

  // Batch operations
  const batchMint = async (operations: Omit<MintOperation, 'reason' | 'timestamp'>[]) => {
    try {
      for (const operation of operations) {
        await mintToAddress(operation.to, operation.amount, 'Batch mint operation')
        // Add delay between operations to avoid nonce issues
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (err) {
      console.error('Failed to batch mint:', err)
      setError('Failed to complete batch mint operation')
      throw err
    }
  }

  // New allocation management functions
  const releaseTeamTokens = async (to: string, amount: string) => {
    try {
      // Check admin permissions
      const permissionCheck = checkPermissions(['ADMIN_ROLE'])
      if (!permissionCheck.hasPermission) {
        setError(permissionCheck.errorMessage!)
        throw new Error(permissionCheck.errorMessage!)
      }

      if (!releaseTeamTokensWrite) {
        throw new Error('Release team tokens function not available')
      }

      const amountWei = parseEther(amount)

      await releaseTeamTokensWrite({
        args: [to as `0x${string}`, amountWei]
      })

      // Refresh data after release
      setTimeout(() => {
        refetchSupply()
      }, 2000)

    } catch (err) {
      console.error('Failed to release team tokens:', err)
      setError('Failed to release team tokens: ' + (err as Error).message)
      throw err
    }
  }

  const releaseCommunityTokens = async (to: string, amount: string) => {
    try {
      // Check admin permissions
      const permissionCheck = checkPermissions(['ADMIN_ROLE'])
      if (!permissionCheck.hasPermission) {
        setError(permissionCheck.errorMessage!)
        throw new Error(permissionCheck.errorMessage!)
      }

      if (!releaseCommunityTokensWrite) {
        throw new Error('Release community tokens function not available')
      }

      const amountWei = parseEther(amount)

      await releaseCommunityTokensWrite({
        args: [to as `0x${string}`, amountWei]
      })

      // Refresh data after release
      setTimeout(() => {
        refetchSupply()
      }, 2000)

    } catch (err) {
      console.error('Failed to release community tokens:', err)
      setError('Failed to release community tokens: ' + (err as Error).message)
      throw err
    }
  }

  const releaseLiquidityTokens = async (to: string, amount: string) => {
    try {
      // Check admin permissions
      const permissionCheck = checkPermissions(['ADMIN_ROLE'])
      if (!permissionCheck.hasPermission) {
        setError(permissionCheck.errorMessage!)
        throw new Error(permissionCheck.errorMessage!)
      }

      if (!releaseLiquidityTokensWrite) {
        throw new Error('Release liquidity tokens function not available')
      }

      const amountWei = parseEther(amount)

      await releaseLiquidityTokensWrite({
        args: [to as `0x${string}`, amountWei]
      })

      // Refresh data after release
      setTimeout(() => {
        refetchSupply()
      }, 2000)

    } catch (err) {
      console.error('Failed to release liquidity tokens:', err)
      setError('Failed to release liquidity tokens: ' + (err as Error).message)
      throw err
    }
  }

  const setDailyRewardLimit = async (newLimit: string) => {
    try {
      // Check admin permissions
      const permissionCheck = checkPermissions(['ADMIN_ROLE'])
      if (!permissionCheck.hasPermission) {
        setError(permissionCheck.errorMessage!)
        throw new Error(permissionCheck.errorMessage!)
      }

      if (!setDailyRewardLimitWrite) {
        throw new Error('Set daily reward limit function not available')
      }

      const limitWei = parseEther(newLimit)

      await setDailyRewardLimitWrite({
        args: [limitWei]
      })

    } catch (err) {
      console.error('Failed to set daily reward limit:', err)
      setError('Failed to set daily reward limit: ' + (err as Error).message)
      throw err
    }
  }

  const mintGameRewardsBatch = async (players: string[], amounts: string[], reason: string = 'Batch game rewards') => {
    try {
      // Check permissions for batch minting
      const permissionCheck = checkPermissions(['GAME_REWARD_ROLE', 'ADMIN_ROLE'])
      if (!permissionCheck.hasPermission) {
        setError(permissionCheck.errorMessage!)
        throw new Error(permissionCheck.errorMessage!)
      }

      if (!mintGameRewardsBatchWrite) {
        throw new Error('Mint game rewards batch function not available')
      }

      if (players.length !== amounts.length) {
        throw new Error('Players and amounts arrays must have the same length')
      }

      const amountsWei = amounts.map(amount => parseEther(amount))

      await mintGameRewardsBatchWrite({
        args: [players as `0x${string}`[], amountsWei, reason]
      })

      // Add to mint history
      players.forEach((player, index) => {
        const operation: MintOperation = {
          to: player,
          amount: amounts[index],
          reason: `${reason} (batch)`,
          timestamp: Date.now(),
        }
        setMintHistory(prev => [operation, ...prev])
      })

      // Refresh total supply after minting
      setTimeout(() => {
        refetchSupply()
      }, 2000)

    } catch (err) {
      console.error('Failed to mint batch game rewards:', err)
      setError('Failed to mint batch game rewards: ' + (err as Error).message)
      throw err
    }
  }

  // Get balance for specific address
  const getHolderBalance = async (holderAddress: string): Promise<string | null> => {
    try {
      // This would require a separate contract read
      // For now, we'll return a placeholder
      return '0'
    } catch (err) {
      console.error('Failed to get holder balance:', err)
      return null
    }
  }

  // Refresh all data
  const refreshData = async () => {
    try {
      await refetchSupply()
    } catch (err) {
      console.error('Failed to refresh token data:', err)
      setError('Failed to refresh data')
    }
  }

  // Predefined mint amounts for quick actions
  const quickMintAmounts = [
    { label: '100 BUB', amount: '100' },
    { label: '500 BUB', amount: '500' },
    { label: '1,000 BUB', amount: '1000' },
    { label: '5,000 BUB', amount: '5000' },
    { label: '10,000 BUB', amount: '10000' },
  ]

  // Helper function to get allocation data
  const getAllocationData = () => {
    return {
      remainingTeamTokens: remainingTeamTokens ? formatEther(remainingTeamTokens as bigint) : '0',
      remainingCommunityTokens: remainingCommunityTokens ? formatEther(remainingCommunityTokens as bigint) : '0',
      remainingLiquidityTokens: remainingLiquidityTokens ? formatEther(remainingLiquidityTokens as bigint) : '0',
      remainingGameRewards: remainingGameRewards ? formatEther(remainingGameRewards as bigint) : '0',
      todayRemainingRewards: todayRemainingRewards ? formatEther(todayRemainingRewards as bigint) : '0',
      allocationStats: allocationStats || null,
    }
  }

  return {
    // Data
    tokenStats: getTokenStats(),
    allocationData: getAllocationData(),
    mintHistory,
    transferHistory,
    quickMintAmounts,

    // Permissions
    hasGameRewardRole: !!hasGameRewardRole,
    hasAdminRole: !!hasAdminRole,
    canMint: !!(hasGameRewardRole || hasAdminRole),

    // Loading states
    isLoading,
    isMinting: false, // Simplified for now
    isBurning: false, // Simplified for now
    isTransferring: false, // Simplified for now
    isPausing: false, // Simplified for now
    isUnpausing: false, // Simplified for now

    // Error state
    error,

    // Actions
    mintToAddress,
    burnTokens,
    transferTokens,
    pauseToken,
    unpauseToken,
    batchMint,
    getHolderBalance,
    refreshData,

    // New allocation management actions
    releaseTeamTokens,
    releaseCommunityTokens,
    releaseLiquidityTokens,
    setDailyRewardLimit,
    mintGameRewardsBatch,

    // Utils
    setError,
  }
}
