const { ethers } = require("hardhat");
const { GasPriceManager } = require("./utils/gas-price-manager");
require("dotenv").config();

/**
 * Monad 测试网部署脚本 - Gas 价格修复版本
 * 包含动态 Gas 价格检测和重试机制
 */

async function main() {
  console.log("🚀 开始部署到 Monad 测试网（Gas 价格修复版本）...\n");

  // 验证网络
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 10143n) {
    console.error("❌ 错误: 当前网络不是 Monad 测试网");
    console.log(`当前网络 Chain ID: ${network.chainId}`);
    console.log("请使用: npx hardhat run scripts/deploy-monad-with-gas-fix.js --network monadTestnet");
    process.exit(1);
  }

  console.log("✅ 已连接到 Monad 测试网");

  // 初始化 Gas 价格管理器
  const gasPriceManager = new GasPriceManager(ethers.provider, "monadTestnet");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("👤 部署账户:", deployer.address);

  // 检查余额
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceInEth = ethers.formatEther(balance);
  console.log("💰 账户余额:", balanceInEth, "MON");

  if (parseFloat(balanceInEth) < 0.1) {
    console.warn("⚠️  警告: 余额较低，请确保有足够的测试代币");
    console.log("💧 获取测试代币: https://faucet.monad.xyz");
  }

  // 获取当前 Gas 价格信息
  console.log("\n⛽ Gas 价格分析:");
  const gasPriceEstimation = await gasPriceManager.getGasPriceEstimation();
  console.log("   当前网络 Gas 价格:", JSON.stringify(gasPriceEstimation, null, 2));

  // Monad 特定配置
  const monadConfig = {
    bubbleToken: {
      name: "Bubble Testnet",
      symbol: "tBUB",
    },
    bubbleSkinNFT: {
      name: "Bubble Skin NFT Testnet",
      symbol: "tBSKIN",
      baseURI: "https://testnet-api.bubblebrawl.com/metadata/skins/",
    },
    marketplace: {
      feeRecipient: deployer.address,
      feePercentage: 250, // 2.5%
    }
  };

  console.log("\n📋 Monad 测试网配置:");
  console.log(`   代币: ${monadConfig.bubbleToken.name} (${monadConfig.bubbleToken.symbol})`);
  console.log(`   NFT: ${monadConfig.bubbleSkinNFT.name} (${monadConfig.bubbleSkinNFT.symbol})`);
  console.log();

  try {
    // 设置 Monad 特定的环境变量
    process.env.BUBBLE_TOKEN_NAME = monadConfig.bubbleToken.name;
    process.env.BUBBLE_TOKEN_SYMBOL = monadConfig.bubbleToken.symbol;
    process.env.BUBBLE_SKIN_NFT_NAME = monadConfig.bubbleSkinNFT.name;
    process.env.BUBBLE_SKIN_NFT_SYMBOL = monadConfig.bubbleSkinNFT.symbol;
    process.env.BUBBLE_SKIN_NFT_BASE_URI = monadConfig.bubbleSkinNFT.baseURI;
    process.env.MARKETPLACE_FEE_RECIPIENT = monadConfig.marketplace.feeRecipient;
    process.env.MARKETPLACE_FEE_PERCENTAGE = monadConfig.marketplace.feePercentage.toString();
    process.env.DEPLOYMENT_ENVIRONMENT = "testnet";
    process.env.CREATE_TEST_DATA = "true";
    process.env.AUTO_VERIFY_CONTRACTS = "true";

    console.log("🔄 开始执行合约部署（使用 Gas 价格管理）...\n");

    // 部署合约的包装函数
    async function deployContractWithGasManagement(contractName, constructorArgs = [], description) {
      console.log(`📦 部署 ${contractName}...`);
      
      const ContractFactory = await ethers.getContractFactory(contractName);
      
      const deployFunction = async (gasOptions) => {
        return await ContractFactory.deploy(...constructorArgs, gasOptions);
      };
      
      const tx = await gasPriceManager.executeWithRetry(
        deployFunction,
        `${contractName} 部署`
      );
      
      const receipt = await tx.waitForDeployment();
      const address = await receipt.getAddress();
      
      console.log(`✅ ${contractName} 部署完成: ${address}`);
      return { contract: receipt, address };
    }

    // 权限授予的包装函数
    async function grantRoleWithGasManagement(contract, role, account, roleName) {
      console.log(`   配置 ${roleName}...`);
      
      // 检查是否已经有权限
      const hasRole = await contract.hasRole(role, account);
      if (hasRole) {
        console.log(`   ✅ ${roleName} 已存在，跳过授予`);
        return;
      }
      
      const grantFunction = async (gasOptions) => {
        return await contract.grantRole(role, account, gasOptions);
      };
      
      const tx = await gasPriceManager.executeWithRetry(
        grantFunction,
        `${roleName} 授予`
      );
      
      const receipt = await tx.wait();
      console.log(`✅ ${roleName} 授予完成 (Gas: ${receipt.gasUsed.toString()})`);
      
      // 验证权限
      const hasRoleAfter = await contract.hasRole(role, account);
      if (!hasRoleAfter) {
        throw new Error(`${roleName} 授予失败 - 权限验证失败`);
      }
    }

    // 开始部署流程
    const deployedContracts = {};

    // 1. 部署工具合约
    console.log("📦 部署工具合约...");
    
    const randomGenerator = await deployContractWithGasManagement("RandomGenerator");
    deployedContracts.RandomGenerator = randomGenerator.address;
    
    const accessControlManager = await deployContractWithGasManagement("AccessControlManager");
    deployedContracts.AccessControlManager = accessControlManager.address;

    // 2. 部署核心合约
    console.log("\n💰 部署代币合约...");
    const bubbleToken = await deployContractWithGasManagement("BubbleToken");
    deployedContracts.BubbleToken = bubbleToken.address;

    console.log("\n🎨 部署NFT合约...");
    const bubbleSkinNFT = await deployContractWithGasManagement(
      "BubbleSkinNFT",
      [monadConfig.bubbleSkinNFT.name, monadConfig.bubbleSkinNFT.symbol, monadConfig.bubbleSkinNFT.baseURI]
    );
    deployedContracts.BubbleSkinNFT = bubbleSkinNFT.address;

    // 3. 部署游戏合约
    console.log("\n🎮 部署游戏合约...");
    const gameRewards = await deployContractWithGasManagement(
      "GameRewards",
      [bubbleToken.address, bubbleSkinNFT.address]
    );
    deployedContracts.GameRewards = gameRewards.address;

    const marketplace = await deployContractWithGasManagement(
      "Marketplace",
      [monadConfig.marketplace.feeRecipient]
    );
    deployedContracts.Marketplace = marketplace.address;

    // 4. 配置权限
    console.log("\n⚙️  配置合约权限（使用 Gas 管理）...");
    
    const GAME_REWARD_ROLE = await bubbleToken.contract.GAME_REWARD_ROLE();
    await grantRoleWithGasManagement(
      bubbleToken.contract,
      GAME_REWARD_ROLE,
      gameRewards.address,
      "代币铸造权限"
    );

    const MINTER_ROLE = await bubbleSkinNFT.contract.MINTER_ROLE();
    await grantRoleWithGasManagement(
      bubbleSkinNFT.contract,
      MINTER_ROLE,
      gameRewards.address,
      "NFT铸造权限"
    );

    // 5. 配置市场
    console.log("\n🛒 配置市场合约...");
    
    const setTokenFunction = async (gasOptions) => {
      return await marketplace.contract.setSupportedPaymentToken(bubbleToken.address, true, gasOptions);
    };
    
    await gasPriceManager.executeWithRetry(setTokenFunction, "市场代币配置");
    
    const setNFTFunction = async (gasOptions) => {
      return await marketplace.contract.setSupportedNFTContract(bubbleSkinNFT.address, true, gasOptions);
    };
    
    await gasPriceManager.executeWithRetry(setNFTFunction, "市场NFT配置");

    console.log("\n🎉 Monad 测试网部署完成！");
    
    // 输出部署摘要
    console.log("\n📋 部署摘要:");
    console.log("=".repeat(60));
    console.log(`网络: Monad Testnet (Chain ID: ${network.chainId})`);
    console.log(`部署者: ${deployer.address}`);
    console.log(`时间: ${new Date().toISOString()}`);
    console.log("-".repeat(60));
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name.padEnd(20)}: ${address}`);
    });
    console.log("=".repeat(60));

    console.log("\n📱 有用的链接:");
    console.log("   🔍 区块浏览器: https://testnet.monadexplorer.com");
    console.log("   💧 测试代币水龙头: https://faucet.monad.xyz");
    console.log("   📚 文档: https://docs.monad.xyz");
    
    console.log("\n🚀 部署后续步骤:");
    console.log("   1. 在区块浏览器中验证合约部署");
    console.log("   2. 测试合约基本功能");
    console.log("   3. 配置前端应用连接");

  } catch (error) {
    console.error("❌ Monad 测试网部署失败:", error.message);
    
    // 显示详细错误信息
    if (process.env.VERBOSE_LOGGING === "true") {
      console.error("\n🔍 详细错误信息:");
      console.error(error);
    }
    
    // Gas 相关错误的特殊处理
    if (gasPriceManager.isGasRelatedError(error)) {
      console.log("\n⛽ Gas 相关错误解决建议:");
      console.log("   1. 当前网络可能拥堵，Gas 价格波动较大");
      console.log("   2. 尝试增加 MONAD_GAS_PRICE 环境变量值");
      console.log("   3. 等待网络拥堵缓解后重试");
      console.log("   4. 检查账户余额是否足够支付更高的 Gas 费用");
    } else {
      console.log("\n🔧 通用故障排除建议:");
      console.log("   1. 检查网络连接和 RPC 端点");
      console.log("   2. 验证账户余额和私钥配置");
      console.log("   3. 确认合约代码和构造函数参数");
    }
    
    console.log("\n📞 获取帮助:");
    console.log("   - 查看部署指南: DEPLOYMENT_GUIDE.md");
    console.log("   - 运行网络验证: npm run verify-monad");
    console.log("   - 检查 Gas 价格: npm run check-gas-price");
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  });
