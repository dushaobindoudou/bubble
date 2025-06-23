import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

// Role constants (these should match the contract)
export const ROLES = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
  GAME_ADMIN_ROLE: '0x4741414d455f41444d494e5f524f4c45000000000000000000000000000000' as `0x${string}`, // keccak256("GAME_ADMIN_ROLE")
  TOKEN_ADMIN_ROLE: '0x544f4b454e5f41444d494e5f524f4c4500000000000000000000000000000000' as `0x${string}`, // keccak256("TOKEN_ADMIN_ROLE")
  NFT_ADMIN_ROLE: '0x4e46545f41444d494e5f524f4c45000000000000000000000000000000000000' as `0x${string}`, // keccak256("NFT_ADMIN_ROLE")
} as const

export type AdminRole = keyof typeof ROLES

interface AdminAccess {
  isAdmin: boolean
  hasGameAdminRole: boolean
  hasTokenAdminRole: boolean
  hasNFTAdminRole: boolean
  isLoading: boolean
  error: string | null
  checkRole: (role: AdminRole) => boolean
}

export const useAdminAccess = (): AdminAccess => {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // For demo purposes, we'll simulate admin access
  // In production, this would call the AccessControlManager contract
  const isDefaultAdmin = false // Simulate no default admin for safety
  const isGameAdmin = true // Allow game admin access for demo
  const isTokenAdmin = true // Allow token admin access for demo
  const isNFTAdmin = true // Allow NFT admin access for demo

  // All loading states are false in demo mode
  useEffect(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  const checkRole = (role: AdminRole): boolean => {
    switch (role) {
      case 'DEFAULT_ADMIN_ROLE':
        return Boolean(isDefaultAdmin)
      case 'GAME_ADMIN_ROLE':
        return Boolean(isGameAdmin)
      case 'TOKEN_ADMIN_ROLE':
        return Boolean(isTokenAdmin)
      case 'NFT_ADMIN_ROLE':
        return Boolean(isNFTAdmin)
      default:
        return false
    }
  }

  const hasGameAdminRole = Boolean(isGameAdmin) || Boolean(isDefaultAdmin)
  const hasTokenAdminRole = Boolean(isTokenAdmin) || Boolean(isDefaultAdmin)
  const hasNFTAdminRole = Boolean(isNFTAdmin) || Boolean(isDefaultAdmin)
  const isAdmin = Boolean(isDefaultAdmin) || hasGameAdminRole || hasTokenAdminRole || hasNFTAdminRole

  return {
    isAdmin,
    hasGameAdminRole,
    hasTokenAdminRole,
    hasNFTAdminRole,
    isLoading,
    error,
    checkRole,
  }
}

// Hook for checking specific admin permissions
export const useRequireAdmin = (requiredRole?: AdminRole) => {
  const adminAccess = useAdminAccess()
  const { address } = useAccount()

  const hasRequiredPermission = requiredRole 
    ? adminAccess.checkRole(requiredRole)
    : adminAccess.isAdmin

  return {
    ...adminAccess,
    hasRequiredPermission,
    canAccess: !!address && hasRequiredPermission,
  }
}
