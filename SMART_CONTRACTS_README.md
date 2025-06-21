# 🎮 Bubble Brawl 智能合约系统

## 📋 项目概述

Bubble Brawl 是一个基于区块链的泡泡大作战游戏，集成了完整的 Web3 功能，包括代币经济、NFT 皮肤系统、游戏奖励机制和 NFT 交易市场。

## 🏗️ 合约架构

### 📁 目录结构

```
src/contracts/
├── token/                    # 代币合约
│   ├── BubbleToken.sol      # $BUB 游戏代币
│   └── interfaces/
│       └── IBubbleToken.sol
├── nft/                     # NFT 合约
│   ├── BubbleSkinNFT.sol   # 泡泡皮肤 NFT
│   └── interfaces/
│       └── IBubbleSkinNFT.sol
├── game/                    # 游戏相关合约
│   ├── GameRewards.sol     # 游戏奖励系统
│   ├── Marketplace.sol     # NFT 交易市场
│   └── interfaces/
│       └── IGameRewards.sol
├── utils/                   # 工具合约
│   ├── RandomGenerator.sol # 随机数生成器
│   └── AccessControlManager.sol # 权限管理器
└── governance/              # 治理合约（预留）
```

## 🪙 代币合约 (BubbleToken)

### 核心功能
- **ERC-20 标准**: 完全兼容的代币实现
- **游戏奖励铸造**: 支持游戏内奖励分发
- **代币分配管理**: 团队、社区、游戏奖励池分配
- **销毁机制**: 支持代币销毁以控制通胀

### 主要特性
- 总供应量: 10 亿 BUB
- 游戏奖励池: 40% (4 亿 BUB)
- 团队分配: 20% (2 亿 BUB)
- 社区分配: 40% (4 亿 BUB)
- 权限控制: 基于角色的访问控制

### 关键函数
```solidity
function mintGameReward(address to, uint256 amount, string memory reason) external
function releaseTeamTokens(address to, uint256 amount) external
function releaseCommunityTokens(address to, uint256 amount) external
function burn(uint256 amount) external
```

## 🎨 NFT 合约 (BubbleSkinNFT)

### 核心功能
- **ERC-721 标准**: 完全兼容的 NFT 实现
- **皮肤模板系统**: 管理员可创建皮肤模板
- **稀有度系统**: 普通、稀有、史诗、传说四个等级
- **属性系统**: 颜色配置、特效类型、动画效果
- **批量操作**: 支持批量铸造和管理

### 稀有度等级
- **COMMON (普通)**: 基础皮肤，大量供应
- **RARE (稀有)**: 特殊效果，中等供应
- **EPIC (史诗)**: 高级特效，少量供应
- **LEGENDARY (传说)**: 顶级特效，极少供应

### 特效类型
- NONE, GLOW, SPARKLE, RAINBOW, LIGHTNING, BUBBLE, FLAME

### 皮肤内容系统
- **SVG 支持**: 直接存储 SVG 矢量图形代码，支持动态和可缩放的皮肤
- **URL 支持**: 支持 HTTP/HTTPS 和 IPFS 链接，指向外部图片资源
- **内容验证**: 自动验证内容格式，确保只接受有效的 SVG 或 URL 格式

### 支持的内容格式
- **SVG 格式**: `<svg width="100" height="100">...</svg>`
- **HTTP URL**: `http://example.com/skin.png`
- **HTTPS URL**: `https://example.com/skin.png`
- **IPFS URL**: `ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG`

### 关键函数
```solidity
function createSkinTemplate(string memory name, string memory description, RarityLevel rarity, EffectType effectType, ColorConfig memory colorConfig, string memory content, uint256 maxSupply) external returns (uint256)
function mintSkin(address to, uint256 templateId) external returns (uint256)
function mintRandomSkin(address to, RarityLevel rarity) external returns (uint256)
function updateTemplateContent(uint256 templateId, string memory content) external
function getUserSkins(address user) external view returns (uint256[] memory)
```

## 🎮 游戏奖励合约 (GameRewards)

### 核心功能
- **游戏表现奖励**: 基于排名、击杀、存活时间等计算奖励
- **防作弊机制**: 会话验证、每日限制
- **NFT 奖励**: 特殊成就可获得稀有皮肤
- **奖励历史**: 完整的奖励记录和统计

### 奖励计算公式
```
总奖励 = 基础奖励 + 排名奖励 + 击杀奖励 + 存活奖励 + 体积奖励
```

### 奖励配置
- 基础奖励: 100 BUB
- 击杀奖励: 10 BUB/击杀
- 存活奖励: 5 BUB/分钟
- 体积奖励: 1 BUB/1000质量
- 最大奖励: 1000 BUB

### 关键函数
```solidity
function distributeReward(GameSession memory session) external
function calculateReward(GameSession memory session) external view returns (uint256)
function getPlayerSessions(address player) external view returns (GameSession[] memory)
```

## 🛒 交易市场合约 (Marketplace)

### 核心功能
- **NFT 交易**: 支持皮肤 NFT 买卖
- **多代币支付**: 支持多种 ERC-20 代币支付
- **手续费机制**: 可配置的交易手续费
- **交易历史**: 完整的交易记录

### 交易流程
1. 卖家挂单出售 NFT
2. 买家浏览并选择 NFT
3. 买家支付代币购买
4. 自动转移 NFT 和代币
5. 收取交易手续费

### 关键函数
```solidity
function listNFT(address nftContract, uint256 tokenId, address paymentToken, uint256 price, uint256 duration) external
function buyNFT(uint256 listingId) external
function getActiveListings(uint256 offset, uint256 limit) external view
```

## 🔧 工具合约

### RandomGenerator (随机数生成器)
- 安全的伪随机数生成
- 支持范围随机数和加权选择
- 防预测和操控机制

### AccessControlManager (权限管理器)
- 统一的权限管理系统
- 角色继承和权限委托
- 权限变更历史记录

## 🚀 部署指南

### 环境要求
- Node.js >= 16
- Hardhat 开发框架
- OpenZeppelin 合约库

### 部署步骤

1. **安装依赖**
```bash
npm install
```

2. **编译合约**
```bash
npx hardhat compile
```

3. **运行测试**
```bash
npx hardhat test
```

4. **部署到本地网络**
```bash
npx hardhat node
npx hardhat run scripts/deploy-all-contracts.js --network localhost
```

5. **部署到测试网**
```bash
npx hardhat run scripts/deploy-all-contracts.js --network monad-testnet
```

## 🧪 测试覆盖

### 代币合约测试
- ✅ 基本 ERC-20 功能
- ✅ 游戏奖励铸造
- ✅ 代币分配管理
- ✅ 权限控制
- ✅ 销毁机制

### NFT 合约测试
- ✅ 基本 ERC-721 功能
- ✅ 皮肤模板管理
- ✅ 铸造和批量操作
- ✅ 权限控制
- ✅ 查询功能

### 运行测试
```bash
# 运行所有测试
npx hardhat test

# 运行特定测试
npx hardhat test test/token/BubbleToken.test.js
npx hardhat test test/nft/BubbleSkinNFT.test.js
```

## 🔐 安全考虑

### 权限控制
- 使用 OpenZeppelin AccessControl 进行角色管理
- 最小权限原则
- 多重签名支持（推荐生产环境）

### 防重入攻击
- 所有外部调用使用 ReentrancyGuard
- 状态更新在外部调用之前

### 随机数安全
- 当前使用伪随机数（开发/测试）
- 生产环境建议使用 Chainlink VRF

### 输入验证
- 所有用户输入进行严格验证
- 防止整数溢出/下溢
- 地址有效性检查

## 📊 Gas 优化

### 批量操作
- 支持批量铸造 NFT
- 批量权限管理
- 减少交易次数和 Gas 消耗

### 存储优化
- 合理的数据结构设计
- 避免不必要的存储操作
- 使用事件记录历史数据

## 🔮 未来扩展

### 计划功能
- [ ] 地图 NFT 系统
- [ ] 拍卖功能增强
- [ ] 治理代币和 DAO
- [ ] 跨链桥接
- [ ] Layer 2 集成

### 技术升级
- [ ] 升级到最新 OpenZeppelin 版本
- [ ] 集成 Chainlink 预言机
- [ ] 实现代理升级模式
- [ ] 添加更多安全审计

## 📞 联系信息

如有问题或建议，请联系开发团队或提交 Issue。

---

**⚠️ 免责声明**: 这些智能合约仅用于开发和测试目的。在生产环境部署前，请进行全面的安全审计。
