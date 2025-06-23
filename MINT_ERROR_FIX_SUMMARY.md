# Token合约Mint错误修复总结

## 问题描述

用户在使用Token管理界面时遇到以下错误：
```
useTokenAdmin.ts:146 ContractFunctionExecutionError: The contract function "mint" reverted.
Contract Call:
  address:   0xd323f3339396Cf6C1E31b8Ede701B34360eC4730
  function:  mint(address to, uint256 amount)
  args:          (0xaf51fbbf1dd33218a587a194b19a097bbd2c74cf, 1000000000000000000)
  sender:    0x20F49671A6f9ca3733363a90dDabA2234D98F716
```

## 根本原因分析

1. **ABI不匹配**: 前端使用的ABI文件包含了`mint`函数，但实际的BubbleToken合约中没有这个函数
2. **函数名错误**: BubbleToken合约使用的是`mintGameReward`函数，而不是简单的`mint`函数
3. **权限检查缺失**: 前端没有检查用户是否有相应的权限来调用铸造函数
4. **参数不匹配**: `mintGameReward`函数需要3个参数（to, amount, reason），而前端只传递了2个参数

## 修复措施

### 1. 更新ABI文件
- 重新编译合约生成正确的ABI文件
- 更新 `src/client/src/contracts/abis/BubbleToken.json`
- 更新 `src/client/src/contracts/abis/BubbleSkinNFT.json`

### 2. 修复前端函数调用
**修改前:**
```typescript
const { write: mintWrite } = useContractWrite({
  address: BUBBLE_TOKEN_ADDRESS,
  abi: BUBBLE_TOKEN_ABI,
  functionName: 'mint',
})

await mintWrite({
  args: [to as `0x${string}`, amountWei]
})
```

**修改后:**
```typescript
const { write: mintGameRewardWrite } = useContractWrite({
  address: BUBBLE_TOKEN_ADDRESS,
  abi: BUBBLE_TOKEN_ABI,
  functionName: 'mintGameReward',
})

await mintGameRewardWrite({
  args: [to as `0x${string}`, amountWei, reason]
})
```

### 3. 添加权限检查
```typescript
// 检查用户权限
const { data: hasGameRewardRole } = useContractRead({
  address: BUBBLE_TOKEN_ADDRESS,
  abi: BUBBLE_TOKEN_ABI,
  functionName: 'hasGameRewardRole',
  args: [address],
  enabled: !!address,
})

// 在铸造函数中添加权限验证
const mintToAddress = async (to: string, amount: string, reason: string = '') => {
  if (!hasGameRewardRole && !hasAdminRole) {
    throw new Error('You do not have permission to mint tokens. Need GAME_REWARD_ROLE or ADMIN_ROLE.')
  }
  // ... 其余逻辑
}
```

### 4. 修复皮肤合约类似问题
- 更新 `useSkinAdmin.ts` 中的 `mintSkin` 函数调用
- 修正参数数量：`mintSkin` 只需要 `to` 和 `templateId` 两个参数
- 对于批量铸造，使用循环调用单个 `mintSkin` 函数

### 5. 创建权限管理界面
- 新增 `PermissionManager` 组件
- 显示当前用户的权限状态
- 提供自助授权功能（如果用户有管理员权限）
- 集成到管理员界面中

### 6. 用户界面改进
- 在没有权限时禁用相关按钮
- 显示权限不足的提示信息
- 添加权限状态指示器

## 合约权限结构

### BubbleToken合约角色
- `DEFAULT_ADMIN_ROLE`: 超级管理员，可以管理所有角色
- `ADMIN_ROLE`: 管理员，可以释放各种代币池
- `GAME_REWARD_ROLE`: 游戏奖励角色，可以铸造游戏奖励代币
- `MINTER_ROLE`: 铸造者角色

### BubbleSkinNFT合约角色
- `DEFAULT_ADMIN_ROLE`: 超级管理员
- `ADMIN_ROLE`: 管理员
- `SKIN_MANAGER_ROLE`: 皮肤管理员，可以创建皮肤模板
- `MINTER_ROLE`: 铸造者，可以铸造NFT

## 权限授予方法

### 方法1: 使用前端权限管理界面
1. 访问管理员页面的"权限管理"标签
2. 如果您有管理员权限，可以为自己授予其他角色
3. 点击相应的授权按钮

### 方法2: 使用脚本（如果网络连接正常）
```bash
cd src/contracts
npx hardhat run scripts/grant-roles.js --network monadTestnet
```

### 方法3: 直接调用合约函数
使用区块链浏览器或其他工具直接调用合约的权限授予函数。

## 测试验证

修复完成后，请验证以下功能：

1. **代币铸造**: 确认可以成功铸造BUB代币
2. **NFT铸造**: 确认可以成功铸造皮肤NFT
3. **权限检查**: 确认权限不足时显示正确的错误信息
4. **权限管理**: 确认权限管理界面正常工作

## 部署的合约地址

- **BubbleToken**: `0xd323f3339396Cf6C1E31b8Ede701B34360eC4730`
- **BubbleSkinNFT**: `0x20F49671A6f9ca3733363a90dDabA2234D98F716`
- **网络**: Monad Testnet (Chain ID: 10143)

## 注意事项

1. 确保钱包连接到正确的网络（Monad Testnet）
2. 确保有足够的MON代币支付Gas费用
3. 权限授予操作需要管理员权限
4. 所有权限变更都会记录在区块链上，不可撤销

## 后续改进建议

1. 添加更详细的错误处理和用户提示
2. 实现权限变更历史记录查看
3. 添加批量权限管理功能
4. 考虑实现权限过期机制
5. 添加权限审计日志功能
