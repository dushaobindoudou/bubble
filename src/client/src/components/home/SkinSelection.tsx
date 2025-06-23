import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { toast } from 'react-hot-toast'
import { useNFTSkins } from '../../hooks/useNFTSkins'
import { AnimatedBubble } from '../ui/AnimatedBubble'
import { Button } from '../ui/Button'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface SkinTemplate {
  templateId: string
  name: string
  description: string
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
  effectType: 'NONE' | 'GLOW' | 'SPARKLE' | 'RAINBOW' | 'LIGHTNING' | 'BUBBLE' | 'FLAME'
  isOwned: boolean
  isEquipped: boolean
  isDefault: boolean
  price?: string
  imageUrl: string
}

export const SkinSelection: React.FC = () => {
  const { address } = useAccount()
  const { skins: nftSkins, isLoading: isLoadingNFTs } = useNFTSkins()
  const [skins, setSkins] = useState<SkinTemplate[]>([])
  const [selectedSkin, setSelectedSkin] = useState<SkinTemplate | null>(null)
  const [equippedSkin, setEquippedSkin] = useState<string>('default')
  const [isLoading, setIsLoading] = useState(true)
  const [isEquipping, setIsEquipping] = useState(false)
  const [filter, setFilter] = useState<'all' | 'owned' | 'available'>('all')

  // Load available skins
  useEffect(() => {
    loadSkins()
  }, [address, nftSkins])

  const loadSkins = async () => {
    setIsLoading(true)
    try {
      // Get equipped skin from localStorage
      const equippedSkinId = localStorage.getItem('bubble_brawl_equipped_skin') || 'default'

      // Create default skin
      const defaultSkin: SkinTemplate = {
        templateId: 'default',
        name: '默认泡泡',
        description: '经典的蓝色泡泡，简单而优雅',
        rarity: 'COMMON',
        effectType: 'NONE',
        isOwned: true,
        isEquipped: equippedSkinId === 'default',
        isDefault: true,
        imageUrl: '/api/placeholder/120/120'
      }

      // Convert NFT skins to SkinTemplate format
      const nftSkinTemplates: SkinTemplate[] = nftSkins.map(nftSkin => ({
        templateId: nftSkin.tokenId,
        name: nftSkin.name,
        description: nftSkin.description || `${nftSkin.rarity} 级别的 ${nftSkin.name}`,
        rarity: nftSkin.rarity,
        effectType: nftSkin.effectType,
        isOwned: true,
        isEquipped: equippedSkinId === nftSkin.tokenId,
        isDefault: false,
        imageUrl: nftSkin.tokenURI || '/api/placeholder/120/120'
      }))

      // Add some mock available skins for purchase
      const availableSkins: SkinTemplate[] = [
        {
          templateId: 'fire',
          name: '火焰泡泡',
          description: '燃烧的火焰特效，热情如火',
          rarity: 'EPIC',
          effectType: 'FLAME',
          isOwned: false,
          isEquipped: false,
          isDefault: false,
          price: '100',
          imageUrl: '/api/placeholder/120/120'
        },
        {
          templateId: 'sparkle',
          name: '星光泡泡',
          description: '闪烁的星光效果，如梦如幻',
          rarity: 'RARE',
          effectType: 'SPARKLE',
          isOwned: false,
          isEquipped: false,
          isDefault: false,
          price: '50',
          imageUrl: '/api/placeholder/120/120'
        }
      ]

      const allSkins = [defaultSkin, ...nftSkinTemplates, ...availableSkins]
      setSkins(allSkins)

      const equipped = allSkins.find(skin => skin.isEquipped)
      if (equipped) {
        setEquippedSkin(equipped.templateId)
        setSelectedSkin(equipped)
      } else {
        setEquippedSkin('default')
        setSelectedSkin(defaultSkin)
      }
    } catch (error) {
      console.error('Failed to load skins:', error)
      toast.error('加载皮肤失败')
    } finally {
      setIsLoading(false)
    }
  }

  const equipSkin = async (skin: SkinTemplate) => {
    if (!skin.isOwned) {
      toast.error('您还没有拥有这个皮肤')
      return
    }

    setIsEquipping(true)
    try {
      // TODO: Implement actual contract call or local storage
      // await skinContract.equipSkin(skin.templateId)
      
      // Update local state
      setSkins(prev => prev.map(s => ({
        ...s,
        isEquipped: s.templateId === skin.templateId
      })))
      setEquippedSkin(skin.templateId)
      
      // Save to localStorage for game integration
      localStorage.setItem('bubble_brawl_equipped_skin', skin.templateId)
      
      toast.success(`已装备 ${skin.name}`)
    } catch (error) {
      console.error('Failed to equip skin:', error)
      toast.error('装备皮肤失败')
    } finally {
      setIsEquipping(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY': return 'from-yellow-400 to-orange-500'
      case 'EPIC': return 'from-purple-400 to-pink-500'
      case 'RARE': return 'from-blue-400 to-cyan-500'
      case 'COMMON': return 'from-gray-400 to-gray-500'
      default: return 'from-gray-400 to-gray-500'
    }
  }

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY': return '传说'
      case 'EPIC': return '史诗'
      case 'RARE': return '稀有'
      case 'COMMON': return '普通'
      default: return '未知'
    }
  }

  const getEffectGradient = (effectType: string) => {
    switch (effectType) {
      case 'RAINBOW': return 'rainbow'
      case 'LIGHTNING': return 'purple'
      case 'FLAME': return 'pink'
      case 'GLOW': return 'cyan'
      case 'SPARKLE': return 'blue'
      default: return 'blue'
    }
  }

  const filteredSkins = skins.filter(skin => {
    switch (filter) {
      case 'owned': return skin.isOwned
      case 'available': return !skin.isOwned
      default: return true
    }
  })

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
        <div className="flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Skin Grid */}
      <div className="lg:col-span-2">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              皮肤选择
            </h2>
            
            {/* Filter Buttons */}
            <div className="flex gap-2">
              {[
                { id: 'all', label: '全部' },
                { id: 'owned', label: '已拥有' },
                { id: 'available', label: '可购买' },
              ].map((filterOption) => (
                <button
                  key={filterOption.id}
                  onClick={() => setFilter(filterOption.id as any)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    filter === filterOption.id
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredSkins.map((skin) => (
              <div
                key={skin.templateId}
                onClick={() => setSelectedSkin(skin)}
                className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  skin.isEquipped
                    ? 'border-green-400 bg-green-500/20'
                    : selectedSkin?.templateId === skin.templateId
                    ? 'border-blue-400 bg-blue-500/20'
                    : skin.isOwned
                    ? 'border-white/20 bg-white/5 hover:border-white/40'
                    : 'border-white/10 bg-white/5 hover:border-white/20 opacity-75'
                }`}
              >
                {/* Equipped Badge */}
                {skin.isEquipped && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    已装备
                  </div>
                )}

                {/* Skin Preview */}
                <div className="aspect-square mb-3 bg-gradient-to-br from-white/10 to-white/5 rounded-xl flex items-center justify-center">
                  <AnimatedBubble 
                    size={64} 
                    gradient={getEffectGradient(skin.effectType) as any}
                    opacity={0.8}
                    animationType="pulse"
                  />
                </div>

                {/* Skin Info */}
                <h3 className="text-white font-semibold text-sm mb-1">{skin.name}</h3>
                <div className={`inline-block px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getRarityColor(skin.rarity)} mb-2`}>
                  {getRarityText(skin.rarity)}
                </div>

                {/* Price for unowned skins */}
                {!skin.isOwned && skin.price && (
                  <div className="flex items-center gap-1 text-yellow-400 text-sm">
                    <AnimatedBubble size={16} gradient="pink" opacity={0.8} />
                    <span>{skin.price} BUB</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skin Preview */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-xl">👁️</span>
          皮肤预览
        </h3>

        {selectedSkin ? (
          <div className="space-y-6">
            {/* Large Preview */}
            <div className="aspect-square bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center">
              <AnimatedBubble 
                size={120} 
                gradient={getEffectGradient(selectedSkin.effectType) as any}
                opacity={0.9}
                animationType="pulse"
                glowIntensity="high"
              />
            </div>

            {/* Skin Details */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-bold text-white">{selectedSkin.name}</h4>
                <p className="text-white/70 text-sm mt-1">{selectedSkin.description}</p>
              </div>

              <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getRarityColor(selectedSkin.rarity)}`}>
                {getRarityText(selectedSkin.rarity)}
              </div>

              {/* Action Button */}
              <div className="pt-4">
                {selectedSkin.isEquipped ? (
                  <div className="text-center p-3 bg-green-500/20 rounded-xl border border-green-400/30">
                    <span className="text-green-400 font-semibold">✓ 当前装备</span>
                  </div>
                ) : selectedSkin.isOwned ? (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => equipSkin(selectedSkin)}
                    loading={isEquipping}
                  >
                    装备皮肤
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => toast('购买功能即将推出', { icon: 'ℹ️' })}
                  >
                    购买 ({selectedSkin.price} BUB)
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="mb-4">
              <AnimatedBubble size={64} gradient="blue" opacity={0.5} />
            </div>
            <p className="text-white/70">选择一个皮肤查看详情</p>
          </div>
        )}
      </div>
    </div>
  )
}
