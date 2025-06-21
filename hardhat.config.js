require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// 辅助函数：获取账户配置
function getAccounts() {
  if (process.env.DEPLOYER_PRIVATE_KEY) {
    return [process.env.DEPLOYER_PRIVATE_KEY];
  }

  if (process.env.MNEMONIC) {
    return {
      mnemonic: process.env.MNEMONIC,
    //   path: "m/44'/60'/0'/0/0",
      initialIndex: parseInt(process.env.DEPLOYER_ACCOUNT_INDEX || "0"),
      count: parseInt(process.env.TEST_ACCOUNTS_COUNT || "10"),
    };
  }

  return [];
}

// 辅助函数：获取网络配置
function getNetworkConfig(rpcUrl, chainId, networkName = "unknown") {
  const config = {
    url: rpcUrl || "http://127.0.0.1:8545",
    chainId: parseInt(chainId || "31337"),
    accounts: getAccounts(),
    timeout: 120000, // 增加超时时间到2分钟
    confirmations: parseInt(process.env.CONFIRMATIONS || "2"),
  };

  // 网络特定的 Gas 配置
  const gasConfigs = {
    monadTestnet: {
      // Monad 测试网使用较高的 Gas 价格
      gasPrice: process.env.MONAD_GAS_PRICE ?
        parseInt(process.env.MONAD_GAS_PRICE) * 1000000000 :
        50000000000, // 50 Gwei 默认值
      gasMultiplier: 1.5, // Gas 估算乘数
    },
    sepolia: {
      gasPrice: process.env.SEPOLIA_GAS_PRICE ?
        parseInt(process.env.SEPOLIA_GAS_PRICE) * 1000000000 :
        20000000000, // 20 Gwei
      gasMultiplier: 1.2,
    },
    mainnet: {
      gasPrice: process.env.MAINNET_GAS_PRICE ?
        parseInt(process.env.MAINNET_GAS_PRICE) * 1000000000 :
        30000000000, // 30 Gwei
      gasMultiplier: 1.1,
    }
  };

  // 应用网络特定配置
  const networkGasConfig = gasConfigs[networkName];
  if (networkGasConfig) {
    if (networkGasConfig.gasPrice) {
      config.gasPrice = networkGasConfig.gasPrice;
    }
    if (networkGasConfig.gasMultiplier) {
      config.gasMultiplier = networkGasConfig.gasMultiplier;
    }
  } else if (process.env.GAS_PRICE) {
    // 备用：使用环境变量中的 Gas 价格
    config.gasPrice = parseInt(process.env.GAS_PRICE) * 1000000000;
  }

  if (process.env.GAS_LIMIT) {
    config.gas = parseInt(process.env.GAS_LIMIT);
  }

  return config;
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // 启用 IR 优化
    },
  },

  paths: {
    sources: "./src/contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  networks: {
    // 本地开发网络
    hardhat: {
      chainId: parseInt(process.env.LOCAL_CHAIN_ID || "31337"),
      accounts: process.env.MNEMONIC ? {
        mnemonic: process.env.MNEMONIC,
        count: parseInt(process.env.TEST_ACCOUNTS_COUNT || "10"),
      } : undefined,
      forking: process.env.FORK_URL ? {
        url: process.env.FORK_URL,
        blockNumber: process.env.FORK_BLOCK_NUMBER ? parseInt(process.env.FORK_BLOCK_NUMBER) : undefined,
      } : undefined,
    },

    // 本地节点
    localhost: getNetworkConfig(
      process.env.LOCAL_RPC_URL,
      process.env.LOCAL_CHAIN_ID
    ),

    // Monad 测试网
    monadTestnet: getNetworkConfig(
      process.env.MONAD_TESTNET_RPC_URL,
      process.env.MONAD_TESTNET_CHAIN_ID,
      "monadTestnet"
    ),

    // 以太坊 Sepolia 测试网
    sepolia: getNetworkConfig(
      process.env.ETHEREUM_SEPOLIA_RPC_URL,
      process.env.ETHEREUM_SEPOLIA_CHAIN_ID,
      "sepolia"
    ),

    // 以太坊主网
    mainnet: getNetworkConfig(
      process.env.ETHEREUM_MAINNET_RPC_URL,
      process.env.ETHEREUM_MAINNET_CHAIN_ID,
      "mainnet"
    ),

    // Polygon 主网
    polygon: getNetworkConfig(
      process.env.POLYGON_MAINNET_RPC_URL,
      process.env.POLYGON_MAINNET_CHAIN_ID,
      process.env.GAS_PRICE
    ),

    // Polygon Mumbai 测试网
    mumbai: getNetworkConfig(
      process.env.POLYGON_MUMBAI_RPC_URL,
      process.env.POLYGON_MUMBAI_CHAIN_ID,
      process.env.GAS_PRICE
    ),
  },

  // Gas 报告配置
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    gasPrice: parseInt(process.env.GAS_PRICE || "20"),
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    showTimeSpent: true,
    showMethodSig: true,
    maxMethodDiff: 10,
  },

  // 合约验证配置
  etherscan: {
    apiKey: {
      // 以太坊网络
      mainnet: process.env.ETHERSCAN_API_KEY,
      sepolia: process.env.ETHERSCAN_API_KEY,

      // Polygon 网络
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,

      // Monad 网络
      monadTestnet: process.env.MONAD_API_KEY,
    },
    customChains: [
      {
        network: "monadTestnet",
        chainId: parseInt(process.env.MONAD_TESTNET_CHAIN_ID || "10143"),
        urls: {
          apiURL: "https://testnet.monadexplorer.com/api",
          browserURL: "https://testnet.monadexplorer.com",
        },
      },
    ],
  },

  // 类型链配置
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },

  // 默认网络
  defaultNetwork: "hardhat",

  // Mocha 测试配置
  mocha: {
    timeout: 60000,
    reporter: process.env.VERBOSE_LOGGING === "true" ? "spec" : "dot",
  },

  // 编译器警告设置
  warnings: {
    "*": {
      "unused-param": false,
      "unused-var": false,
    },
  },
};
