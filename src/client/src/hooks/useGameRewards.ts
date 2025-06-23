import { useState, useEffect } from 'react'
import { useAccount, useContractRead, useContractReads, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { getContractAddress } from '../config/contracts'
import GameRewardsABI from '../contracts/abis/GameRewards.json'

const GAME_REWARDS_ADDRESS = getContractAddress('GameRewards')
const GAME_REWARDS_ABI = GameRewardsABI

export interface GameSession {
  player: string
  score: number
  gameTime: number
  gameHash: string
  submittedAt: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLAIMED'
  rewardAmount: number
  verifiedBy: string
}

export interface RewardParameters {
  baseReward: number
  scoreMultiplier: number
  timeBonus: number
}

export interface PlayerStats {
  totalSessions: number
  totalRewards: number
  highestScore: number
}

export const useGameRewards = () => {
  const { address } = useAccount()
  const [pendingSessions, setPendingSessions] = useState<number[]>([])
  const [sessions, setSessions] = useState<Record<number, GameSession>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if user has admin role for GameRewards contract
  const { data: hasAdminRole, isLoading: isLoadingRole } = useContractRead({
    address: GAME_REWARDS_ADDRESS,
    abi: GAME_REWARDS_ABI,
    functionName: 'hasRole',
    args: [
      '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775', // ADMIN_ROLE hash
      address || '0x0000000000000000000000000000000000000000' // 提供默认地址避免 undefined
    ],
    enabled: !!address, // 只有在地址存在时才检查权限
  })

  // Get pending sessions (only if user has admin role and role check is complete)
  const { data: pendingSessionIds, isLoading: isLoadingPending, refetch: refetchPending } = useContractRead({
    address: GAME_REWARDS_ADDRESS,
    abi: GAME_REWARDS_ABI,
    functionName: 'getPendingVerificationSessions',
    args: [0, 50], // offset: 0, limit: 50
    // TODO: 修改完合约权限后重新修改状态
    // watch: true,
    watch: false,
    enabled: !!address && hasAdminRole === true && !isLoadingRole, // 确保地址存在、有管理员权限且权限检查已完成
  })

  // Get reward configuration (using public variable)
  const { data: rewardConfig, isLoading: isLoadingParams, refetch: refetchParams } = useContractRead({
    address: GAME_REWARDS_ADDRESS,
    abi: GAME_REWARDS_ABI,
    functionName: 'rewardConfig',
    watch: true,
  })

  // Prepare contract calls for session details (using correct function name)
  const sessionCalls = Array.isArray(pendingSessionIds)
    ? (pendingSessionIds as string[]).map((sessionId) => ({
        address: GAME_REWARDS_ADDRESS,
        abi: GAME_REWARDS_ABI as any,
        functionName: 'getSessionDetails' as const,
        args: [sessionId], // sessionId is bytes32, not uint256
      }))
    : []

  // Get session details (only if user has admin role)
  const { data: sessionDetails, isLoading: isLoadingSessions, refetch: refetchSessions } = useContractReads({
    contracts: sessionCalls as any,
    enabled: !!address && hasAdminRole === true && !isLoadingRole && !!pendingSessionIds && Array.isArray(pendingSessionIds) && pendingSessionIds.length > 0,
    watch: true,
  })

  // Verify session preparation (using correct function name)
  const { config: verifyConfig } = usePrepareContractWrite({
    address: GAME_REWARDS_ADDRESS,
    abi: GAME_REWARDS_ABI,
    functionName: 'verifyPlayerSession', // Correct function name
  })

  const { write: verifySession, isLoading: isVerifying } = useContractWrite(verifyConfig)

  // Update reward config preparation (using correct function name)
  const { config: setParamsConfig } = usePrepareContractWrite({
    address: GAME_REWARDS_ADDRESS,
    abi: GAME_REWARDS_ABI,
    functionName: 'updateRewardConfig', // Correct function name
  })

  const { write: setRewardParameters, isLoading: isSettingParams } = useContractWrite(setParamsConfig)

  useEffect(() => {
    const loading = isLoadingRole || isLoadingPending || isLoadingSessions || isLoadingParams
    setIsLoading(loading)

    // 只有在有管理员权限时才处理数据
    if (!address || hasAdminRole !== true) {
      setPendingSessions([])
      setSessions({})
      return
    }

    if (pendingSessionIds) {
      // Handle string array (bytes32) instead of bigint array
      const sessionIds = Array.isArray(pendingSessionIds)
        ? (pendingSessionIds as string[]).map((_, index) => index) // Use index as numeric ID
        : []
      setPendingSessions(sessionIds)
    }

    if (sessionDetails && pendingSessionIds) {
      const sessionMap: Record<number, GameSession> = {}

      sessionDetails.forEach((result, index) => {
        if (result.status === 'success' && result.result) {
          const sessionData = result.result as any

          // Map the actual contract data structure
          sessionMap[index] = {
            player: sessionData.player || sessionData.playerAddress,
            score: Number(sessionData.maxMass || sessionData.score || 0),
            gameTime: Number(sessionData.survivalTime || sessionData.gameTime || 0),
            gameHash: sessionData.sessionId || sessionData.gameHash || '',
            submittedAt: Number(sessionData.submittedAt || 0),
            status: sessionData.verified
              ? (sessionData.claimed ? 'CLAIMED' : 'APPROVED')
              : 'PENDING',
            rewardAmount: Number(sessionData.rewardAmount || 0),
            verifiedBy: sessionData.verifiedBy || '',
          }
        }
      })

      setSessions(sessionMap)
    }
  }, [address, hasAdminRole, pendingSessionIds, sessionDetails, isLoadingRole, isLoadingPending, isLoadingSessions, isLoadingParams])

  const verifyGameSession = async (sessionId: number, approved: boolean) => {
    try {
      if (!verifySession) {
        throw new Error('Contract write not prepared')
      }

      // Call the contract write function directly
      await verifySession()

      // Refresh data after verification
      setTimeout(() => {
        refetchPending()
        refetchSessions()
      }, 2000)

    } catch (err) {
      console.error('Failed to verify session:', err)
      setError('Failed to verify game session')
      throw err
    }
  }

  const updateRewardParameters = async (params: RewardParameters) => {
    try {
      if (!setRewardParameters) {
        throw new Error('Contract write not prepared')
      }

      // Call the contract write function directly
      await setRewardParameters()

      // Refresh parameters after update
      setTimeout(() => {
        refetchParams()
      }, 2000)

    } catch (err) {
      console.error('Failed to update reward parameters:', err)
      setError('Failed to update reward parameters')
      throw err
    }
  }

  const getPlayerStats = async (playerAddress: string): Promise<PlayerStats | null> => {
    try {
      // This would need to be implemented as a separate contract read
      // For now, return null as placeholder
      return null
    } catch (err) {
      console.error('Failed to get player stats:', err)
      return null
    }
  }

  const refreshData = async () => {
    try {
      await Promise.all([
        refetchPending(),
        refetchSessions(),
        refetchParams()
      ])
    } catch (err) {
      console.error('Failed to refresh data:', err)
      setError('Failed to refresh data')
    }
  }

  const formatRewardParameters = (): RewardParameters | null => {
    if (!rewardConfig) return null

    // Handle the actual RewardConfig struct from the contract
    const config = rewardConfig as any

    return {
      baseReward: Number(config.baseReward || 0),
      scoreMultiplier: Number(config.scoreMultiplier || 0),
      timeBonus: Number(config.timeBonus || 0),
    }
  }

  return {
    // Data
    pendingSessions,
    sessions,
    rewardParameters: formatRewardParameters(),

    // Permissions
    hasAdminRole: hasAdminRole === true, // 明确检查是否为 true
    isLoadingRole,

    // Loading states
    isLoading,
    isVerifying,
    isSettingParams,

    // Error state
    error,

    // Actions
    verifyGameSession,
    updateRewardParameters,
    getPlayerStats,
    refreshData,

    // Utils
    setError,
  }
}
