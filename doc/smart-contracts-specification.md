# 📜 Bubble Brawl 智能合约技术规范

## 📋 概述

本文档详细描述了 Bubble Brawl 游戏的智能合约架构、功能规范和技术实现要求。

---

## 🏗️ 项目结构

### 目录结构
```
src/contracts/
├── nft/
│   ├── BubbleSkinNFT.sol        # 泡泡皮肤 NFT 合约
│   ├── BubbleMapNFT.sol         # 地图 NFT 合约
│   └── interfaces/
│       ├── IBubbleSkinNFT.sol   # 皮肤 NFT 接口
│       └── IBubbleMapNFT.sol    # 地图 NFT 接口
├── token/
│   ├── BubbleToken.sol          # $BUB ERC-20 代币合约
│   └── interfaces/
│       └── IBubbleToken.sol     # 代币接口
├── game/
│   ├── GameRewards.sol          # 游戏奖励分发合约
│   ├── Marketplace.sol          # NFT 交易市场合约
│   └── interfaces/
│       ├── IGameRewards.sol     # 奖励接口
│       └── IMarketplace.sol     # 市场接口
├── governance/
│   └── BubbleDAO.sol            # DAO 治理合约（可选）
└── utils/
    ├── RandomGenerator.sol      # 随机数生成器
    └── AccessControlManager.sol # 权限管理器

scripts/
├── deploy/
│   ├── 01-deploy-token.js       # 部署代币合约
│   ├── 02-deploy-skin-nft.js    # 部署皮肤NFT合约
│   ├── 03-deploy-map-nft.js     # 部署地图NFT合约
│   └── 04-deploy-game.js        # 部署游戏合约
├── initialize/
│   ├── setup-roles.js           # 设置角色权限
│   ├── create-templates.js      # 创建初始模板
│   └── configure-contracts.js   # 配置合约参数
└── utils/
    ├── verify-contracts.js      # 验证合约
    └── upgrade-contracts.js     # 升级合约

test/
├── nft/
│   ├── BubbleSkinNFT.test.js    # 皮肤NFT测试
│   └── BubbleMapNFT.test.js     # 地图NFT测试
├── token/
│   └── BubbleToken.test.js      # 代币测试
├── game/
│   ├── GameRewards.test.js      # 奖励测试
│   └── Marketplace.test.js      # 市场测试
└── integration/
    └── full-integration.test.js # 集成测试
```

---

## 🎨 泡泡皮肤 NFT 合约规范

### 合约基础信息
- **合约名称**: BubbleSkinNFT
- **标准**: ERC-721
- **Solidity版本**: ^0.8.19
- **依赖库**: OpenZeppelin Contracts v4.9.0+

### 核心功能

#### 1. 权限管理系统
```solidity
// 角色定义
bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
bytes32 public constant SKIN_MANAGER_ROLE = keccak256("SKIN_MANAGER_ROLE");
bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

// 权限控制函数
function grantRole(bytes32 role, address account) external;
function revokeRole(bytes32 role, address account) external;
function hasRole(bytes32 role, address account) external view returns (bool);
```

#### 2. 皮肤模板系统
```solidity
struct SkinTemplate {
    uint256 templateId;        // 模板ID
    string name;               // 皮肤名称
    string description;        // 皮肤描述
    RarityLevel rarity;        // 稀有度等级
    EffectType effectType;     // 特效类型
    ColorConfig colorConfig;   // 颜色配置
    bool isActive;             // 是否启用
    uint256 maxSupply;         // 最大供应量
    uint256 currentSupply;     // 当前供应量
    uint256 createdAt;         // 创建时间
}

enum RarityLevel { COMMON, RARE, EPIC, LEGENDARY }
enum EffectType { NONE, GLOW, SPARKLE, RAINBOW, LIGHTNING }

struct ColorConfig {
    string primaryColor;       // 主色调
    string secondaryColor;     // 辅助色
    string accentColor;        // 强调色
    uint8 transparency;        // 透明度 (0-255)
}
```

#### 3. 核心管理函数
```solidity
/**
 * @dev 创建新的皮肤模板
 * @param name 皮肤名称
 * @param description 皮肤描述
 * @param rarity 稀有度等级
 * @param effectType 特效类型
 * @param colorConfig 颜色配置
 * @param maxSupply 最大供应量
 */
function createSkinTemplate(
    string memory name,
    string memory description,
    RarityLevel rarity,
    EffectType effectType,
    ColorConfig memory colorConfig,
    uint256 maxSupply
) external onlyRole(SKIN_MANAGER_ROLE) returns (uint256 templateId);

/**
 * @dev 批量创建皮肤模板
 */
function createSkinTemplatesBatch(
    SkinTemplate[] memory templates
) external onlyRole(SKIN_MANAGER_ROLE) returns (uint256[] memory templateIds);

/**
 * @dev 启用/禁用皮肤模板
 */
function setTemplateActive(uint256 templateId, bool active)
    external onlyRole(SKIN_MANAGER_ROLE);

/**
 * @dev 批量设置模板状态
 */
function setTemplatesActiveBatch(uint256[] memory templateIds, bool active)
    external onlyRole(SKIN_MANAGER_ROLE);
```

#### 4. NFT铸造功能
```solidity
/**
 * @dev 铸造单个皮肤NFT
 */
function mintSkin(address to, uint256 templateId)
    external onlyRole(MINTER_ROLE) returns (uint256 tokenId);

/**
 * @dev 批量铸造皮肤NFT
 */
function mintSkinsBatch(address to, uint256[] memory templateIds)
    external onlyRole(MINTER_ROLE) returns (uint256[] memory tokenIds);

/**
 * @dev 随机铸造指定稀有度的皮肤
 */
function mintRandomSkin(address to, RarityLevel rarity)
    external onlyRole(MINTER_ROLE) returns (uint256 tokenId);
```

#### 5. 查询功能
```solidity
/**
 * @dev 获取皮肤模板信息
 */
function getSkinTemplate(uint256 templateId)
    external view returns (SkinTemplate memory);

/**
 * @dev 获取NFT的皮肤信息
 */
function getSkinInfo(uint256 tokenId)
    external view returns (SkinTemplate memory, uint256 mintedAt);

/**
 * @dev 获取用户拥有的所有皮肤
 */
function getUserSkins(address user)
    external view returns (uint256[] memory tokenIds);

/**
 * @dev 按稀有度获取可用模板
 */
function getTemplatesByRarity(RarityLevel rarity)
    external view returns (uint256[] memory templateIds);
```

#### 6. 事件定义
```solidity
event SkinTemplateCreated(
    uint256 indexed templateId,
    string name,
    RarityLevel rarity,
    uint256 maxSupply
);

event SkinTemplateStatusChanged(
    uint256 indexed templateId,
    bool isActive
);

event SkinMinted(
    address indexed to,
    uint256 indexed tokenId,
    uint256 indexed templateId
);

event BatchSkinsMinted(
    address indexed to,
    uint256[] tokenIds,
    uint256[] templateIds
);
```

---

## 🗺️ 地图 NFT 合约规范

### 合约基础信息
- **合约名称**: BubbleMapNFT
- **标准**: ERC-721
- **Solidity版本**: ^0.8.19

### 核心数据结构

#### 1. 地图模板系统
```solidity
struct MapTemplate {
    uint256 templateId;        // 模板ID
    string name;               // 地图名称
    string description;        // 地图描述
    MapSize size;              // 地图尺寸
    MapTheme theme;            // 地图主题
    RarityLevel rarity;        // 稀有度等级
    PowerUpConfig powerUps;    // 道具配置
    BackgroundStyle background; // 背景样式
    bool isActive;             // 是否启用
    uint256 maxSupply;         // 最大供应量
    uint256 currentSupply;     // 当前供应量
}

enum MapSize { SMALL, MEDIUM, LARGE, EXTRA_LARGE }
enum MapTheme { OCEAN, SPACE, CANDY, FOREST, NEON, RETRO }

struct PowerUpConfig {
    bool hasSpeedBoost;        // 是否有加速道具
    bool hasShield;            // 是否有护盾道具
    bool hasMagnet;            // 是否有磁力道具
    uint8 powerUpDensity;      // 道具密度 (0-100)
}

struct BackgroundStyle {
    string primaryColor;       // 主背景色
    string secondaryColor;     // 辅助背景色
    string pattern;            // 背景图案
    bool hasAnimation;         // 是否有动画效果
}
```

#### 2. 地图使用权限系统
```solidity
struct MapUsageRights {
    address owner;             // 地图所有者
    address currentUser;       // 当前使用者
    uint256 usageStartTime;    // 使用开始时间
    uint256 usageEndTime;      // 使用结束时间
    bool isRentable;           // 是否可租借
    uint256 rentPrice;         // 租借价格
}

/**
 * @dev 设置地图租借
 */
function setMapRentable(uint256 tokenId, bool rentable, uint256 price)
    external;

/**
 * @dev 租借地图
 */
function rentMap(uint256 tokenId, uint256 duration)
    external payable;

/**
 * @dev 检查地图使用权限
 */
function canUseMap(uint256 tokenId, address user)
    external view returns (bool);
```

---

## 💰 $BUB 代币合约规范

### 代币基础信息
- **代币名称**: Bubble Token
- **代币符号**: BUB
- **小数位数**: 18
- **总供应量**: 1,000,000,000 BUB
- **标准**: ERC-20

### 代币分配方案
```solidity
uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
uint256 public constant GAME_REWARDS_POOL = 400_000_000 * 10**18;  // 40%
uint256 public constant TEAM_ALLOCATION = 200_000_000 * 10**18;    // 20%
uint256 public constant COMMUNITY_INCENTIVES = 200_000_000 * 10**18; // 20%
uint256 public constant LIQUIDITY_MINING = 150_000_000 * 10**18;   // 15%
uint256 public constant PUBLIC_SALE = 50_000_000 * 10**18;         // 5%
```

### 游戏奖励机制
```solidity
/**
 * @dev 游戏奖励铸造
 */
function mintGameReward(address player, uint256 amount)
    external onlyRole(GAME_REWARD_ROLE);

/**
 * @dev 批量游戏奖励
 */
function mintGameRewardsBatch(
    address[] memory players,
    uint256[] memory amounts
) external onlyRole(GAME_REWARD_ROLE);

/**
 * @dev 销毁代币（反通胀机制）
 */
function burn(uint256 amount) external;
function burnFrom(address account, uint256 amount) external;
```

---

## 🎮 游戏奖励合约规范

### 奖励计算系统
```solidity
struct GameSession {
    address player;            // 玩家地址
    uint256 finalRank;         // 最终排名
    uint256 maxMass;           // 最大体积
    uint256 survivalTime;      // 存活时间
    uint256 killCount;         // 击杀数量
    uint256 sessionEndTime;    // 游戏结束时间
}

/**
 * @dev 计算游戏奖励
 */
function calculateReward(GameSession memory session)
    public pure returns (uint256 reward);

/**
 * @dev 分发游戏奖励
 */
function distributeReward(GameSession memory session)
    external onlyRole(GAME_SERVER_ROLE);
```

---

## 🛡️ 安全要求

### 1. 访问控制
- 使用 OpenZeppelin AccessControl
- 实现多级权限管理
- 支持权限转移和撤销

### 2. 重入攻击防护
- 使用 ReentrancyGuard
- 遵循 Checks-Effects-Interactions 模式

### 3. 整数溢出防护
- 使用 Solidity 0.8.19+ 内置溢出检查
- 关键计算使用 SafeMath（如需要）

### 4. 随机数安全
- 使用 Chainlink VRF 或类似的安全随机数方案
- 避免使用 block.timestamp 等可预测值

---

## 📊 测试要求

### 1. 单元测试覆盖率
- 代码覆盖率 > 95%
- 分支覆盖率 > 90%
- 函数覆盖率 = 100%

### 2. 测试场景
- 正常功能测试
- 边界条件测试
- 异常情况测试
- 权限控制测试
- Gas 优化测试

### 3. 集成测试
- 合约间交互测试
- 端到端功能测试
- 性能压力测试

---

## 🚀 部署要求

### 1. 部署顺序
1. 部署 BubbleToken 合约
2. 部署 BubbleSkinNFT 合约
3. 部署 BubbleMapNFT 合约
4. 部署 GameRewards 合约
5. 部署 Marketplace 合约
6. 配置合约间权限和参数

### 2. 初始化配置
- 设置管理员角色
- 创建初始皮肤和地图模板
- 配置奖励参数
- 设置合约地址引用

### 3. 验证要求
- 合约源码验证
- 功能测试验证
- 安全审计验证

---

**文档版本**: 1.0
**创建日期**: 2025年6月19日
**状态**: 技术规范阶段
