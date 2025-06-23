import React, { useState } from 'react'
import { useSkinAdmin } from '../../hooks/useSkinAdmin'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Button } from '../ui/Button'
import { toast } from 'react-hot-toast'

// Content detection and preview utilities
const isImageUrl = (content: string): boolean => {
  if (!content) return false

  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i

  // Check for URLs (HTTP/HTTPS/IPFS)
  const urlPattern = /^(https?:\/\/|ipfs:\/\/|\/ipfs\/)/i

  // If it's a URL and has image extension
  if (urlPattern.test(content.trim())) {
    return imageExtensions.test(content.trim())
  }

  // Check for data URLs (base64 images)
  if (content.trim().startsWith('data:image/')) {
    return true
  }

  return false
}

const isSvgContent = (content: string): boolean => {
  if (!content) return false
  const trimmed = content.trim()
  return trimmed.startsWith('<svg') && trimmed.includes('</svg>')
}

const isIpfsUrl = (content: string): boolean => {
  if (!content) return false
  const trimmed = content.trim()
  return trimmed.startsWith('ipfs://') || trimmed.includes('/ipfs/') || trimmed.includes('ipfs.io')
}

const formatContentForDisplay = (content: string, maxLength: number = 100): string => {
  if (!content) return ''
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

// Content Preview Card Component
interface ContentPreviewCardProps {
  content: string
  templateName: string
  templateId: number
}

const ContentPreviewCard: React.FC<ContentPreviewCardProps> = ({ content, templateName, templateId }) => {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [showFullContent, setShowFullContent] = useState(false)

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  // Determine content type
  const isImage = isImageUrl(content)
  const isSvg = isSvgContent(content)
  const isIpfs = isIpfsUrl(content)

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/60 text-xs font-medium">内容预览</span>
        {(isSvg || (!isImage && content.length > 100)) && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
          >
            {showFullContent ? '收起' : '查看完整'}
          </button>
        )}
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden min-h-[400px]">
        {/* Image Content */}
        {isImage && (
          <div className="relative aspect-square bg-gradient-to-br from-white/5 to-white/10 rounded-lg overflow-hidden">
            {/* Image Type Label */}
            <div className="absolute top-2 right-2 z-10 bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full border border-green-500/30">
              {isIpfs ? 'IPFS' : 'IMG'}
            </div>

            {imageLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5">
                <LoadingSpinner size="sm" />
                <div className="text-white/50 text-xs mt-2">加载中...</div>
              </div>
            )}

            {imageError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 bg-red-500/10">
                <div className="text-3xl mb-2">🖼️</div>
                <div className="text-xs text-center px-4">
                  <div className="font-medium mb-1">图片加载失败</div>
                  {isIpfs && <div className="text-white/40">IPFS 链接可能需要时间加载</div>}
                  <button
                    onClick={() => {
                      setImageError(false)
                      setImageLoading(true)
                    }}
                    className="mt-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    重试加载
                  </button>
                </div>
              </div>
            ) : (
              <img
                src={content}
                alt={`${templateName} 预览`}
                className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
                style={{ opacity: imageLoading ? 0 : 1 }}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
              />
            )}

            {/* Image overlay with template info and actions */}
            {!imageLoading && !imageError && (
              <>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <div className="text-white text-xs font-medium truncate mb-1">
                    {templateName}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-white/70 text-xs">
                      模板 #{templateId}
                    </div>
                    <a
                      href={content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                    >
                      🔗 查看原图
                    </a>
                  </div>
                </div>

                {/* Hover overlay for better interaction */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200" />
              </>
            )}
          </div>
        )}

        {/* SVG Content */}
        {isSvg && (
          <div className="p-3">
            <div className="bg-white/10 rounded-lg p-3 border border-white/10">
              {showFullContent ? (
                <div className="space-y-2">
                  <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center border border-white/10 relative overflow-hidden">
                    <div
                      className="w-full h-full flex items-center justify-center p-2"
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                    {/* SVG Label */}
                    <div className="absolute top-2 right-2 bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-500/30">
                      SVG
                    </div>
                  </div>
                  <div className="max-h-32 overflow-y-auto bg-black/20 rounded-lg p-2">
                    <pre className="text-xs text-white/70 font-mono whitespace-pre-wrap break-all">
                      {content}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center border border-white/10 relative overflow-hidden">
                    <div
                      className="w-full h-full flex items-center justify-center p-2"
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                    {/* SVG Label */}
                    <div className="absolute top-2 right-2 bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-500/30">
                      SVG
                    </div>
                  </div>
                  <div className="text-xs text-white/50 font-mono bg-black/20 rounded p-2">
                    {formatContentForDisplay(content, 60)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Text/Code Content */}
        {!isImage && !isSvg && content && (
          <div className="p-3">
            <div className="bg-white/10 rounded-lg p-3 border border-white/10 relative">
              {/* Content Type Label */}
              <div className="absolute top-2 right-2 bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-500/30">
                {content.includes('http') ? 'URL' : 'TEXT'}
              </div>

              {showFullContent ? (
                <div className="max-h-40 overflow-y-auto bg-black/20 rounded-lg p-3 mt-6">
                  <pre className="text-xs text-white/70 font-mono whitespace-pre-wrap break-all">
                    {content}
                  </pre>
                </div>
              ) : (
                <div className="mt-6">
                  <div className="text-xs text-white/70 font-mono bg-black/20 rounded-lg p-3">
                    {formatContentForDisplay(content, 120)}
                  </div>
                  {content.includes('http') && (
                    <div className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      <a
                        href={content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        🔗 打开链接
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty/Invalid Content */}
        {!content && (
          <div className="p-6 flex flex-col items-center justify-center text-white/40">
            <div className="text-2xl mb-2">📄</div>
            <div className="text-xs">暂无内容</div>
          </div>
        )}
      </div>
    </div>
  )
}

export const SkinManager: React.FC = () => {
  const {
    templates,
    templateCount,
    rarityOptions,
    effectOptions,
    hasSkinManagerRole,
    hasAdminRole,
    hasMinterRole,
    canCreateTemplate,
    canMintSkin,
    canUpdateTemplate,
    isLoading,
    isLoadingTemplates,
    isCreatingTemplate,
    isMintingSkin,
    isUpdatingTemplate,
    contractConnected,
    error,
    createSkinTemplate,
    mintSkinToAddress,
    toggleTemplateStatus,
    refreshData,
    testContractConnection,
  } = useSkinAdmin()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMintModal, setShowMintModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    rarity: 0,
    effectType: 0,
    primaryColor: '#0066ff',
    secondaryColor: '#00ccff',
    accentColor: '#ffffff',
    transparency: 255,
    content: '',
    maxSupply: 1000,
  })
  
  const [mintForm, setMintForm] = useState({
    templateId: 0,
    to: '',
    quantity: 1,
  })

  const handleCreateTemplate = async () => {
    try {
      // Validate form data
      if (!createForm.name.trim()) {
        toast.error('请输入皮肤名称')
        return
      }

      if (!createForm.description.trim()) {
        toast.error('请输入皮肤描述')
        return
      }

      if (createForm.maxSupply <= 0) {
        toast.error('最大供应量必须大于0')
        return
      }

      if (!createForm.content.trim()) {
        toast.error('请输入SVG内容或链接')
        return
      }

      await createSkinTemplate({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        rarity: createForm.rarity,
        effectType: createForm.effectType,
        colorConfig: {
          primaryColor: createForm.primaryColor,
          secondaryColor: createForm.secondaryColor,
          accentColor: createForm.accentColor,
          transparency: createForm.transparency,
        },
        content: createForm.content.trim(),
        maxSupply: createForm.maxSupply,
      })
      toast.success('皮肤模板创建成功！')
      setShowCreateModal(false)
      resetCreateForm()
    } catch (err) {
      console.error('Failed to create template:', err)
      toast.error('创建失败: ' + (err as Error).message)
    }
  }

  const handleMintSkin = async () => {
    try {
      await mintSkinToAddress({
        templateId: mintForm.templateId,
        to: mintForm.to,
        quantity: mintForm.quantity,
      })
      toast.success(`成功铸造 ${mintForm.quantity} 个皮肤 NFT`)
      setShowMintModal(false)
      setMintForm({ templateId: 0, to: '', quantity: 1 })
    } catch (err) {
      toast.error('铸造失败，请重试')
    }
  }

  const handleToggleTemplate = async (templateId: number, isActive: boolean) => {
    try {
      await toggleTemplateStatus(templateId, !isActive)
      toast.success(`皮肤模板已${isActive ? '禁用' : '启用'}`)
    } catch (err) {
      toast.error('操作失败，请重试')
    }
  }

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      description: '',
      rarity: 0,
      effectType: 0,
      primaryColor: '#0066ff',
      secondaryColor: '#00ccff',
      accentColor: '#ffffff',
      transparency: 255,
      content: '',
      maxSupply: 1000,
    })
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'COMMON': return 'from-gray-500 to-gray-600'
      case 'RARE': return 'from-blue-500 to-blue-600'
      case 'EPIC': return 'from-purple-500 to-purple-600'
      case 'LEGENDARY': return 'from-yellow-500 to-orange-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-white">🎨 皮肤管理</h2>
            {/* Contract Connection Status */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              contractConnected
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${contractConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              {contractConnected ? '合约已连接' : '合约连接失败'}
            </div>
          </div>
          <p className="text-white/70">创建皮肤模板和管理 NFT 铸造</p>
          {!canCreateTemplate && (
            <div className="mt-2 p-2 bg-red-500/20 rounded-lg border border-red-500/30">
              <div className="text-red-300 text-sm">
                ⚠️ 您没有创建模板权限。需要 SKIN_MANAGER_ROLE 或 ADMIN_ROLE 权限。
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          {!contractConnected && (
            <Button
              onClick={testContractConnection}
              variant="secondary"
              disabled={isLoading}
            >
              重新连接
            </Button>
          )}
          <Button onClick={refreshData} variant="ghost" disabled={isLoading}>
            🔄 刷新数据
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            disabled={!canCreateTemplate}
          >
            ➕ 创建皮肤模板
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">📊 皮肤统计</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/30">
            <div className="text-blue-300 text-sm mb-1">总模板数</div>
            <div className="text-white font-bold text-2xl">{templateCount}</div>
          </div>
          <div className="p-4 bg-green-500/20 rounded-2xl border border-green-500/30">
            <div className="text-green-300 text-sm mb-1">活跃模板</div>
            <div className="text-white font-bold text-2xl">
              {templates.filter(t => t.isActive).length}
            </div>
          </div>
          <div className="p-4 bg-purple-500/20 rounded-2xl border border-purple-500/30">
            <div className="text-purple-300 text-sm mb-1">总铸造量</div>
            <div className="text-white font-bold text-2xl">
              {templates.reduce((sum, t) => sum + t.currentSupply, 0)}
            </div>
          </div>
          <div className="p-4 bg-orange-500/20 rounded-2xl border border-orange-500/30">
            <div className="text-orange-300 text-sm mb-1">最大供应量</div>
            <div className="text-white font-bold text-2xl">
              {templates.reduce((sum, t) => sum + t.maxSupply, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">⚡ 快速操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => setShowMintModal(true)}
            variant="primary"
            className="p-6 h-auto flex-col gap-2"
            disabled={templates.length === 0}
          >
            <div className="text-2xl">🎨</div>
            <div className="font-semibold">铸造皮肤 NFT</div>
            <div className="text-sm opacity-80">为指定地址铸造皮肤 NFT</div>
          </Button>
          
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            className="p-6 h-auto flex-col gap-2"
          >
            <div className="text-2xl">✨</div>
            <div className="font-semibold">创建新模板</div>
            <div className="text-sm opacity-80">设计新的皮肤模板</div>
          </Button>
        </div>
      </div>

      {/* Skin Templates */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">🎭 皮肤模板列表</h3>
        
        {isLoadingTemplates ? (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" />
            <div className="text-white/70 mt-4">正在加载皮肤模板...</div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎨</div>
            <div className="text-white/70 mb-4">暂无皮肤模板</div>
            <Button onClick={() => setShowCreateModal(true)} variant="primary">
              创建第一个模板
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.templateId}
                className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-200"
              >
                {/* Template Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-white font-semibold">#{template.templateId}</div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                    template.isActive 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {template.isActive ? '✅ 活跃' : '❌ 禁用'}
                  </div>
                </div>

                {/* Template Info */}
                <div className="space-y-2 mb-4">
                  <div className="text-white font-medium">{template.name}</div>
                  <div className="text-white/60 text-sm">{template.description}</div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getRarityColor(template.rarity)}`}>
                      {template.rarity}
                    </div>
                    <div className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/80">
                      {template.effectType}
                    </div>
                  </div>
                  
                  {/* Enhanced Minting Statistics */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">铸造进度</span>
                      <span className="text-white font-medium">
                        {template.currentSupply} / {template.maxSupply}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          template.currentSupply / template.maxSupply > 0.8
                            ? 'bg-gradient-to-r from-red-500 to-red-400'
                            : template.currentSupply / template.maxSupply > 0.5
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                            : 'bg-gradient-to-r from-green-500 to-green-400'
                        }`}
                        style={{
                          width: `${Math.min((template.currentSupply / template.maxSupply) * 100, 100)}%`
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/50">
                        {((template.currentSupply / template.maxSupply) * 100).toFixed(1)}% 已铸造
                      </span>
                      <span className={`font-medium ${
                        template.currentSupply >= template.maxSupply
                          ? 'text-red-400'
                          : template.currentSupply / template.maxSupply > 0.8
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}>
                        {template.currentSupply >= template.maxSupply
                          ? '🔴 已售罄'
                          : template.currentSupply / template.maxSupply > 0.8
                          ? '🟡 即将售罄'
                          : '🟢 充足库存'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Preview Card */}
                <ContentPreviewCard
                  content={template.content}
                  templateName={template.name}
                  templateId={template.templateId}
                />

                {/* Color Preview */}
                <div className="flex gap-2 mb-4">
                  <div 
                    className="w-6 h-6 rounded-full border border-white/20"
                    style={{ backgroundColor: template.colorConfig.primaryColor }}
                    title="主色"
                  />
                  <div 
                    className="w-6 h-6 rounded-full border border-white/20"
                    style={{ backgroundColor: template.colorConfig.secondaryColor }}
                    title="副色"
                  />
                  <div 
                    className="w-6 h-6 rounded-full border border-white/20"
                    style={{ backgroundColor: template.colorConfig.accentColor }}
                    title="强调色"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setMintForm(prev => ({ ...prev, templateId: template.templateId }))
                      setShowMintModal(true)
                    }}
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    disabled={!template.isActive || template.currentSupply >= template.maxSupply}
                  >
                    {template.currentSupply >= template.maxSupply ? '已售罄' : '铸造'}
                  </Button>
                  <Button
                    onClick={() => handleToggleTemplate(template.templateId, template.isActive)}
                    variant="ghost"
                    size="sm"
                    disabled={isUpdatingTemplate}
                  >
                    {template.isActive ? '禁用' : '启用'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-4">✨ 创建皮肤模板</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">皮肤名称</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    placeholder="炫酷泡泡皮肤"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-2">最大供应量</label>
                  <input
                    type="number"
                    value={createForm.maxSupply}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, maxSupply: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    placeholder="1000"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-2">描述</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 h-20 resize-none"
                  placeholder="描述这个皮肤的特色..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">稀有度</label>
                  <select
                    value={createForm.rarity}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, rarity: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                  >
                    {rarityOptions.map((option) => (
                      <option key={option.value} value={option.value} className="bg-gray-800">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-2">效果类型</label>
                  <select
                    value={createForm.effectType}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, effectType: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                  >
                    {effectOptions.map((option) => (
                      <option key={option.value} value={option.value} className="bg-gray-800">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-2">颜色配置</label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/60 text-xs mb-1">主色</label>
                    <input
                      type="color"
                      value={createForm.primaryColor}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-white/20 bg-white/10"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1">副色</label>
                    <input
                      type="color"
                      value={createForm.secondaryColor}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-white/20 bg-white/10"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1">强调色</label>
                    <input
                      type="color"
                      value={createForm.accentColor}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, accentColor: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-white/20 bg-white/10"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-2">SVG 内容</label>
                <textarea
                  value={createForm.content}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 h-32 resize-none font-mono text-sm"
                  placeholder="<svg>...</svg> 或 IPFS 链接"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowCreateModal(false)
                  resetCreateForm()
                }}
                variant="ghost"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleCreateTemplate}
                variant="primary"
                className="flex-1"
                disabled={isCreatingTemplate || !createForm.name || !createForm.description}
              >
                {isCreatingTemplate ? <LoadingSpinner size="sm" /> : '创建模板'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mint Modal */}
      {showMintModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">🎨 铸造皮肤 NFT</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">皮肤模板</label>
                <select
                  value={mintForm.templateId}
                  onChange={(e) => setMintForm(prev => ({ ...prev, templateId: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                >
                  <option value={0} className="bg-gray-800">选择模板...</option>
                  {templates.filter(t => t.isActive).map((template) => (
                    <option key={template.templateId} value={template.templateId} className="bg-gray-800">
                      #{template.templateId} - {template.name} ({template.currentSupply}/{template.maxSupply})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-2">接收地址</label>
                <input
                  type="text"
                  value={mintForm.to}
                  onChange={(e) => setMintForm(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="0x..."
                />
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-2">数量</label>
                <input
                  type="number"
                  value={mintForm.quantity}
                  onChange={(e) => setMintForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="1"
                  min="1"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowMintModal(false)}
                variant="ghost"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleMintSkin}
                variant="primary"
                className="flex-1"
                disabled={isMintingSkin || !mintForm.templateId || !mintForm.to || mintForm.quantity < 1}
              >
                {isMintingSkin ? <LoadingSpinner size="sm" /> : '铸造'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/20 rounded-2xl border border-red-500/30">
          <div className="text-red-400 font-medium">错误</div>
          <div className="text-red-300 text-sm">{error}</div>
        </div>
      )}
    </div>
  )
}
