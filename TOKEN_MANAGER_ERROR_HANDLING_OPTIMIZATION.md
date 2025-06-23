# 🛠️ TokenManager 错误处理优化

## 🚨 **问题分析**

用户在分配游戏奖励时遇到权限错误：

```
ContractFunctionExecutionError: The contract function "mintGameReward" reverted.
Error: AccessControlUnauthorizedAccount(address account, bytes32 neededRole)
(0x20F49671A6f9ca3733363a90dDabA2234D98F716, 0xeed6f6cf0043b760a9fa371b917380a33d9fce74e6db2f9699f93922d78f979e)
```

**错误原因：** 用户地址 `0x20F49671A6f9ca3733363a90dDabA2234D98F716` 没有 `GAME_REWARD_ROLE` 权限。

---

## ✅ **优化方案实施**

### **1. 增强权限检查系统**

#### **新增权限检查辅助函数**
```typescript
const checkPermissions = (requiredRoles: string[]): { hasPermission: boolean; errorMessage?: string } => {
  const userRoles = []
  if (hasGameRewardRole) userRoles.push('GAME_REWARD_ROLE (游戏奖励角色)')
  if (hasAdminRole) userRoles.push('ADMIN_ROLE (管理员角色)')

  const hasAnyRequiredRole = requiredRoles.some(role => {
    if (role === 'GAME_REWARD_ROLE') return hasGameRewardRole
    if (role === 'ADMIN_ROLE') return hasAdminRole
    return false
  })

  if (!hasAnyRequiredRole) {
    return {
      hasPermission: false,
      errorMessage: `❌ 权限不足！
您当前的权限: ${userRoles.length > 0 ? userRoles.join(', ') : '无'}
需要的权限: ${requiredRoleNames.join(' 或 ')}
解决方案:
1. 前往"权限管理"页面查看详细权限状态
2. 联系合约管理员为您的地址授予相应权限
3. 确认您使用的是正确的钱包地址
您的地址: ${address}`
    }
  }
  return { hasPermission: true }
}
```

### **2. 优化错误处理**

#### **增强的铸造函数错误处理**
```typescript
const mintToAddress = async (to: string, amount: string, reason: string = '') => {
  try {
    // 使用新的权限检查函数
    const permissionCheck = checkPermissions(['GAME_REWARD_ROLE', 'ADMIN_ROLE'])
    if (!permissionCheck.hasPermission) {
      setError(permissionCheck.errorMessage!)
      throw new Error(permissionCheck.errorMessage!)
    }

    // 输入验证
    if (!to || !amount) {
      throw new Error('请填写完整的接收地址和数量')
    }

    if (parseFloat(amount) <= 0) {
      throw new Error('铸造数量必须大于0')
    }

    // 合约调用错误处理
    try {
      await mintGameRewardWrite({
        args: [to as `0x${string}`, amountWei, reason || '管理员铸造']
      })
    } catch (contractError: any) {
      // 解析合约特定错误
      if (contractError.message?.includes('AccessControlUnauthorizedAccount')) {
        throw new Error(`❌ 权限验证失败！
您的地址: ${address}
需要角色: GAME_REWARD_ROLE 或 ADMIN_ROLE
解决方案:
1. 前往"权限管理"页面
2. 联系合约管理员授予您铸造权限
3. 或使用具有相应权限的钱包地址`)
      } else if (contractError.message?.includes('Pausable: paused')) {
        throw new Error('❌ 合约已暂停，无法执行铸造操作')
      } else if (contractError.message?.includes('ERC20InvalidReceiver')) {
        throw new Error('❌ 接收地址无效，请检查地址格式')
      } else {
        throw new Error(`合约调用失败: ${contractError.message || '未知错误'}`)
      }
    }
  } catch (err) {
    console.error('Failed to mint tokens:', err)
    const errorMessage = (err as Error).message
    setError(errorMessage)
    throw new Error(errorMessage)
  }
}
```

### **3. 优化UI权限提示**

#### **增强的权限警告UI**
```tsx
{!canMint && (
  <div className="mt-2 p-3 bg-red-500/20 rounded-xl border border-red-500/30">
    <div className="text-red-300 text-sm font-medium mb-2">
      ⚠️ 权限不足 - 无法执行铸造操作
    </div>
    <div className="text-red-200 text-xs space-y-1">
      <div>• 需要权限: GAME_REWARD_ROLE (游戏奖励角色) 或 ADMIN_ROLE (管理员角色)</div>
      <div>• 解决方案: 前往"权限管理"页面申请权限</div>
      <div>• 您的地址: {address?.slice(0, 6)}...{address?.slice(-4)}</div>
    </div>
  </div>
)}
```

---

## 🔧 **优化的功能**

### **所有需要权限的函数都已优化：**

1. ✅ **`mintToAddress()`** - 游戏奖励铸造
2. ✅ **`releaseTeamTokens()`** - 团队代币释放
3. ✅ **`releaseCommunityTokens()`** - 社区代币释放
4. ✅ **`releaseLiquidityTokens()`** - 流动性代币释放
5. ✅ **`setDailyRewardLimit()`** - 每日限制设置
6. ✅ **`mintGameRewardsBatch()`** - 批量游戏奖励铸造

### **错误处理改进：**

- ✅ **详细的权限检查** - 明确显示用户当前权限和所需权限
- ✅ **中文错误信息** - 用户友好的错误提示
- ✅ **解决方案指导** - 告诉用户如何解决权限问题
- ✅ **合约错误解析** - 将技术错误转换为用户可理解的信息
- ✅ **输入验证** - 在调用合约前验证输入参数

---

## 🎯 **用户解决方案**

### **如果遇到权限错误，用户需要：**

1. **检查当前权限**
   - 前往"权限管理"页面
   - 查看当前拥有的角色权限

2. **申请所需权限**
   - 联系合约管理员
   - 申请 `GAME_REWARD_ROLE` 或 `ADMIN_ROLE` 权限

3. **验证权限授予**
   - 刷新页面重新连接钱包
   - 确认权限状态更新

4. **重试操作**
   - 权限授予后重新尝试铸造操作

---

## 🚀 **优化效果**

### **用户体验改进：**
- ❌ **之前：** 技术性错误信息，用户不知道如何解决
- ✅ **现在：** 清晰的中文错误提示，包含具体解决步骤

### **错误处理增强：**
- ❌ **之前：** 简单的权限检查，错误信息不明确
- ✅ **现在：** 详细的权限分析，具体的错误原因和解决方案

### **开发者友好：**
- ❌ **之前：** 需要查看控制台才能了解错误详情
- ✅ **现在：** UI直接显示权限状态和解决方案

---

## 📋 **测试验证**

✅ **应用程序启动正常** - 无编译错误
✅ **权限检查功能** - 正确识别用户权限状态
✅ **错误信息显示** - 用户友好的中文提示
✅ **UI权限警告** - 清晰的权限不足提示
✅ **解决方案指导** - 明确的操作步骤

TokenManager 现在具有**生产级别的错误处理和用户体验**！ 🎉
