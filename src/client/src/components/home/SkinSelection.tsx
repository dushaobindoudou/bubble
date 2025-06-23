import React, { useState } from 'react'
import { useNFTSkins } from '../../hooks/useNFTSkins'
import { NFTCollection } from './NFTCollection'
import { MyEquipment } from './MyEquipment'

export const SkinSelection: React.FC = () => {
  const { totalSkins } = useNFTSkins()
  const [activeTab, setActiveTab] = useState<'collection' | 'equipment'>('collection')

  return (
    <div className="space-y-6">
      {/* 标签页导航 */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-2 border border-white/20">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('collection')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'collection'
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="text-xl">🏆</span>
            <span>我的收藏</span>
            {totalSkins > 0 && (
              <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                {totalSkins}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'equipment'
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="text-xl">⚔️</span>
            <span>我的装备</span>
          </button>
        </div>
      </div>

      {/* 标签页内容 */}
      {activeTab === 'collection' ? (
        <NFTCollection />
      ) : (
        <MyEquipment />
      )}
    </div>
  )
}
