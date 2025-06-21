# 🚀 Bubble Brawl 快速部署指南

## ⚡ 5分钟快速开始

### 1. 环境准备

```bash
# 克隆项目（如果还没有）
git clone <your-repo-url>
cd bubble-brawl

# 安装依赖
npm install

# 复制环境配置
cp .env.example .env
```

### 2. 配置环境变量

编辑 `.env` 文件，至少配置以下必需项：

```bash
# 必需：部署者私钥（测试私钥）
DEPLOYER_PRIVATE_KEY=0x1234567890abcdef...

# 可选：其他配置使用默认值
DEPLOYMENT_ENVIRONMENT=development
CREATE_TEST_DATA=true
VERBOSE_LOGGING=true
```

### 3. 验证配置

```bash
# 验证网络配置
npm run verify-config

# 编译合约
npm run compile

# 运行测试
npm run test:contracts
```

### 4. 部署合约

```bash
# 本地部署测试
npm run deploy:local

# 或者运行简化测试
npx hardhat run scripts/test-deployment.js
```

## 🌐 网络部署

### Monad 测试网部署

1. **获取测试代币**
   - 访问 [Monad 水龙头](https://faucet.monad.xyz)
   - 获取测试 ETH

2. **配置 Monad 网络**
   ```bash
   # .env 文件中添加
   MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
   MONAD_API_KEY=your_api_key_here
   ```

3. **部署到 Monad**
   ```bash
   # 验证 Monad 网络配置
   npm run verify-config:monad
   
   # 部署到 Monad 测试网
   npm run deploy:monad
   ```

### 以太坊 Sepolia 测试网部署

1. **配置 Infura**
   ```bash
   # .env 文件中添加
   INFURA_PROJECT_ID=your_infura_project_id
   ETHEREUM_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
   ```

2. **部署到 Sepolia**
   ```bash
   npm run deploy:sepolia
   ```

## 📋 部署检查清单

### 部署前检查
- [ ] 环境变量已正确配置
- [ ] 账户有足够的测试代币
- [ ] 网络连接正常
- [ ] 合约编译成功
- [ ] 测试全部通过

### 部署后验证
- [ ] 所有合约部署成功
- [ ] 权限配置正确
- [ ] 基本功能测试通过
- [ ] 部署信息已保存

## 🔧 常用命令

```bash
# 开发命令
npm run compile          # 编译合约
npm run test:contracts   # 运行合约测试
npm run test:gas        # 运行 Gas 报告

# 网络验证
npm run verify-config           # 验证本地配置
npm run verify-config:monad     # 验证 Monad 配置
npm run verify-config:sepolia   # 验证 Sepolia 配置

# 部署命令
npm run deploy          # 本地部署
npm run deploy:local    # 本地网络部署
npm run deploy:monad    # Monad 测试网部署
npm run deploy:sepolia  # Sepolia 测试网部署

# 工具命令
npm run node            # 启动本地节点
npm run console         # 打开 Hardhat 控制台
npm run console:monad   # 连接 Monad 控制台
npm run clean           # 清理编译文件
```

## 📊 部署输出示例

成功部署后，您将看到类似输出：

```
🎉 所有合约部署完成！

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

💾 部署信息已保存到: deployments/deployment-monadTestnet-1234567890.json
```

## 🚨 故障排除

### 常见错误及解决方案

1. **余额不足**
   ```
   Error: insufficient funds
   ```
   **解决**: 访问对应网络的水龙头获取测试代币

2. **网络连接失败**
   ```
   Error: could not detect network
   ```
   **解决**: 检查 RPC URL 和网络配置

3. **私钥格式错误**
   ```
   Error: invalid private key
   ```
   **解决**: 确保私钥以 `0x` 开头且长度正确

4. **合约验证失败**
   ```
   Error: verification failed
   ```
   **解决**: 检查 API 密钥和网络配置

### 获取帮助

- 📚 查看完整文档: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- 🔍 检查部署状态: `npx hardhat run scripts/check-deployment.js`
- 🧪 运行部署测试: `npx hardhat run scripts/test-deployment.js`

## 🎯 下一步

部署成功后，您可以：

1. **集成前端**
   - 使用部署的合约地址
   - 配置 Web3 钱包连接

2. **测试游戏功能**
   - 提交游戏会话
   - 测试奖励领取
   - 验证 NFT 交易

3. **监控和维护**
   - 监控合约状态
   - 管理权限配置
   - 处理用户反馈

---

**🎉 恭喜！您已成功部署 Bubble Brawl 智能合约系统！**
