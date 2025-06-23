import { useState, useEffect } from 'react'
import { useAccount, useContractRead } from 'wagmi'
import { formatEther } from 'viem'
import { getContractAddress, BubbleTokenABI, isContractDeployed } from '../config/contracts'

const BUBBLE_TOKEN_ADDRESS = getContractAddress('BubbleToken')
const BUBBLE_TOKEN_ABI = BubbleTokenABI as const

export const useTokenBalance = () => {
  const { address } = useAccount()
  const [balance, setBalance] = useState<string>('0')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if contract is deployed
  const contractDeployed = isContractDeployed('BubbleToken')

  // Use wagmi's useContractRead for BUB token balance
  const { data: bubBalance, isLoading: isBubLoading, error: bubError, refetch } = useContractRead({
    address: BUBBLE_TOKEN_ADDRESS,
    abi: BUBBLE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address && contractDeployed,
    watch: true, // Enable real-time updates
  })

  useEffect(() => {
    setIsLoading(isBubLoading)

    if (!contractDeployed) {
      setError('BubbleToken contract not deployed')
      setBalance('0')
      return
    }

    if (bubError) {
      setError(bubError.message)
      setBalance('0')
    } else if (bubBalance) {
      try {
        const formattedBalance = formatEther(bubBalance as bigint)
        setBalance(parseFloat(formattedBalance).toFixed(2))
        setError(null)
      } catch (err) {
        setError('Failed to format balance')
        setBalance('0')
      }
    }
  }, [bubBalance, isBubLoading, bubError, contractDeployed])

  const refreshBalance = async () => {
    try {
      setIsLoading(true)
      await refetch()
    } catch (err) {
      console.error('Failed to refresh balance:', err)
      setError('Failed to refresh balance')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    balance,
    isLoading,
    error,
    refreshBalance,
    rawBalance: bubBalance
  }
}
