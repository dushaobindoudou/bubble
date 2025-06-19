# 🌐 Bubble Brawl Web3 集成方案

## 📋 概述

为 Bubble Brawl 游戏集成 Web3 功能，包括钱包登录和智能合约模块，实现去中心化的游戏经济系统。

---

## 🔗 Web3钱包集成方案

### 技术栈选择

#### 推荐方案：RainbowKit + WAGMI + Ethers.js

**选择理由：**
- ✅ **RainbowKit**: 最受欢迎的钱包连接UI库，用户体验优秀
- ✅ **WAGMI**: React Hooks for Ethereum，类型安全，开发体验好
- ✅ **Ethers.js**: 成熟的以太坊JavaScript库，功能完整
- ✅ **开源免费**: 所有组件都是开源的，无供应商锁定
- ✅ **活跃社区**: 大量文档和社区支持

### 支持的钱包

1. **MetaMask** - 最流行的浏览器钱包
2. **WalletConnect** - 支持移动端钱包连接
3. **Coinbase Wallet** - 主流交易所钱包
4. **Trust Wallet** - 移动端友好
5. **Rainbow Wallet** - 原生支持

### Monad网络配置

```javascript
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    public: { http: ['https://testnet-rpc.monad.xyz'] },
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://explorer.monad.xyz' },
  },
}
```

---

## 📜 智能合约架构

### 合约结构

```
src/contracts/
├── nft/
│   ├── BubbleSkinNFT.sol        # 泡泡皮肤 NFT 合约（增强版）
│   ├── BubbleMapNFT.sol         # 地图 NFT 合约（新增）
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
```

### 1. $BUB 代币合约 (ERC-20)

**功能特性：**
- 标准 ERC-20 代币功能
- 游戏奖励铸造机制
- 反通胀销毁机制
- 多签名管理权限

**代币经济模型：**
```
总供应量: 1,000,000,000 $BUB
分配方案:
- 游戏奖励池: 40% (400M)
- 团队预留: 20% (200M)
- 社区激励: 20% (200M)
- 流动性挖矿: 15% (150M)
- 私募/公募: 5% (50M)
```

### 2. 泡泡皮肤 NFT 合约 (ERC-721)

**功能特性：**
- 标准 ERC-721 NFT 功能
- 皮肤属性和稀有度系统
- 动态元数据更新
- 版税分成机制

**稀有度等级：**
```
Common (普通): 60% - 基础皮肤
Rare (稀有): 25% - 主题皮肤
Epic (史诗): 12% - 特效皮肤
Legendary (传说): 3% - 限定皮肤
```

---

## 🛠 技术实现细节

### 前端集成步骤

#### 1. 安装依赖
```bash
npm install @rainbow-me/rainbowkit wagmi ethers
npm install @tanstack/react-query  # WAGMI 依赖
```

#### 2. 配置 RainbowKit
```javascript
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains(
  [monadTestnet],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'Bubble Brawl',
  projectId: 'YOUR_PROJECT_ID', // WalletConnect Project ID
  chains
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
});
```

#### 3. 钱包连接组件
```javascript
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';

function WalletConnection() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  // 自动切换到 Monad 网络
  useEffect(() => {
    if (isConnected && chain?.id !== 10143) {
      switchNetwork?.(10143);
    }
  }, [isConnected, chain, switchNetwork]);

  return (
    <div>
      <ConnectButton />
      {isConnected && (
        <div>
          <p>地址: {address}</p>
          <p>网络: {chain?.name}</p>
        </div>
      )}
    </div>
  );
}
```
