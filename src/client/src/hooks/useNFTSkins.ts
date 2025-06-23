import { useState, useEffect } from 'react'
import { useAccount, useContractRead, useContractReads } from 'wagmi'
import { getContractAddress, BubbleSkinNFTABI, isContractDeployed } from '../config/contracts'

const BUBBLE_SKIN_NFT_ADDRESS = getContractAddress('BubbleSkinNFT')
const BUBBLE_SKIN_NFT_ABI = BubbleSkinNFTABI as const

export interface NFTSkin {
  tokenId: string
  templateId: string
  name: string
  description: string
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
  effectType: 'NONE' | 'GLOW' | 'SPARKLE' | 'RAINBOW' | 'LIGHTNING' | 'BUBBLE' | 'FLAME'
  tokenURI: string
  content: string
  colorConfig: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    transparency: number
  }
  serialNumber: number
  mintedAt: number
  originalOwner: string
}

export const useNFTSkins = () => {
  const { address } = useAccount()
  const [skins, setSkins] = useState<NFTSkin[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if contract is deployed
  const contractDeployed = isContractDeployed('BubbleSkinNFT')

  // Get user's NFT token IDs - 优化缓存策略
  const { data: userTokenIds, isLoading: isLoadingTokens, error: tokensError, refetch: refetchTokens } = useContractRead({
    address: BUBBLE_SKIN_NFT_ADDRESS,
    abi: BUBBLE_SKIN_NFT_ABI,
    functionName: 'getUserSkins',
    args: address ? [address] : undefined,
    enabled: !!address && contractDeployed,
    cacheTime: 60_000, // 缓存1分钟
    staleTime: 30_000, // 30秒内认为数据是新鲜的
  })

  // Prepare contract calls for skin info (includes both template and skin data)
  const skinInfoCalls = (userTokenIds as bigint[] || []).map((tokenId) => ({
    address: BUBBLE_SKIN_NFT_ADDRESS,
    abi: BUBBLE_SKIN_NFT_ABI,
    functionName: 'getSkinInfo' as const,
    args: [tokenId],
  }))

  const tokenURICalls = (userTokenIds as bigint[] || []).map((tokenId) => ({
    address: BUBBLE_SKIN_NFT_ADDRESS,
    abi: BUBBLE_SKIN_NFT_ABI,
    functionName: 'tokenURI' as const,
    args: [tokenId],
  }))

  // Get skin info for all user tokens - 优化缓存策略
  const { data: skinInfoData, isLoading: isLoadingInfo, refetch: refetchInfo } = useContractReads({
    contracts: skinInfoCalls,
    enabled: !!userTokenIds && userTokenIds.length > 0,
    cacheTime: 120_000, // 缓存2分钟，NFT元数据变化较少
    staleTime: 60_000,
  })

  // Get token URIs for all user tokens - 优化缓存策略
  const { data: tokenURIs, isLoading: isLoadingURIs, refetch: refetchURIs } = useContractReads({
    contracts: tokenURICalls,
    enabled: !!userTokenIds && userTokenIds.length > 0,
    cacheTime: 300_000, // URI很少变化，缓存5分钟
    staleTime: 300_000,
  })

  useEffect(() => {
    const loading = isLoadingTokens || isLoadingInfo || isLoadingURIs
    setIsLoading(loading)

    if (!contractDeployed) {
      setError('BubbleSkinNFT contract not deployed')
      setSkins([])
      return
    }

    if (tokensError) {
      setError(tokensError.message)
      setSkins([])
      return
    }

    if (!loading && userTokenIds && skinInfoData && tokenURIs) {
      try {
        const processedSkins: NFTSkin[] = (userTokenIds as bigint[]).map((tokenId, index) => {
          const skinInfoResult = skinInfoData[index]?.result as any
          const tokenURI = tokenURIs[index]?.result as string

          if (!skinInfoResult) {
            return null
          }

          const [template, skinInfo] = skinInfoResult

          // Extract template data
          const {
            templateId,
            name,
            description,
            rarity,
            effectType,
            colorConfig,
            content
          } = template

          // Extract skin info data
          const {
            mintedAt,
            originalOwner,
            serialNumber
          } = skinInfo

          const rarityMap = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY']
          const effectMap = ['NONE', 'GLOW', 'SPARKLE', 'RAINBOW', 'LIGHTNING', 'BUBBLE', 'FLAME']

          return {
            tokenId: tokenId.toString(),
            templateId: templateId.toString(),
            name: name || `Skin #${tokenId}`,
            description: description || '',
            rarity: rarityMap[rarity] as NFTSkin['rarity'] || 'COMMON',
            effectType: effectMap[effectType] as NFTSkin['effectType'] || 'NONE',
            tokenURI: tokenURI || '',
            content: content || '',
            colorConfig: {
              primaryColor: colorConfig.primaryColor || '#0066ff',
              secondaryColor: colorConfig.secondaryColor || '#00ccff',
              accentColor: colorConfig.accentColor || '#ffffff',
              transparency: colorConfig.transparency || 255
            },
            serialNumber: Number(serialNumber) || 0,
            mintedAt: Number(mintedAt) || 0,
            originalOwner: originalOwner || ''
          }
        }).filter(Boolean) as NFTSkin[]

        setSkins(processedSkins)
        setError(null)
      } catch (err) {
        console.error('Failed to process skin data:', err)
        setError('Failed to process skin data')
        setSkins([])
      }
    }
  }, [userTokenIds, skinInfoData, tokenURIs, isLoadingTokens, isLoadingInfo, isLoadingURIs, tokensError, contractDeployed])

  const refreshSkins = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        refetchTokens(),
        refetchInfo(),
        refetchURIs()
      ])
    } catch (err) {
      console.error('Failed to refresh skins:', err)
      setError('Failed to refresh skins')
    } finally {
      setIsLoading(false)
    }
  }

  const getSkinByTokenId = (tokenId: string): NFTSkin | undefined => {
    return skins.find(skin => skin.tokenId === tokenId)
  }

  const getSkinsByRarity = (rarity: NFTSkin['rarity']): NFTSkin[] => {
    return skins.filter(skin => skin.rarity === rarity)
  }

  const getSkinsByEffect = (effectType: NFTSkin['effectType']): NFTSkin[] => {
    return skins.filter(skin => skin.effectType === effectType)
  }

  return {
    skins,
    isLoading,
    error,
    refreshSkins,
    getSkinByTokenId,
    getSkinsByRarity,
    getSkinsByEffect,
    totalSkins: skins.length,
    rawTokenIds: userTokenIds
  }
}
