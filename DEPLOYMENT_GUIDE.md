# 🚀 Bubble Brawl 智能合约部署指南

## 📋 概述

本指南将帮助您将 Bubble Brawl 智能合约部署到各种区块链网络，包括 Monad 测试网、以太坊测试网等。

## 🛠️ 环境准备

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制环境变量模板并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入以下必要信息：

```bash
# 必需配置
DEPLOYER_PRIVATE_KEY=your_private_key_here
MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_API_KEY=your_monad_api_key_here

# 可选配置
BUBBLE_TOKEN_NAME=Bubble
BUBBLE_TOKEN_SYMBOL=BUB
BUBBLE_SKIN_NFT_BASE_URI=https://api.bubblebrawl.com/metadata/skins/
```

### 3. 安全检查

⚠️ **重要安全提醒**：
- 永远不要使用主网私钥进行测试
- 确保 `.env` 文件已添加到 `.gitignore`
- 使用专门的测试账户进行部署
- 定期轮换私钥

## 🔍 部署前验证

在部署前，建议先验证网络配置：

```bash
# 验证网络连接和配置
npx hardhat run scripts/verify-network-config.js --network monadTestnet
```

这将检查：
- ✅ 网络连接状态
- ✅ 账户余额
- ✅ 环境变量配置
- ✅ Gas 价格
- ✅ 部署成本估算

## 🌐 支持的网络

### Monad 测试网 (推荐)

```bash
# 使用专用脚本部署到 Monad 测试网
npx hardhat run scripts/deploy-monad-testnet.js --network monadTestnet

# 或使用通用脚本
npx hardhat run scripts/deploy-all-contracts.js --network monadTestnet
```

**网络信息**：
- Chain ID: 10143
- RPC URL: https://testnet-rpc.monad.xyz
- 浏览器: https://testnet.monadexplorer.com
- 水龙头: https://faucet.monad.xyz

### 以太坊 Sepolia 测试网

```bash
npx hardhat run scripts/deploy-all-contracts.js --network sepolia
```

**网络信息**：
- Chain ID: 11155111
- 需要 Infura 项目 ID
- 水龙头: https://sepoliafaucet.com

### 本地开发网络

```bash
# 启动本地节点
npx hardhat node

# 在新终端部署
npx hardhat run scripts/deploy-all-contracts.js --network localhost
```

## 📊 部署流程

### 1. 合约部署顺序

部署脚本将按以下顺序部署合约：

1. **工具合约**
   - RandomGenerator (随机数生成器)
   - AccessControlManager (权限管理器)

2. **核心合约**
   - BubbleToken (游戏代币)
   - BubbleSkinNFT (皮肤 NFT)

3. **游戏合约**
   - GameRewards (游戏奖励系统)
   - Marketplace (NFT 交易市场)

4. **权限配置**
   - 授予必要的角色权限
   - 配置合约间的交互权限

5. **示例数据** (仅开发环境)
   - 创建示例皮肤模板

### 2. 部署输出

部署完成后，您将看到：

```
📋 部署摘要:
============================================================
网络: monadTestnet (Chain ID: 10143)
部署者: 0x1234...5678
时间: 2024-01-01T12:00:00.000Z
------------------------------------------------------------
RandomGenerator     : 0xabcd...1234
AccessControlManager: 0xefgh...5678
BubbleToken         : 0xijkl...9012
BubbleSkinNFT       : 0xmnop...3456
GameRewards         : 0xqrst...7890
Marketplace         : 0xuvwx...1234
============================================================
```

### 3. 部署文件

部署信息将保存到：
- `deployments/deployment-{network}-{timestamp}.json`

## 🔧 配置选项

### 环境变量配置

| 变量名 | 描述 | 默认值 | 必需 |
|--------|------|--------|------|
| `DEPLOYER_PRIVATE_KEY` | 部署者私钥 | - | ✅ |
| `DEPLOYMENT_ENVIRONMENT` | 部署环境 | development | ❌ |
| `GAS_PRICE` | Gas 价格 (Gwei) | 20 | ❌ |
| `GAS_LIMIT` | Gas 限制 | 8000000 | ❌ |
| `CONFIRMATIONS` | 确认区块数 | 2 | ❌ |
| `CREATE_TEST_DATA` | 创建测试数据 | true | ❌ |
| `AUTO_VERIFY_CONTRACTS` | 自动验证合约 | false | ❌ |
| `VERBOSE_LOGGING` | 详细日志 | true | ❌ |

### 合约配置

```bash
# 代币配置
BUBBLE_TOKEN_NAME=Bubble
BUBBLE_TOKEN_SYMBOL=BUB

# NFT 配置
BUBBLE_SKIN_NFT_NAME=Bubble Skin NFT
BUBBLE_SKIN_NFT_SYMBOL=BSKIN
BUBBLE_SKIN_NFT_BASE_URI=https://api.bubblebrawl.com/metadata/skins/

# 市场配置
MARKETPLACE_FEE_PERCENTAGE=250  # 2.5%
MARKETPLACE_FEE_RECIPIENT=0x...

# 游戏奖励配置
GAME_REWARDS_BASE_REWARD=100000000000000000000  # 100 BUB
GAME_REWARDS_KILL_BONUS=10000000000000000000    # 10 BUB
```

## 🧪 测试部署

### 1. 编译合约

```bash
npx hardhat compile
```

### 2. 运行测试

```bash
# 运行所有测试
npx hardhat test

# 运行特定测试
npx hardhat test test/token/BubbleToken.test.js
npx hardhat test test/nft/BubbleSkinNFT.test.js
npx hardhat test test/game/GameRewards.enhanced.test.js
```

### 3. Gas 报告

```bash
REPORT_GAS=true npx hardhat test
```

## 🔍 合约验证

### 自动验证

设置环境变量启用自动验证：

```bash
AUTO_VERIFY_CONTRACTS=true
MONAD_API_KEY=your_api_key_here
```

### 手动验证

```bash
# 验证单个合约
npx hardhat verify --network monadTestnet CONTRACT_ADDRESS "Constructor Arg 1" "Constructor Arg 2"

# 示例：验证 BubbleToken
npx hardhat verify --network monadTestnet 0x1234...5678
```

## 🚨 故障排除

### 常见问题

1. **余额不足**
   ```
   Error: insufficient funds for gas * price + value
   ```
   **解决方案**: 访问对应网络的水龙头获取测试代币

2. **Nonce 错误**
   ```
   Error: nonce has already been used
   ```
   **解决方案**: 等待几秒后重试，或重置账户 nonce

3. **网络连接问题**
   ```
   Error: could not detect network
   ```
   **解决方案**: 检查 RPC URL 和网络配置

4. **合约验证失败**
   ```
   Error: verification failed
   ```
   **解决方案**: 检查 API 密钥和构造函数参数

### 调试技巧

1. **启用详细日志**
   ```bash
   VERBOSE_LOGGING=true npx hardhat run scripts/deploy-all-contracts.js --network monadTestnet
   ```

2. **检查交易状态**
   ```bash
   # 在区块浏览器中查看交易哈希
   # Monad: https://explorer.monad.xyz
   ```

3. **验证合约状态**
   ```bash
   npx hardhat console --network monadTestnet
   ```

## 📞 获取帮助

- 📚 [Hardhat 文档](https://hardhat.org/docs)
- 🌐 [Monad 文档](https://docs.monad.xyz)
- 💬 [项目 Discord/Telegram]
- 🐛 [GitHub Issues](https://github.com/your-repo/issues)

## 🔐 安全最佳实践

1. **私钥管理**
   - 使用硬件钱包（生产环境）
   - 定期轮换私钥
   - 永远不要在代码中硬编码私钥

2. **网络安全**
   - 验证网络 Chain ID
   - 使用官方 RPC 端点
   - 启用交易确认

3. **合约安全**
   - 进行安全审计
   - 使用多重签名钱包
   - 实施时间锁机制

---

**⚠️ 免责声明**: 本指南仅用于开发和测试目的。在生产环境部署前，请进行全面的安全审计和测试。
