import { useMemo } from 'react'
import { useNFTSkins, NFTSkin } from './useNFTSkins'

export interface NFTStats {
  totalCount: number
  rarityBreakdown: {
    LEGENDARY: number
    EPIC: number
    RARE: number
    COMMON: number
  }
  effectBreakdown: {
    [key: string]: number
  }
  estimatedValue: number
  averageValue: number
  recentAcquisitions: NFTSkin[]
  mostValuable: NFTSkin[]
}

export const useNFTStats = () => {
  const { skins, isLoading, error } = useNFTSkins()

  const stats = useMemo((): NFTStats => {
    if (!skins || skins.length === 0) {
      return {
        totalCount: 0,
        rarityBreakdown: {
          LEGENDARY: 0,
          EPIC: 0,
          RARE: 0,
          COMMON: 0
        },
        effectBreakdown: {},
        estimatedValue: 0,
        averageValue: 0,
        recentAcquisitions: [],
        mostValuable: []
      }
    }

    // 稀有度统计
    const rarityBreakdown = skins.reduce((acc, nft) => {
      acc[nft.rarity] = (acc[nft.rarity] || 0) + 1
      return acc
    }, {
      LEGENDARY: 0,
      EPIC: 0,
      RARE: 0,
      COMMON: 0
    })

    // 特效类型统计
    const effectBreakdown = skins.reduce((acc, nft) => {
      acc[nft.effectType] = (acc[nft.effectType] || 0) + 1
      return acc
    }, {} as { [key: string]: number })

    // 价值估算（基于稀有度的简单估算）
    const rarityValues = {
      LEGENDARY: 1000,
      EPIC: 200,
      RARE: 50,
      COMMON: 10
    }

    const estimatedValue = skins.reduce((total, nft) => {
      return total + (rarityValues[nft.rarity] || 10)
    }, 0)

    const averageValue = skins.length > 0 ? estimatedValue / skins.length : 0

    // 最近获得的 NFT（按时间排序，取前5个）
    const recentAcquisitions = [...skins]
      .sort((a, b) => b.mintedAt - a.mintedAt)
      .slice(0, 5)

    // 最有价值的 NFT（按稀有度排序，取前5个）
    const mostValuable = [...skins]
      .sort((a, b) => {
        const rarityOrder = { LEGENDARY: 3, EPIC: 2, RARE: 1, COMMON: 0 }
        const aValue = rarityOrder[a.rarity]
        const bValue = rarityOrder[b.rarity]
        if (aValue !== bValue) return bValue - aValue
        // 如果稀有度相同，按获得时间排序
        return b.mintedAt - a.mintedAt
      })
      .slice(0, 5)

    return {
      totalCount: skins.length,
      rarityBreakdown,
      effectBreakdown,
      estimatedValue,
      averageValue,
      recentAcquisitions,
      mostValuable
    }
  }, [skins])

  // 获取稀有度分布百分比
  const getRarityPercentage = (rarity: keyof NFTStats['rarityBreakdown']): number => {
    if (stats.totalCount === 0) return 0
    return Math.round((stats.rarityBreakdown[rarity] / stats.totalCount) * 100)
  }

  // 获取最常见的特效类型
  const getMostCommonEffect = (): string => {
    const effects = Object.entries(stats.effectBreakdown)
    if (effects.length === 0) return 'NONE'
    
    return effects.reduce((max, current) => 
      current[1] > max[1] ? current : max
    )[0]
  }

  // 获取收藏完整度（假设有100个不同的皮肤模板）
  const getCollectionCompleteness = (): number => {
    const totalPossibleSkins = 100 // 这个值应该从合约或配置中获取
    return Math.min(Math.round((stats.totalCount / totalPossibleSkins) * 100), 100)
  }

  // 获取稀有度等级
  const getCollectorRank = (): string => {
    const { LEGENDARY, EPIC, RARE } = stats.rarityBreakdown
    const rareCount = LEGENDARY + EPIC + RARE
    
    if (LEGENDARY >= 10) return '传说收藏家'
    if (LEGENDARY >= 5) return '史诗收藏家'
    if (EPIC >= 10) return '稀有收藏家'
    if (rareCount >= 20) return '高级收藏家'
    if (stats.totalCount >= 10) return '收藏爱好者'
    if (stats.totalCount >= 5) return '初级收藏家'
    return '新手收藏家'
  }

  // 计算收藏价值趋势（简单的增长模拟）
  const getValueTrend = (): 'up' | 'down' | 'stable' => {
    // 这里可以基于最近获得的NFT稀有度来判断趋势
    const recentRareCount = stats.recentAcquisitions.filter(
      nft => nft.rarity === 'LEGENDARY' || nft.rarity === 'EPIC'
    ).length
    
    if (recentRareCount >= 2) return 'up'
    if (recentRareCount === 0 && stats.recentAcquisitions.length > 0) return 'down'
    return 'stable'
  }

  return {
    stats,
    isLoading,
    error,
    getRarityPercentage,
    getMostCommonEffect,
    getCollectionCompleteness,
    getCollectorRank,
    getValueTrend
  }
}
