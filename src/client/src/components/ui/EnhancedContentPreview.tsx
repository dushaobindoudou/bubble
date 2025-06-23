import React, { useState, useEffect, useMemo } from 'react'
import { LoadingSpinner } from './LoadingSpinner'
import { 
  isSvgContent, 
  isImageUrl, 
  isIpfsUrl, 
  sanitizeSvgContent, 
  validateSvgStructure, 
  optimizeSvgContent,
  createSvgCacheKey,
  svgCache,
  detectContentType,
  formatContentForDisplay
} from '../../utils/svgUtils'

interface EnhancedContentPreviewProps {
  content: string
  templateName: string
  templateId: string | number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  enableFullView?: boolean
  onError?: (error: string) => void
}

export const EnhancedContentPreview: React.FC<EnhancedContentPreviewProps> = ({
  content,
  templateName,
  templateId,
  className = "",
  size = 'md',
  showLabel = true,
  enableFullView = false,
  onError
}) => {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [svgError, setSvgError] = useState<string | null>(null)
  const [showFullContent, setShowFullContent] = useState(false)

  // 内容类型检测和处理
  const contentInfo = useMemo(() => {
    const type = detectContentType(content)
    const isImage = type === 'image'
    const isSvg = type === 'svg'
    const isIpfs = type === 'ipfs'
    
    let processedContent = content
    let validationError: string | null = null

    // SVG 内容处理
    if (isSvg) {
      const cacheKey = createSvgCacheKey(content)
      const cachedContent = svgCache.get(cacheKey)
      
      if (cachedContent) {
        processedContent = cachedContent
      } else {
        // 验证 SVG 结构
        const validation = validateSvgStructure(content)
        if (!validation.isValid) {
          validationError = validation.error || 'SVG 格式错误'
        } else {
          // 清理和优化 SVG 内容
          processedContent = optimizeSvgContent(sanitizeSvgContent(content))
          svgCache.set(cacheKey, processedContent)
        }
      }
    }

    return {
      type,
      isImage,
      isSvg,
      isIpfs,
      processedContent,
      validationError
    }
  }, [content])

  // 错误处理
  useEffect(() => {
    if (contentInfo.validationError) {
      setSvgError(contentInfo.validationError)
      onError?.(contentInfo.validationError)
    } else {
      setSvgError(null)
    }
  }, [contentInfo.validationError, onError])

  // 图片加载处理
  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
    onError?.('图片加载失败')
  }

  // 重试加载
  const handleRetryLoad = () => {
    if (contentInfo.isImage) {
      setImageError(false)
      setImageLoading(true)
    } else if (contentInfo.isSvg) {
      setSvgError(null)
      // 清除缓存并重新处理
      const cacheKey = createSvgCacheKey(content)
      svgCache.clear()
    }
  }

  // 尺寸样式
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'aspect-square',
    lg: 'aspect-square min-h-[200px]'
  }

  // 容器样式
  const containerClass = `
    ${sizeClasses[size]} 
    bg-gradient-to-br from-white/5 to-white/10 
    rounded-xl overflow-hidden relative 
    ${className}
  `

  // 渲染图片内容
  const renderImageContent = () => (
    <>
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      )}
      
      {imageError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 bg-red-500/10">
          <div className="text-3xl mb-2">🖼️</div>
          <div className="text-xs text-center px-4">
            <div className="font-medium mb-1">图片加载失败</div>
            {contentInfo.isIpfs && (
              <div className="text-white/40 mb-2">IPFS 链接可能需要时间加载</div>
            )}
            <button
              onClick={handleRetryLoad}
              className="text-blue-400 hover:text-blue-300 transition-colors text-xs"
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
    </>
  )

  // 渲染 SVG 内容
  const renderSvgContent = () => {
    if (svgError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 bg-red-500/10">
          <div className="text-3xl mb-2">⚠️</div>
          <div className="text-xs text-center px-4">
            <div className="font-medium mb-1">SVG 解析失败</div>
            <div className="text-white/40 mb-2">{svgError}</div>
            <button
              onClick={handleRetryLoad}
              className="text-blue-400 hover:text-blue-300 transition-colors text-xs"
            >
              重试加载
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="w-full h-full flex items-center justify-center p-2 relative">
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%',
            overflow: 'hidden'
          }}
          dangerouslySetInnerHTML={{ __html: contentInfo.processedContent }}
        />
        
        {/* SVG 标签 */}
        {showLabel && (
          <div className="absolute top-2 right-2 bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-500/30">
            SVG
          </div>
        )}
      </div>
    )
  }

  // 渲染默认内容
  const renderDefaultContent = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
      <div className="text-3xl mb-2">
        {contentInfo.type === 'url' ? '🔗' : 
         contentInfo.type === 'text' ? '📄' : '🫧'}
      </div>
      <div className="text-xs text-center px-2">
        {contentInfo.type === 'url' ? 'URL 链接' :
         contentInfo.type === 'text' ? '文本内容' : templateName}
      </div>
    </div>
  )

  // 主渲染
  return (
    <div className={containerClass}>
      {/* 图片内容 */}
      {contentInfo.isImage && renderImageContent()}

      {/* SVG 内容 */}
      {contentInfo.isSvg && renderSvgContent()}

      {/* 默认内容 */}
      {!contentInfo.isImage && !contentInfo.isSvg && renderDefaultContent()}

      {/* 内容类型标签 */}
      {showLabel && !contentInfo.isSvg && (
        <div className="absolute top-2 right-2">
          {contentInfo.isImage && (
            <div className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full border border-green-500/30">
              {contentInfo.isIpfs ? 'IPFS' : 'IMG'}
            </div>
          )}
          {contentInfo.type === 'url' && (
            <div className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-500/30">
              URL
            </div>
          )}
          {contentInfo.type === 'text' && (
            <div className="bg-gray-500/20 text-gray-300 text-xs px-2 py-1 rounded-full border border-gray-500/30">
              TEXT
            </div>
          )}
        </div>
      )}

      {/* 全屏查看按钮 */}
      {enableFullView && (contentInfo.isSvg || contentInfo.isImage) && (
        <button
          onClick={() => setShowFullContent(true)}
          className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full hover:bg-black/70 transition-colors"
        >
          🔍 查看
        </button>
      )}

      {/* 全屏预览模态框 */}
      {showFullContent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{templateName}</h3>
              <button
                onClick={() => setShowFullContent(false)}
                className="text-white/70 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 大尺寸预览 */}
              <div className="aspect-square max-w-md mx-auto bg-white/5 rounded-lg flex items-center justify-center border border-white/10 relative overflow-hidden">
                {contentInfo.isImage ? (
                  <img
                    src={content}
                    alt={`${templateName} 完整预览`}
                    className="w-full h-full object-contain"
                  />
                ) : contentInfo.isSvg ? (
                  <div 
                    className="w-full h-full flex items-center justify-center p-4"
                    dangerouslySetInnerHTML={{ __html: contentInfo.processedContent }}
                  />
                ) : null}
              </div>
              
              {/* 内容详情 */}
              <div className="bg-black/20 rounded-lg p-4">
                <div className="text-sm text-white/70 mb-2">内容详情:</div>
                <div className="text-xs text-white/50 font-mono bg-black/30 rounded p-2 max-h-32 overflow-y-auto">
                  {formatContentForDisplay(content, 500)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
