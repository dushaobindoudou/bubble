import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useNFTSkins } from '../../hooks/useNFTSkins'
import { AnimatedBubble } from '../ui/AnimatedBubble'
import { Button } from '../ui/Button'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { EnhancedContentPreview } from '../ui/EnhancedContentPreview'
import { SellNFTDialog } from '../marketplace/SellNFTDialog'

interface EquipmentSkin {
  templateId: string
  name: string
  description: string
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
  effectType: 'NONE' | 'GLOW' | 'SPARKLE' | 'RAINBOW' | 'LIGHTNING' | 'BUBBLE' | 'FLAME'
  isOwned: boolean
  isEquipped: boolean
  isDefault: boolean
  content?: string
  tokenId?: string
  serialNumber?: number
  mintedAt?: number
}

export const MyEquipment: React.FC = () => {
  const { address } = useAccount()
  const navigate = useNavigate()
  const { skins: nftSkins, totalSkins } = useNFTSkins()
  const [equipment, setEquipment] = useState<EquipmentSkin[]>([])
  const [selectedSkin, setSelectedSkin] = useState<EquipmentSkin | null>(null)
  const [, setEquippedSkin] = useState<string>('default')
  const [isLoading, setIsLoading] = useState(true)
  const [isEquipping, setIsEquipping] = useState(false)
  const [filter, setFilter] = useState<'all' | 'equipped' | 'nft'>('all')
  const [sellNFT, setSellNFT] = useState<any>(null)
  const [showSellDialog, setShowSellDialog] = useState(false)

  // 加载用户装备
  useEffect(() => {
    loadEquipment()
  }, [address, nftSkins])

  const loadEquipment = async () => {
    setIsLoading(true)
    try {
      // 获取当前装备的皮肤
      const equippedSkinId = localStorage.getItem('bubble_brawl_equipped_skin') || 'default'

      // 创建默认皮肤
      const defaultSkin: EquipmentSkin = {
        templateId: 'default',
        name: '默认泡泡',
        description: '经典的蓝色泡泡，简单而优雅。这是每个玩家的起始皮肤。',
        rarity: 'COMMON',
        effectType: 'NONE',
        isOwned: true,
        isEquipped: equippedSkinId === 'default',
        isDefault: true,
        content: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="#0066ff" stroke="#004499" stroke-width="2"/></svg>'
      }

      // 转换 NFT 皮肤为装备格式
      const nftEquipment: EquipmentSkin[] = nftSkins.map(nftSkin => ({
        templateId: nftSkin.tokenId,
        name: nftSkin.name,
        description: nftSkin.description || `${nftSkin.rarity} 级别的 ${nftSkin.name}`,
        rarity: nftSkin.rarity,
        effectType: nftSkin.effectType,
        isOwned: true,
        isEquipped: equippedSkinId === nftSkin.tokenId,
        isDefault: false,
        content: nftSkin.content,
        tokenId: nftSkin.tokenId,
        serialNumber: nftSkin.serialNumber,
        mintedAt: nftSkin.mintedAt
      }))

      const allEquipment = [defaultSkin, ...nftEquipment]
      setEquipment(allEquipment)

      // 设置当前装备的皮肤为选中状态
      const equipped = allEquipment.find(skin => skin.isEquipped)
      if (equipped) {
        setEquippedSkin(equipped.templateId)
        setSelectedSkin(equipped)
      } else {
        setEquippedSkin('default')
        setSelectedSkin(defaultSkin)
      }
    } catch (error) {
      console.error('Failed to load equipment:', error)
      toast.error('加载装备失败')
    } finally {
      setIsLoading(false)
    }
  }

  const equipSkin = async (skin: EquipmentSkin) => {
    if (!skin.isOwned) {
      toast.error('您还没有拥有这个皮肤')
      return
    }

    setIsEquipping(true)
    try {
      // 更新本地状态
      setEquipment(prev => prev.map(s => ({
        ...s,
        isEquipped: s.templateId === skin.templateId
      })))
      setEquippedSkin(skin.templateId)

      // 保存到 localStorage 供游戏使用
      localStorage.setItem('bubble_brawl_equipped_skin', skin.templateId)

      toast.success(`已装备 ${skin.name}`)
    } catch (error) {
      console.error('Failed to equip skin:', error)
      toast.error('装备皮肤失败')
    } finally {
      setIsEquipping(false)
    }
  }

  const handleSellNFT = (skin: EquipmentSkin) => {
    if (skin.isDefault) {
      toast.error('默认皮肤无法出售')
      return
    }

    if (!skin.tokenId) {
      toast.error('只有 NFT 皮肤可以出售')
      return
    }

    // 转换为 NFTSkin 格式
    const nftSkin = {
      tokenId: skin.tokenId,
      templateId: skin.templateId,
      name: skin.name,
      description: skin.description,
      rarity: skin.rarity,
      effectType: skin.effectType,
      content: skin.content || '',
      serialNumber: skin.serialNumber || 0,
      mintedAt: skin.mintedAt || 0
    }

    setSellNFT(nftSkin)
    setShowSellDialog(true)
  }

  const handleSellSuccess = () => {
    // 刷新装备列表
    loadEquipment()
    toast.success('NFT 上架成功！')
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
      case 'EPIC': return 'from-purple-500/20 to-pink-500/20 border-purple-500/30'
      case 'RARE': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
      default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/30'
    }
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY': return '👑'
      case 'EPIC': return '💎'
      case 'RARE': return '⭐'
      default: return '🔹'
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

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '默认装备'
    return new Date(timestamp * 1000).toLocaleDateString('zh-CN')
  }

  // 筛选装备
  const filteredEquipment = equipment.filter(skin => {
    switch (filter) {
      case 'equipped': return skin.isEquipped
      case 'nft': return !skin.isDefault
      default: return true
    }
  })

  if (!address) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
        <div className="text-6xl mb-4">🔗</div>
        <h3 className="text-xl font-semibold text-white mb-2">连接钱包</h3>
        <p className="text-white/70 mb-4">请连接您的钱包以查看装备</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
          <div className="ml-4 text-white/70">正在加载您的装备...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 装备统计 */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">⚔️</span>
          我的装备
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{equipment.length}</div>
            <div className="text-white/70 text-sm">总装备</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{totalSkins}</div>
            <div className="text-white/70 text-sm">NFT 皮肤</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {equipment.filter(e => e.rarity === 'LEGENDARY' || e.rarity === 'EPIC').length}
            </div>
            <div className="text-white/70 text-sm">稀有装备</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">1</div>
            <div className="text-white/70 text-sm">当前装备</div>
          </div>
        </div>
      </div>

      {/* 筛选和控制 */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-2">
            {[
              { id: 'all', label: '全部装备', icon: '⚔️' },
              { id: 'equipped', label: '当前装备', icon: '✅' },
              { id: 'nft', label: 'NFT 皮肤', icon: '🎨' },
            ].map((filterOption) => (
              <button
                key={filterOption.id}
                onClick={() => setFilter(filterOption.id as any)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1 ${
                  filter === filterOption.id
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{filterOption.icon}</span>
                {filterOption.label}
              </button>
            ))}
          </div>

          <Button
            onClick={() => navigate('/store')}
            variant="primary"
            size="sm"
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            🛍️ 获取更多装备
          </Button>
        </div>
      </div>

      {/* 装备展示 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 装备列表 */}
        <div className="lg:col-span-2">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <div className="mb-4 text-white/70 text-sm">
              找到 {filteredEquipment.length} 个装备
            </div>
            
            {filteredEquipment.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎒</div>
                <h3 className="text-xl font-semibold text-white mb-2">暂无装备</h3>
                <p className="text-white/70 mb-6">快去获取一些酷炫的皮肤装备吧！</p>
                <Button onClick={() => navigate('/store')} variant="primary">
                  🛍️ 前往商店
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredEquipment.map((skin) => (
                  <div
                    key={skin.templateId}
                    onClick={() => setSelectedSkin(skin)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                      skin.isEquipped
                        ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-400/50 ring-2 ring-green-400/30'
                        : selectedSkin?.templateId === skin.templateId
                        ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-400/50 ring-2 ring-blue-400/30'
                        : `bg-gradient-to-r ${getRarityColor(skin.rarity)} hover:scale-105`
                    }`}
                  >
                    {/* 装备状态标签 */}
                    <div className="flex justify-between items-start mb-3">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRarityColor(skin.rarity)}`}>
                        {getRarityIcon(skin.rarity)} {getRarityText(skin.rarity)}
                      </div>
                      {skin.isEquipped && (
                        <div className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium border border-green-500/30">
                          ✅ 已装备
                        </div>
                      )}
                    </div>

                    {/* 装备预览 */}
                    <div className="mb-3">
                      {skin.content ? (
                        <EnhancedContentPreview
                          content={skin.content}
                          templateName={skin.name}
                          templateId={skin.templateId}
                          size="md"
                          showLabel={false}
                        />
                      ) : (
                        <div className="aspect-square bg-gradient-to-br from-white/10 to-white/5 rounded-xl flex items-center justify-center">
                          <AnimatedBubble 
                            size={64} 
                            gradient={getEffectGradient(skin.effectType) as any}
                            opacity={0.8}
                            animationType="pulse"
                          />
                        </div>
                      )}
                    </div>

                    {/* 装备信息 */}
                    <div className="space-y-2">
                      <h3 className="text-white font-semibold text-sm truncate">{skin.name}</h3>
                      <p className="text-white/70 text-xs line-clamp-2">{skin.description}</p>
                      
                      <div className="flex items-center justify-between text-xs text-white/60">
                        {skin.tokenId ? (
                          <>
                            <span>Token #{skin.tokenId}</span>
                            <span>{formatDate(skin.mintedAt)}</span>
                          </>
                        ) : (
                          <span>默认装备</span>
                        )}
                      </div>

                      <div className="space-y-2 mt-2">
                        {!skin.isEquipped && (
                          <Button
                            onClick={() => equipSkin(skin)}
                            variant="primary"
                            size="sm"
                            className="w-full"
                            loading={isEquipping}
                          >
                            装备
                          </Button>
                        )}

                        {!skin.isDefault && skin.tokenId && (
                          <Button
                            onClick={() => handleSellNFT(skin)}
                            variant="secondary"
                            size="sm"
                            className="w-full"
                          >
                            💰 出售
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 装备详情预览 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">👁️</span>
            装备详情
          </h3>
          
          {selectedSkin ? (
            <div className="space-y-4">
              {/* 大预览 */}
              <div className="aspect-square bg-gradient-to-br from-white/10 to-white/5 rounded-2xl overflow-hidden">
                {selectedSkin.content ? (
                  <EnhancedContentPreview
                    content={selectedSkin.content}
                    templateName={selectedSkin.name}
                    templateId={selectedSkin.templateId}
                    size="lg"
                    showLabel={true}
                    enableFullView={true}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <AnimatedBubble 
                      size={120} 
                      gradient={getEffectGradient(selectedSkin.effectType) as any}
                      opacity={0.9}
                      animationType="pulse"
                      glowIntensity="high"
                    />
                  </div>
                )}
              </div>
              
              {/* 装备详情 */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-lg font-bold text-white">{selectedSkin.name}</h4>
                  <p className="text-white/70 text-sm mt-1">{selectedSkin.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/60">稀有度:</span>
                    <div className="text-white font-medium">{getRarityText(selectedSkin.rarity)}</div>
                  </div>
                  <div>
                    <span className="text-white/60">特效:</span>
                    <div className="text-white font-medium">{selectedSkin.effectType}</div>
                  </div>
                  {selectedSkin.tokenId && (
                    <>
                      <div>
                        <span className="text-white/60">Token ID:</span>
                        <div className="text-white font-medium">#{selectedSkin.tokenId}</div>
                      </div>
                      <div>
                        <span className="text-white/60">序列号:</span>
                        <div className="text-white font-medium">#{selectedSkin.serialNumber}</div>
                      </div>
                    </>
                  )}
                  <div className="col-span-2">
                    <span className="text-white/60">获得时间:</span>
                    <div className="text-white font-medium">{formatDate(selectedSkin.mintedAt)}</div>
                  </div>
                </div>

                {!selectedSkin.isEquipped && (
                  <Button
                    onClick={() => equipSkin(selectedSkin)}
                    variant="primary"
                    className="w-full"
                    loading={isEquipping}
                  >
                    装备此皮肤
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="aspect-square bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <AnimatedBubble size={64} gradient="blue" opacity={0.5} />
                <p className="text-white/70 mt-4">选择一个装备查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 出售 NFT 对话框 */}
      {showSellDialog && sellNFT && (
        <SellNFTDialog
          nft={sellNFT}
          isOpen={showSellDialog}
          onClose={() => {
            setShowSellDialog(false)
            setSellNFT(null)
          }}
          onSuccess={handleSellSuccess}
        />
      )}
    </div>
  )
}
