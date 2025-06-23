# 创建皮肤模板错误修复总结

## 问题描述

用户在尝试创建皮肤模板时遇到错误：
```
Failed to create skin template: Error: Create template function not available
```

## 问题分析

### 1. 根本原因
- **权限不足**: 用户没有创建皮肤模板所需的权限
- **函数配置问题**: `usePrepareContractWrite` 配置不正确
- **合约调用方式**: 使用了过时的API调用方式

### 2. 权限要求
创建皮肤模板需要以下权限之一：
- `SKIN_MANAGER_ROLE`: 皮肤管理员角色
- `ADMIN_ROLE`: 管理员角色

## 修复措施

### 1. 修复合约调用方式
**修改前:**
```typescript
const { config: createTemplateConfig } = usePrepareContractWrite({
  address: BUBBLE_SKIN_NFT_ADDRESS,
  abi: BUBBLE_SKIN_NFT_ABI,
  functionName: 'createSkinTemplate',
})
const { write: createTemplate } = useContractWrite(createTemplateConfig)
```

**修改后:**
```typescript
const { write: createTemplate, isLoading: isCreatingTemplate } = useContractWrite({
  address: BUBBLE_SKIN_NFT_ADDRESS,
  abi: BUBBLE_SKIN_NFT_ABI,
  functionName: 'createSkinTemplate',
})
```

### 2. 添加权限检查
```typescript
// 检查用户权限
const { data: hasSkinManagerRole } = useContractRead({
  address: BUBBLE_SKIN_NFT_ADDRESS,
  abi: BUBBLE_SKIN_NFT_ABI,
  functionName: 'hasRole',
  args: ['0x15a28d26fa1bf736cf7edc9922607171ccb09c3c73b808e7772a3013e068a522', address], // SKIN_MANAGER_ROLE
  enabled: !!address,
})

const { data: hasAdminRole } = useContractRead({
  address: BUBBLE_SKIN_NFT_ADDRESS,
  abi: BUBBLE_SKIN_NFT_ABI,
  functionName: 'hasRole',
  args: ['0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c217759', address], // ADMIN_ROLE
  enabled: !!address,
})

// 在创建函数中检查权限
const createSkinTemplate = async (params: CreateSkinTemplateParams) => {
  if (!hasSkinManagerRole && !hasAdminRole) {
    throw new Error('You do not have permission to create skin templates. Need SKIN_MANAGER_ROLE or ADMIN_ROLE.')
  }
  // ... 其余逻辑
}
```

### 3. 更新UI显示
- 添加权限不足的提示信息
- 禁用没有权限时的按钮
- 显示当前用户的权限状态

### 4. 修复函数调用
**修改前:**
```typescript
await createTemplate({
  args: [/* 参数 */]
})
```

**修改后:**
```typescript
createTemplate({
  args: [/* 参数 */]
})
```

## 权限授予方法

### 方法1: 使用前端权限管理界面
1. 访问管理员页面的"权限管理"标签
2. 如果您有管理员权限，可以为自己授予皮肤管理权限

### 方法2: 使用脚本授予权限
```bash
cd src/contracts
npx hardhat run scripts/grant-skin-permissions.js --network monadTestnet
```

### 方法3: 手动调用合约函数
使用区块链浏览器或其他工具调用以下函数：
```solidity
// 授予皮肤管理员权限
grantRole(SKIN_MANAGER_ROLE, userAddress)

// 或授予管理员权限
grantRole(ADMIN_ROLE, userAddress)
```

## 角色权限说明

### SKIN_MANAGER_ROLE
- 权限哈希: `0x15a28d26fa1bf736cf7edc9922607171ccb09c3c73b808e7772a3013e068a522`
- 功能:
  - 创建皮肤模板
  - 更新皮肤模板状态
  - 修改皮肤模板内容

### ADMIN_ROLE
- 权限哈希: `0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c217759`
- 功能:
  - 所有皮肤管理功能
  - 授予和撤销其他角色
  - 系统管理功能

### MINTER_ROLE
- 权限哈希: `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6`
- 功能:
  - 铸造皮肤NFT
  - 批量铸造

## 验证修复

### 1. 检查权限
在浏览器控制台中验证权限：
```javascript
// 检查是否有皮肤管理权限
console.log('Can create template:', canCreateTemplate)
console.log('Has SKIN_MANAGER_ROLE:', hasSkinManagerRole)
console.log('Has ADMIN_ROLE:', hasAdminRole)
```

### 2. 测试创建模板
1. 确保有正确权限
2. 填写模板信息
3. 点击创建按钮
4. 检查是否成功创建

### 3. 检查错误处理
- 权限不足时应显示相应错误信息
- 按钮应正确禁用
- 错误信息应清晰明确

## 当前状态

- ✅ 修复了合约调用方式
- ✅ 添加了权限检查
- ✅ 更新了UI显示
- ✅ 创建了权限授予脚本
- ⏳ 需要授予用户权限

## 下一步行动

1. **立即执行**:
   - 运行权限授予脚本
   - 验证权限是否正确授予
   - 测试创建模板功能

2. **如果问题持续**:
   - 检查合约地址是否正确
   - 验证网络连接
   - 检查钱包是否连接到正确网络

3. **长期改进**:
   - 实现更细粒度的权限控制
   - 添加权限申请流程
   - 建立权限审计机制

## 注意事项

1. **权限安全**: 只授予必要的权限，避免过度授权
2. **网络确认**: 确保连接到正确的网络（Monad Testnet）
3. **Gas费用**: 权限授予操作需要支付Gas费用
4. **权限持久性**: 权限授予后会永久保存在区块链上

## 联系信息

如果问题仍然存在，请提供：
1. 当前连接的钱包地址
2. 权限检查的结果
3. 完整的错误信息
4. 是否已执行权限授予步骤
