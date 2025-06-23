/**
 * SVG 内容处理工具模块
 * 提供安全的 SVG 解析、验证和渲染功能
 */

// SVG 安全性配置
const ALLOWED_SVG_TAGS = [
  'svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon',
  'text', 'tspan', 'defs', 'clipPath', 'mask', 'pattern', 'linearGradient', 
  'radialGradient', 'stop', 'use', 'symbol', 'marker', 'image'
]

const ALLOWED_SVG_ATTRIBUTES = [
  'viewBox', 'width', 'height', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry',
  'x1', 'y1', 'x2', 'y2', 'points', 'd', 'fill', 'stroke', 'stroke-width',
  'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'opacity',
  'transform', 'id', 'class', 'style', 'gradientUnits', 'offset', 'stop-color',
  'stop-opacity', 'href', 'xlink:href', 'preserveAspectRatio'
]

const DANGEROUS_PATTERNS = [
  /<script[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[\s\S]*?<\/iframe>/gi,
  /<object[\s\S]*?<\/object>/gi,
  /<embed[\s\S]*?>/gi,
  /<link[\s\S]*?>/gi,
  /<meta[\s\S]*?>/gi,
]

/**
 * 检测内容是否为 SVG
 */
export const isSvgContent = (content: string): boolean => {
  if (!content || typeof content !== 'string') return false
  
  const trimmed = content.trim()
  
  // 检查基本的 SVG 结构
  const hasSvgTags = trimmed.startsWith('<svg') && trimmed.includes('</svg>')
  
  // 检查是否包含 SVG 命名空间
  const hasSvgNamespace = trimmed.includes('xmlns="http://www.w3.org/2000/svg"') || 
                         trimmed.includes('xmlns:svg="http://www.w3.org/2000/svg"')
  
  // 检查是否有 viewBox 或基本的 SVG 属性
  const hasSvgAttributes = /viewBox\s*=|width\s*=|height\s*=/i.test(trimmed)
  
  return hasSvgTags && (hasSvgNamespace || hasSvgAttributes)
}

/**
 * 检测内容是否为图片 URL
 */
export const isImageUrl = (content: string): boolean => {
  if (!content || typeof content !== 'string') return false

  const trimmed = content.trim()
  
  // 检查图片扩展名
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i
  
  // 检查 URL 模式
  const urlPattern = /^(https?:\/\/|ipfs:\/\/|\/ipfs\/)/i
  
  // 检查 data URL
  if (trimmed.startsWith('data:image/')) {
    return true
  }
  
  // 如果是 URL 且有图片扩展名
  if (urlPattern.test(trimmed)) {
    return imageExtensions.test(trimmed)
  }
  
  return false
}

/**
 * 检测是否为 IPFS URL
 */
export const isIpfsUrl = (content: string): boolean => {
  if (!content || typeof content !== 'string') return false
  
  const trimmed = content.trim()
  return trimmed.startsWith('ipfs://') || 
         trimmed.includes('/ipfs/') || 
         trimmed.includes('ipfs.io') ||
         trimmed.includes('gateway.pinata.cloud')
}

/**
 * 清理和验证 SVG 内容的安全性
 */
export const sanitizeSvgContent = (content: string): string => {
  if (!content || typeof content !== 'string') return ''
  
  let sanitized = content.trim()
  
  // 移除危险的模式
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '')
  })
  
  // 确保 SVG 有正确的命名空间
  if (!sanitized.includes('xmlns="http://www.w3.org/2000/svg"')) {
    sanitized = sanitized.replace(
      /<svg([^>]*)>/i,
      '<svg$1 xmlns="http://www.w3.org/2000/svg">'
    )
  }
  
  // 添加基本的安全属性
  if (!sanitized.includes('preserveAspectRatio')) {
    sanitized = sanitized.replace(
      /<svg([^>]*)>/i,
      '<svg$1 preserveAspectRatio="xMidYMid meet">'
    )
  }
  
  return sanitized
}

/**
 * 验证 SVG 内容的结构完整性
 */
export const validateSvgStructure = (content: string): { isValid: boolean; error?: string } => {
  if (!content) {
    return { isValid: false, error: 'SVG 内容为空' }
  }
  
  try {
    // 基本的 XML 结构检查
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'image/svg+xml')
    
    // 检查解析错误
    const parserError = doc.querySelector('parsererror')
    if (parserError) {
      return { isValid: false, error: 'SVG 格式错误：' + parserError.textContent }
    }
    
    // 检查是否有 SVG 根元素
    const svgElement = doc.querySelector('svg')
    if (!svgElement) {
      return { isValid: false, error: '缺少 SVG 根元素' }
    }
    
    // 检查是否有危险内容
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(content)) {
        return { isValid: false, error: '包含不安全的内容' }
      }
    }
    
    return { isValid: true }
  } catch (error) {
    return { isValid: false, error: '解析失败：' + (error as Error).message }
  }
}

/**
 * 获取 SVG 的尺寸信息
 */
export const getSvgDimensions = (content: string): { width?: number; height?: number; viewBox?: string } => {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'image/svg+xml')
    const svgElement = doc.querySelector('svg')
    
    if (!svgElement) return {}
    
    const width = svgElement.getAttribute('width')
    const height = svgElement.getAttribute('height')
    const viewBox = svgElement.getAttribute('viewBox')
    
    return {
      width: width ? parseFloat(width) : undefined,
      height: height ? parseFloat(height) : undefined,
      viewBox: viewBox || undefined
    }
  } catch (error) {
    console.warn('Failed to parse SVG dimensions:', error)
    return {}
  }
}

/**
 * 优化 SVG 内容以提升渲染性能
 */
export const optimizeSvgContent = (content: string): string => {
  if (!content) return ''
  
  let optimized = content.trim()
  
  // 移除注释
  optimized = optimized.replace(/<!--[\s\S]*?-->/g, '')
  
  // 移除多余的空白字符
  optimized = optimized.replace(/\s+/g, ' ')
  
  // 确保有 viewBox（如果没有的话）
  if (!optimized.includes('viewBox') && !optimized.includes('width') && !optimized.includes('height')) {
    optimized = optimized.replace(
      /<svg([^>]*)>/i,
      '<svg$1 viewBox="0 0 100 100">'
    )
  }
  
  return optimized
}

/**
 * 创建 SVG 内容的缓存键
 */
export const createSvgCacheKey = (content: string): string => {
  // 使用简单的哈希函数创建缓存键
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为 32 位整数
  }
  return `svg_${Math.abs(hash)}`
}

/**
 * SVG 内容缓存管理
 */
class SvgCache {
  private cache = new Map<string, { content: string; timestamp: number }>()
  private maxSize = 100
  private maxAge = 5 * 60 * 1000 // 5 分钟

  set(key: string, content: string): void {
    // 清理过期的缓存
    this.cleanup()
    
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
    
    this.cache.set(key, {
      content,
      timestamp: Date.now()
    })
  }

  get(key: string): string | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    // 检查是否过期
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key)
      return null
    }
    
    return item.content
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.maxAge) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }
}

// 全局 SVG 缓存实例
export const svgCache = new SvgCache()

/**
 * 格式化内容用于显示
 */
export const formatContentForDisplay = (content: string, maxLength: number = 100): string => {
  if (!content) return ''
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

/**
 * 检测内容类型
 */
export const detectContentType = (content: string): 'svg' | 'image' | 'ipfs' | 'url' | 'text' => {
  if (!content) return 'text'
  
  if (isSvgContent(content)) return 'svg'
  if (isImageUrl(content)) return 'image'
  if (isIpfsUrl(content)) return 'ipfs'
  if (content.includes('http://') || content.includes('https://')) return 'url'
  
  return 'text'
}
