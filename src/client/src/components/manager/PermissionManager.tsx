import React, { useState } from 'react'
import { useAccount, useContractWrite, useContractRead } from 'wagmi'
import { isAddress } from 'viem'
import { getContractAddress, CONTRACT_ADDRESSES } from '../../config/contracts'
import BubbleTokenABI from '../../contracts/abis/BubbleToken.json'
import BubbleSkinNFTABI from '../../contracts/abis/BubbleSkinNFT.json'
import AccessControlManagerABI from '../../contracts/abis/AccessControlManager.json'
import { Button } from '../ui/Button'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { toast } from 'react-hot-toast'
// import { isAddress } from 'ethers'
import { PermissionHelp } from './PermissionHelp'

const BUBBLE_TOKEN_ADDRESS = getContractAddress('BubbleToken')
const BUBBLE_SKIN_NFT_ADDRESS = getContractAddress('BubbleSkinNFT')
const ACCESS_CONTROL_MANAGER_ADDRESS = CONTRACT_ADDRESSES.AccessControlManager

// Role definitions
const TOKEN_ROLES = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  // 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775
  ADMIN_ROLE: '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775',
  // 0xeed6f6cf0043b760a9fa371b917380a33d9fce74e6db2f9699f93922d78f979e
  GAME_REWARD_ROLE: '0xeed6f6cf0043b760a9fa371b917380a33d9fce74e6db2f9699f93922d78f979e',
  // 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
  MINTER_ROLE: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
}

const NFT_ROLES = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  ADMIN_ROLE: '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775',
  SKIN_MANAGER_ROLE: '0x15a28d26fa1bf736cf7edc9922607171ccb09c3c73b808e7772a3013e068a522',
  MINTER_ROLE: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
}

interface GrantRoleForm {
  targetAddress: string
  selectedRole: string
  contractType: 'token' | 'nft'
}

export const PermissionManager: React.FC = () => {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'history' | 'acm'>('overview')
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [grantForm, setGrantForm] = useState<GrantRoleForm>({
    targetAddress: '',
    selectedRole: '',
    contractType: 'token'
  })
  const [revokeForm, setRevokeForm] = useState<GrantRoleForm>({
    targetAddress: '',
    selectedRole: '',
    contractType: 'token'
  })

  const [acmForm, setAcmForm] = useState({
    userAddress: '',
    selectedRole: '',
    description: ''
  })

  const [permissionHistory, setPermissionHistory] = useState<any[]>([])
  const [userRoles, setUserRoles] = useState<any[]>([])

  // Token contract permissions
  const { data: hasGameRewardRole } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BubbleTokenABI,
    functionName: 'hasGameRewardRole',
    args: [address],
    enabled: !!address,
  })

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
    const NFT_ROLES = {
        DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
        ADMIN_ROLE: '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775',
        SKIN_MANAGER_ROLE: '0x15a28d26fa1bf736cf7edc9922607171ccb09c3c73b808e7772a3013e068a522',
        MINTER_ROLE: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
    }

  const { data: hasTokenAdminRole } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BubbleTokenABI,
    functionName: 'hasRole',
    args: [TOKEN_ROLES.ADMIN_ROLE, address], // ADMIN_ROLE
    enabled: !!address,
  })

  const { data: hasDefaultAdminRole } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BubbleTokenABI,
    functionName: 'hasRole',
    args: [TOKEN_ROLES.DEFAULT_ADMIN_ROLE, address], // DEFAULT_ADMIN_ROLE
    enabled: !!address,
  })

  // NFT contract permissions
  const { data: hasNFTAdminRole } = useContractRead({
    address: BUBBLE_SKIN_NFT_ADDRESS,
    abi: BubbleSkinNFTABI,
    functionName: 'hasRole',
    args: [NFT_ROLES.ADMIN_ROLE, address], // ADMIN_ROLE
    enabled: !!address,
  })

  const { data: hasNFTMinterRole } = useContractRead({
    address: BUBBLE_SKIN_NFT_ADDRESS,
    abi: BubbleSkinNFTABI,
    functionName: 'hasRole',
    args: [NFT_ROLES.MINTER_ROLE, address], // MINTER_ROLE
    enabled: !!address,
  })

  const { data: hasNFTSkinManagerRole } = useContractRead({
    address: BUBBLE_SKIN_NFT_ADDRESS,
    abi: BubbleSkinNFTABI,
    functionName: 'hasRole',
    args: [NFT_ROLES.SKIN_MANAGER_ROLE, address], // SKIN_MANAGER_ROLE
    enabled: !!address,
  })

  // AccessControlManager contract reads
  const { data: acmUserRoles } = useContractRead({
    address: ACCESS_CONTROL_MANAGER_ADDRESS,
    abi: AccessControlManagerABI,
    functionName: 'getUserRoles',
    args: [address],
    enabled: !!address,
  })

  const { data: permissionHistoryCount } = useContractRead({
    address: ACCESS_CONTROL_MANAGER_ADDRESS,
    abi: AccessControlManagerABI,
    functionName: 'getPermissionHistoryCount',
    enabled: !!address,
  })

  // Contract write functions for granting roles
  const { write: grantTokenRole, isLoading: isGrantingTokenRole } = useContractWrite({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BubbleTokenABI,
    functionName: 'grantRole',
  })

  const { write: grantTokenGameRewardRole, isLoading: isGrantingGameRewardRole } = useContractWrite({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BubbleTokenABI,
    functionName: 'grantGameRewardRole',
  })

  const { write: grantNFTRole, isLoading: isGrantingNFTRole } = useContractWrite({
    address: BUBBLE_SKIN_NFT_ADDRESS,
    abi: BubbleSkinNFTABI,
    functionName: 'grantRole',
  })

  // Contract write functions for revoking roles
  const { write: revokeTokenRole, isLoading: isRevokingTokenRole } = useContractWrite({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BubbleTokenABI,
    functionName: 'revokeRole',
  })

  const { write: revokeNFTRole, isLoading: isRevokingNFTRole } = useContractWrite({
    address: BUBBLE_SKIN_NFT_ADDRESS,
    abi: BubbleSkinNFTABI,
    functionName: 'revokeRole',
  })

  // Utility functions
  const validateAddress = (addr: string): boolean => {
    return isAddress(addr)
  }

  const getRoleDisplayName = (roleHash: string, contractType: 'token' | 'nft'): string => {
    const roles = contractType === 'token' ? TOKEN_ROLES : NFT_ROLES
    const roleEntry = Object.entries(roles).find(([, hash]) => hash === roleHash)
    return roleEntry ? roleEntry[0] : 'Unknown Role'
  }

  const getAvailableRoles = (contractType: 'token' | 'nft') => {
    const roles = contractType === 'token' ? TOKEN_ROLES : NFT_ROLES
    return Object.entries(roles).map(([name, hash]) => ({
      name,
      hash,
      displayName: name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      description: getRoleDescription(name, contractType)
    }))
  }

  const getRoleDescription = (roleName: string, contractType: 'token' | 'nft'): string => {
    const descriptions: Record<string, string> = {
      'DEFAULT_ADMIN_ROLE': '超级管理员，可以管理所有角色',
      'ADMIN_ROLE': '管理员，可以执行大部分管理操作',
      'GAME_REWARD_ROLE': '游戏奖励角色，可以铸造游戏奖励代币',
      'MINTER_ROLE': contractType === 'token' ? '铸造者，可以铸造代币' : '铸造者，可以铸造NFT',
      'SKIN_MANAGER_ROLE': '皮肤管理员，可以创建和管理皮肤模板',
    }
    return descriptions[roleName] || '未知角色'
  }

  const canGrantRole = (roleHash: string, contractType: 'token' | 'nft'): boolean => {
    if (contractType === 'token') {
      return !!(hasDefaultAdminRole || hasTokenAdminRole)
    } else {
      return !!(hasNFTAdminRole)
    }
  }

  // Grant role handler
  const handleGrantRole = async () => {
    if (!grantForm.targetAddress || !grantForm.selectedRole) {
      toast.error('请填写完整信息')
      return
    }

    if (!validateAddress(grantForm.targetAddress)) {
      toast.error('请输入有效的地址')
      return
    }

    if (!canGrantRole(grantForm.selectedRole, grantForm.contractType)) {
      toast.error('您没有权限授予此角色')
      return
    }

    try {
      setIsLoading(true)

      if (grantForm.contractType === 'token') {
        if (grantForm.selectedRole === TOKEN_ROLES.GAME_REWARD_ROLE) {
          // Use special function for GAME_REWARD_ROLE
          grantTokenGameRewardRole({
            args: [grantForm.targetAddress as `0x${string}`]
          })
        } else {
          grantTokenRole({
            args: [grantForm.selectedRole as `0x${string}`, grantForm.targetAddress as `0x${string}`]
          })
        }
      } else {
        grantNFTRole({
          args: [grantForm.selectedRole as `0x${string}`, grantForm.targetAddress as `0x${string}`]
        })
      }

      const roleName = getRoleDisplayName(grantForm.selectedRole, grantForm.contractType)
      toast.success(`${roleName} 授予成功！`)
      setShowGrantModal(false)
      setGrantForm({ targetAddress: '', selectedRole: '', contractType: 'token' })

    } catch (error) {
      console.error('Failed to grant role:', error)
      toast.error('授予权限失败，请检查您的权限和网络连接')
    } finally {
      setIsLoading(false)
    }
  }

  // Revoke role handler
  const handleRevokeRole = async () => {
    if (!revokeForm.targetAddress || !revokeForm.selectedRole) {
      toast.error('请填写完整信息')
      return
    }

    if (!validateAddress(revokeForm.targetAddress)) {
      toast.error('请输入有效的地址')
      return
    }

    if (!canGrantRole(revokeForm.selectedRole, revokeForm.contractType)) {
      toast.error('您没有权限撤销此角色')
      return
    }

    try {
      setIsLoading(true)

      if (revokeForm.contractType === 'token') {
        revokeTokenRole({
          args: [revokeForm.selectedRole as `0x${string}`, revokeForm.targetAddress as `0x${string}`]
        })
      } else {
        revokeNFTRole({
          args: [revokeForm.selectedRole as `0x${string}`, revokeForm.targetAddress as `0x${string}`]
        })
      }

      const roleName = getRoleDisplayName(revokeForm.selectedRole, revokeForm.contractType)
      toast.success(`${roleName} 撤销成功！`)
      setShowRevokeModal(false)
      setRevokeForm({ targetAddress: '', selectedRole: '', contractType: 'token' })

    } catch (error) {
      console.error('Failed to revoke role:', error)
      toast.error('撤销权限失败，请检查您的权限和网络连接')
    } finally {
      setIsLoading(false)
    }
  }

  // Quick grant functions for self
  const handleGrantSelfGameRewardRole = async () => {
    if (!grantTokenGameRewardRole || !address) return

    try {
      setIsLoading(true)
      grantTokenGameRewardRole({
        args: [address]
      })
      toast.success('GAME_REWARD_ROLE 授予成功！')
    } catch (error) {
      console.error('Failed to grant role:', error)
      toast.error('授予权限失败，请检查您是否有管理员权限')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGrantSelfNFTMinterRole = async () => {
    if (!grantNFTRole || !address) return

    try {
      setIsLoading(true)
      grantNFTRole({
        args: [NFT_ROLES.MINTER_ROLE as `0x${string}`, address as `0x${string}`]
      })
      toast.success('NFT MINTER_ROLE 授予成功！')
    } catch (error) {
      console.error('Failed to grant NFT minter role:', error)
      toast.error('授予NFT铸造权限失败，请检查您是否有管理员权限')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGrantSelfNFTSkinManagerRole = async () => {
    if (!grantNFTRole || !address) return

    try {
      setIsLoading(true)
      grantNFTRole({
        args: [NFT_ROLES.SKIN_MANAGER_ROLE as `0x${string}`, address as `0x${string}`]
      })
      toast.success('NFT SKIN_MANAGER_ROLE 授予成功！')
    } catch (error) {
      console.error('Failed to grant NFT skin manager role:', error)
      toast.error('授予NFT皮肤管理权限失败，请检查您是否有管理员权限')
    } finally {
      setIsLoading(false)
    }
  }

  if (!address) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">🔐 权限管理</h3>
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
          <h2 className="text-2xl font-bold text-white">🔐 权限管理</h2>
          <p className="text-white/70">管理您的合约权限和角色</p>
        </div>
        <div className="text-sm text-white/60">
          ACM: {ACCESS_CONTROL_MANAGER_ADDRESS}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 bg-white/5 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
        {[
          { id: 'overview', label: '权限概览', icon: '📋' },
          { id: 'manage', label: '权限管理', icon: '🛠️' },
          { id: 'history', label: '操作历史', icon: '📜' },
          { id: 'acm', label: 'ACM管理', icon: '🏛️' },
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
        <div className="space-y-6">
          {/* Current Permissions */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">📋 当前权限状态</h3>
        
        <div className="space-y-4">
          {/* Token Permissions */}
          <div>
            <h4 className="text-lg font-medium text-white mb-3">🪙 代币合约权限</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`p-3 rounded-xl border ${hasDefaultAdminRole ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                <div className="text-sm text-white/70">DEFAULT_ADMIN_ROLE</div>
                <div className={`font-bold ${hasDefaultAdminRole ? 'text-green-400' : 'text-red-400'}`}>
                  {hasDefaultAdminRole ? '✅ 已拥有' : '❌ 未拥有'}
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${hasTokenAdminRole ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                <div className="text-sm text-white/70">ADMIN_ROLE</div>
                <div className={`font-bold ${hasTokenAdminRole ? 'text-green-400' : 'text-red-400'}`}>
                  {hasTokenAdminRole ? '✅ 已拥有' : '❌ 未拥有'}
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${hasGameRewardRole ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                <div className="text-sm text-white/70">GAME_REWARD_ROLE</div>
                <div className={`font-bold ${hasGameRewardRole ? 'text-green-400' : 'text-red-400'}`}>
                  {hasGameRewardRole ? '✅ 已拥有' : '❌ 未拥有'}
                </div>
              </div>
            </div>
          </div>

          {/* NFT Permissions */}
          <div>
            <h4 className="text-lg font-medium text-white mb-3">🎨 NFT合约权限</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`p-3 rounded-xl border ${hasNFTAdminRole ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                <div className="text-sm text-white/70">ADMIN_ROLE</div>
                <div className={`font-bold ${hasNFTAdminRole ? 'text-green-400' : 'text-red-400'}`}>
                  {hasNFTAdminRole ? '✅ 已拥有' : '❌ 未拥有'}
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${hasNFTMinterRole ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                <div className="text-sm text-white/70">MINTER_ROLE</div>
                <div className={`font-bold ${hasNFTMinterRole ? 'text-green-400' : 'text-red-400'}`}>
                  {hasNFTMinterRole ? '✅ 已拥有' : '❌ 未拥有'}
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${hasNFTSkinManagerRole ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                <div className="text-sm text-white/70">SKIN_MANAGER_ROLE</div>
                <div className={`font-bold ${hasNFTSkinManagerRole ? 'text-green-400' : 'text-red-400'}`}>
                  {hasNFTSkinManagerRole ? '✅ 已拥有' : '❌ 未拥有'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>
      )}

      {/* Manage Tab */}
      {activeTab === 'manage' && (
        <div className="space-y-6">
          {/* Quick Self-Grant Permissions */}
          {(hasDefaultAdminRole || hasTokenAdminRole || hasNFTAdminRole) && (
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">🎯 快速自授权限</h3>
              <p className="text-white/70 mb-4">您拥有管理员权限，可以为自己授予其他角色</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {!hasGameRewardRole && (hasDefaultAdminRole) && (
                  <Button
                    onClick={handleGrantSelfGameRewardRole}
                    variant="primary"
                    disabled={isLoading}
                    className="p-4 h-auto flex-col gap-2"
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : <div className="text-xl">🪙</div>}
                    <div className="font-semibold">授予代币铸造权限</div>
                    <div className="text-sm opacity-80">GAME_REWARD_ROLE</div>
                  </Button>
                )}

                {!hasNFTMinterRole && (hasNFTAdminRole) && (
                  <Button
                    onClick={handleGrantSelfNFTMinterRole}
                    variant="primary"
                    disabled={isLoading}
                    className="p-4 h-auto flex-col gap-2"
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : <div className="text-xl">🎨</div>}
                    <div className="font-semibold">授予NFT铸造权限</div>
                    <div className="text-sm opacity-80">MINTER_ROLE</div>
                  </Button>
                )}

                {!hasNFTSkinManagerRole && (hasNFTAdminRole) && (
                  <Button
                    onClick={handleGrantSelfNFTSkinManagerRole}
                    variant="primary"
                    disabled={isLoading}
                    className="p-4 h-auto flex-col gap-2"
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : <div className="text-xl">🎭</div>}
                    <div className="font-semibold">授予皮肤管理权限</div>
                    <div className="text-sm opacity-80">SKIN_MANAGER_ROLE</div>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Advanced Permission Management */}
          {(hasDefaultAdminRole || hasTokenAdminRole || hasNFTAdminRole) && (
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">🛠️ 高级权限管理</h3>
              <p className="text-white/70 mb-6">为任意地址授予或撤销权限</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => setShowGrantModal(true)}
                  variant="primary"
                  className="p-4 h-auto flex-col gap-2"
                >
                  <div className="text-xl">➕</div>
                  <div className="font-semibold">授予权限</div>
                  <div className="text-sm opacity-80">为用户授予角色</div>
                </Button>

                <Button
                  onClick={() => setShowRevokeModal(true)}
                  variant="secondary"
                  className="p-4 h-auto flex-col gap-2"
                >
                  <div className="text-xl">➖</div>
                  <div className="font-semibold">撤销权限</div>
                  <div className="text-sm opacity-80">撤销用户角色</div>
                </Button>

                <Button
                  onClick={() => setShowHistoryModal(true)}
                  variant="ghost"
                  className="p-4 h-auto flex-col gap-2"
                >
                  <div className="text-xl">📋</div>
                  <div className="font-semibold">权限历史</div>
                  <div className="text-sm opacity-80">查看操作记录</div>
                </Button>
              </div>
            </div>
          )}

          {/* No Admin Rights Message */}
          {(!hasDefaultAdminRole && !hasTokenAdminRole && !hasNFTAdminRole) && (
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🔒</div>
                <div className="text-white/70">您没有管理员权限，无法授予其他角色</div>
                <div className="text-white/50 text-sm mt-2">请联系合约部署者获取权限</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-6">📜 权限操作历史</h3>

          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🚧</div>
              <div className="text-white/70">权限历史功能开发中...</div>
              <div className="text-white/50 text-sm mt-2">
                此功能将显示所有权限授予和撤销的历史记录，包括时间戳、操作者、目标地址等详细信息
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACM Tab */}
      {activeTab === 'acm' && (
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-6">🏛️ AccessControlManager 管理</h3>

            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🚧</div>
                <div className="text-white/70">AccessControlManager 功能开发中...</div>
                <div className="text-white/50 text-sm mt-2">
                  此功能将提供统一的权限管理界面，包括角色描述设置、批量权限操作、权限历史追踪等高级功能
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grant Role Modal */}
    {showGrantModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full">
          <h3 className="text-xl font-semibold text-white mb-4">➕ 授予权限</h3>

          <div className="space-y-4">
            {/* Contract Type Selection */}
            <div>
              <label className="block text-white/70 text-sm mb-2">合约类型</label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setGrantForm(prev => ({ ...prev, contractType: 'token', selectedRole: '' }))}
                  variant={grantForm.contractType === 'token' ? 'primary' : 'ghost'}
                  className="flex-1"
                >
                  🪙 代币合约
                </Button>
                <Button
                  onClick={() => setGrantForm(prev => ({ ...prev, contractType: 'nft', selectedRole: '' }))}
                  variant={grantForm.contractType === 'nft' ? 'primary' : 'ghost'}
                  className="flex-1"
                >
                  🎨 NFT合约
                </Button>
              </div>
            </div>

            {/* Target Address */}
            <div>
              <label className="block text-white/70 text-sm mb-2">目标地址</label>
              <input
                type="text"
                value={grantForm.targetAddress}
                onChange={(e) => setGrantForm(prev => ({ ...prev, targetAddress: e.target.value }))}
                placeholder="0x..."
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
              />
              {grantForm.targetAddress && !validateAddress(grantForm.targetAddress) && (
                <div className="text-red-400 text-sm mt-1">请输入有效的地址</div>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-white/70 text-sm mb-2">选择角色</label>
              <div className="space-y-2">
                {getAvailableRoles(grantForm.contractType).map((role) => (
                  <div
                    key={role.hash}
                    onClick={() => setGrantForm(prev => ({ ...prev, selectedRole: role.hash }))}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      grantForm.selectedRole === role.hash
                        ? 'bg-blue-500/20 border-blue-500/50'
                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-medium text-white">{role.displayName}</div>
                    <div className="text-white/60 text-sm">{role.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gas Fee Estimation */}
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3">
              <div className="text-yellow-300 text-sm">
                ⚠️ 此操作需要支付Gas费用，请确保钱包有足够的MON代币
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => setShowGrantModal(false)}
              variant="ghost"
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={handleGrantRole}
              variant="primary"
              disabled={!grantForm.targetAddress || !grantForm.selectedRole || isLoading}
              className="flex-1"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : '授予权限'}
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* Revoke Role Modal */}
    {showRevokeModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full">
          <h3 className="text-xl font-semibold text-white mb-4">➖ 撤销权限</h3>

          <div className="space-y-4">
            {/* Contract Type Selection */}
            <div>
              <label className="block text-white/70 text-sm mb-2">合约类型</label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setRevokeForm(prev => ({ ...prev, contractType: 'token', selectedRole: '' }))}
                  variant={revokeForm.contractType === 'token' ? 'primary' : 'ghost'}
                  className="flex-1"
                >
                  🪙 代币合约
                </Button>
                <Button
                  onClick={() => setRevokeForm(prev => ({ ...prev, contractType: 'nft', selectedRole: '' }))}
                  variant={revokeForm.contractType === 'nft' ? 'primary' : 'ghost'}
                  className="flex-1"
                >
                  🎨 NFT合约
                </Button>
              </div>
            </div>

            {/* Target Address */}
            <div>
              <label className="block text-white/70 text-sm mb-2">目标地址</label>
              <input
                type="text"
                value={revokeForm.targetAddress}
                onChange={(e) => setRevokeForm(prev => ({ ...prev, targetAddress: e.target.value }))}
                placeholder="0x..."
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
              />
              {revokeForm.targetAddress && !validateAddress(revokeForm.targetAddress) && (
                <div className="text-red-400 text-sm mt-1">请输入有效的地址</div>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-white/70 text-sm mb-2">选择角色</label>
              <div className="space-y-2">
                {getAvailableRoles(revokeForm.contractType).map((role) => (
                  <div
                    key={role.hash}
                    onClick={() => setRevokeForm(prev => ({ ...prev, selectedRole: role.hash }))}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      revokeForm.selectedRole === role.hash
                        ? 'bg-red-500/20 border-red-500/50'
                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-medium text-white">{role.displayName}</div>
                    <div className="text-white/60 text-sm">{role.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3">
              <div className="text-red-300 text-sm">
                ⚠️ 撤销权限后，目标地址将无法执行相关操作，请谨慎操作
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => setShowRevokeModal(false)}
              variant="ghost"
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={handleRevokeRole}
              variant="secondary"
              disabled={!revokeForm.targetAddress || !revokeForm.selectedRole || isLoading}
              className="flex-1"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : '撤销权限'}
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* History Modal */}
    {showHistoryModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <h3 className="text-xl font-semibold text-white mb-4">📋 权限操作历史</h3>

          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🚧</div>
              <div className="text-white/70">权限历史功能开发中...</div>
              <div className="text-white/50 text-sm mt-2">
                此功能将显示所有权限授予和撤销的历史记录
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={() => setShowHistoryModal(false)}
              variant="ghost"
            >
              关闭
            </Button>
          </div>
        </div>
      </div>
    )}

      {/* Help Component */}
      <PermissionHelp />
    </div>
  )
}
