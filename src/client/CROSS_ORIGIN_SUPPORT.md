# 🌐 跨域脚本加载支持文档

## 📋 概述

GamePage组件现在支持完整的跨域脚本和CSS加载功能，包括CORS配置、重试机制、超时处理和子资源完整性检查。

## ✅ 支持的跨域功能

### 1. **CORS (跨域资源共享) 支持**
- ✅ **Anonymous模式**: 不发送凭据的跨域请求
- ✅ **Use-credentials模式**: 发送凭据的跨域请求
- ✅ **自动检测**: 自动为HTTP/HTTPS URL启用跨域支持
- ✅ **灵活配置**: 支持自定义crossOrigin属性

### 2. **增强的错误处理**
- ✅ **重试机制**: 可配置的重试次数和递增延迟
- ✅ **超时处理**: 可配置的加载超时时间
- ✅ **详细日志**: 完整的加载过程日志记录
- ✅ **错误恢复**: 自动重试失败的资源加载

### 3. **安全性增强**
- ✅ **子资源完整性 (SRI)**: 支持integrity属性验证
- ✅ **安全加载**: 防止恶意脚本注入
- ✅ **重复检测**: 避免重复加载相同资源

## 🔧 技术实现

### **跨域配置接口**
```typescript
interface CrossOriginLoadOptions {
  crossOrigin?: 'anonymous' | 'use-credentials' | string
  timeout?: number        // 超时时间 (毫秒)
  retries?: number       // 重试次数
  integrity?: string     // 子资源完整性哈希
}
```

### **脚本加载函数**
```typescript
const loadScript = (src: string, options: CrossOriginLoadOptions = {}): Promise<void>
```

**特性:**
- 🔄 **自动重试**: 失败时自动重试，支持递增延迟
- ⏰ **超时控制**: 可配置的加载超时时间
- 🔒 **CORS支持**: 自动为跨域URL设置crossOrigin
- 🛡️ **完整性检查**: 支持SRI验证
- 📝 **详细日志**: 完整的加载状态日志

### **CSS加载函数**
```typescript
const loadCSS = (href: string, options: CrossOriginLoadOptions = {}): Promise<void>
```

**特性:**
- 🎨 **样式表加载**: 动态加载CSS文件
- 🔄 **重试机制**: 失败时自动重试
- 🌐 **跨域支持**: 支持CDN样式表加载
- ⏰ **超时处理**: 防止长时间等待

## 📖 使用示例

### **基本用法**
```typescript
// 加载本地脚本
await loadScript('/game/js/app.js')

// 加载跨域脚本
await loadScript('//code.jquery.com/jquery-2.2.0.min.js', {
  crossOrigin: 'anonymous'
})
```

### **高级配置**
```typescript
// 带完整配置的跨域加载
await loadScript('https://cdn.example.com/library.js', {
  crossOrigin: 'anonymous',
  timeout: 15000,
  retries: 3,
  integrity: 'sha256-abc123...'
})

// CSS跨域加载
await loadCSS('https://fonts.googleapis.com/css2?family=Roboto', {
  crossOrigin: 'anonymous',
  timeout: 10000,
  retries: 2
})
```

### **当前游戏资源配置**
```typescript
// CSS加载 (本地)
await loadCSS('/game/css/main.css', {
  timeout: 10000,
  retries: 1
})

// jQuery加载 (CDN跨域)
await loadScript('//code.jquery.com/jquery-2.2.0.min.js', { 
  crossOrigin: 'anonymous',
  timeout: 15000,
  retries: 3
})

// 游戏脚本加载 (本地)
await loadScript('/game/js/app.js', { 
  timeout: 20000,
  retries: 2
})
```

## 🛡️ 安全考虑

### **CORS策略**
- **Anonymous**: 适用于公共CDN资源
- **Use-credentials**: 适用于需要认证的资源
- **自动检测**: 为HTTP/HTTPS URL自动启用

### **子资源完整性 (SRI)**
```typescript
await loadScript('https://cdn.example.com/library.js', {
  integrity: 'sha256-abc123def456...',
  crossOrigin: 'anonymous'
})
```

### **内容安全策略 (CSP) 兼容**
- 支持CSP script-src和style-src指令
- 兼容nonce和hash-based CSP
- 自动处理跨域资源的CSP要求

## 🔍 错误处理

### **错误类型**
1. **网络错误**: 连接失败、DNS解析失败
2. **CORS错误**: 跨域策略阻止
3. **超时错误**: 加载时间过长
4. **完整性错误**: SRI验证失败

### **重试策略**
- **递增延迟**: 1秒、2秒、3秒...
- **最大重试**: 可配置的重试次数
- **智能重试**: 区分临时和永久错误

### **日志记录**
```
✅ Script loaded successfully (attempt 1): //code.jquery.com/jquery-2.2.0.min.js
❌ Failed to load script (attempt 1): https://example.com/script.js
🔄 Retrying script load: https://example.com/script.js
⏰ Script loading timeout, retrying: https://example.com/script.js
```

## 🌍 浏览器兼容性

### **支持的浏览器**
- ✅ Chrome 30+
- ✅ Firefox 18+
- ✅ Safari 7+
- ✅ Edge 12+
- ✅ IE 10+ (部分支持)

### **功能支持**
- ✅ **crossOrigin属性**: 现代浏览器全支持
- ✅ **Promise**: ES6+ 或 polyfill
- ✅ **async/await**: ES2017+ 或 Babel转译
- ⚠️ **SRI**: IE不支持，其他现代浏览器支持

## 🚀 性能优化

### **加载优化**
- **并行加载**: 多个资源同时加载
- **缓存检测**: 避免重复加载
- **预加载**: 可选的资源预加载
- **压缩**: 支持gzip/brotli压缩

### **错误恢复**
- **快速失败**: 快速检测不可用资源
- **降级策略**: 可选的备用资源URL
- **用户反馈**: 清晰的错误状态显示

## 📝 最佳实践

1. **为CDN资源设置crossOrigin**: 确保错误信息可见
2. **使用SRI**: 验证第三方资源完整性
3. **设置合理超时**: 平衡用户体验和网络条件
4. **配置重试**: 处理临时网络问题
5. **监控加载**: 记录加载性能和错误率

这个跨域支持系统为GamePage提供了强大而灵活的资源加载能力，确保在各种网络环境下都能可靠地加载游戏资源。
