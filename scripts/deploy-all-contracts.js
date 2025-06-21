const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * 优化的部署脚本
 * 支持环境变量配置、网络检测、错误处理和合约验证
 */

// 辅助函数：等待交易确认（带超时和重试机制）
async function waitForConfirmation(tx, description, timeoutMs = 30000) {
  console.log(`⏳ 等待 ${description} 交易确认...`);
  console.log(`   交易哈希: ${tx.hash}`);

  try {
    // 获取网络信息以调整确认数
    const network = await ethers.provider.getNetwork();
    const isLocalNetwork = network.chainId === 31337n || network.chainId === 1337n;

    // 本地网络使用1个确认，其他网络使用配置的确认数
    const confirmations = isLocalNetwork ? 1 : parseInt(process.env.CONFIRMATIONS || "2");
    console.log(`   等待 ${confirmations} 个确认 (网络: ${network.name})`);

    // 创建超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`交易确认超时 (${timeoutMs}ms): ${description}`));
      }, timeoutMs);
    });

    // 等待交易确认或超时
    const receipt = await Promise.race([
      tx.wait(confirmations),
      timeoutPromise
    ]);

    console.log(`✅ ${description} 完成`);
    console.log(`   Gas 使用: ${receipt.gasUsed.toString()}`);
    console.log(`   区块号: ${receipt.blockNumber}`);

    return receipt;

  } catch (error) {
    console.error(`❌ ${description} 失败:`, error.message);

    // 尝试获取交易状态
    try {
      const txReceipt = await ethers.provider.getTransactionReceipt(tx.hash);
      if (txReceipt) {
        console.log(`   交易已上链但可能失败 - 状态: ${txReceipt.status}`);
        if (txReceipt.status === 0) {
          throw new Error(`交易执行失败: ${description}`);
        }
        return txReceipt;
      } else {
        console.log(`   交易尚未上链，可能仍在等待中...`);
      }
    } catch (receiptError) {
      console.log(`   无法获取交易状态: ${receiptError.message}`);
    }

    throw error;
  }
}

// 辅助函数：验证合约
async function verifyContract(address, constructorArguments = []) {
  if (process.env.AUTO_VERIFY_CONTRACTS !== "true") {
    return;
  }

  try {
    console.log(`🔍 验证合约: ${address}`);
    const hre = require("hardhat");
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArguments,
    });
    console.log(`✅ 合约验证成功: ${address}`);
  } catch (error) {
    console.log(`⚠️  合约验证失败: ${error.message}`);
  }
}

async function main() {
  console.log("🚀 开始部署 Bubble Brawl 智能合约...\n");

  // 获取网络信息
  const network = await ethers.provider.getNetwork();
  console.log(`📡 部署网络: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`🌍 部署环境: ${process.env.DEPLOYMENT_ENVIRONMENT || "development"}\n`);

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("👤 部署账户:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceInEth = ethers.formatEther(balance);
  console.log("💰 账户余额:", balanceInEth, "ETH");

  // 余额检查
  if (parseFloat(balanceInEth) < 0.1) {
    console.warn("⚠️  警告: 账户余额较低，可能不足以支付部署费用");
  }
  console.log();

  // 从环境变量读取配置
  const config = {
    bubbleToken: {
      name: process.env.BUBBLE_TOKEN_NAME || "BubbleTOKEN",
      symbol: process.env.BUBBLE_TOKEN_SYMBOL || "BUB",
    },
    bubbleSkinNFT: {
      name: process.env.BUBBLE_SKIN_NFT_NAME || "Bubble Skin NFT",
      symbol: process.env.BUBBLE_SKIN_NFT_SYMBOL || "BSKIN",
      baseURI: process.env.BUBBLE_SKIN_NFT_BASE_URI || "https://api.bubblebrawl.com/metadata/skins/",
    },
    marketplace: {
      feeRecipient: (process.env.MARKETPLACE_FEE_RECIPIENT && process.env.MARKETPLACE_FEE_RECIPIENT !== "0x0000000000000000000000000000000000000000")
        ? process.env.MARKETPLACE_FEE_RECIPIENT
        : deployer.address,
      feePercentage: parseInt(process.env.MARKETPLACE_FEE_PERCENTAGE || "250"),
    },
    gameRewards: {
      baseReward: process.env.GAME_REWARDS_BASE_REWARD || ethers.parseEther("100").toString(),
      killBonus: process.env.GAME_REWARDS_KILL_BONUS || ethers.parseEther("10").toString(),
      survivalBonus: process.env.GAME_REWARDS_SURVIVAL_BONUS || ethers.parseEther("5").toString(),
      massBonus: process.env.GAME_REWARDS_MASS_BONUS || ethers.parseEther("1").toString(),
      maxReward: process.env.GAME_REWARDS_MAX_REWARD || ethers.parseEther("1000").toString(),
    }
  };

  console.log("📋 部署配置:");
  console.log(`   代币名称: ${config.bubbleToken.name} (${config.bubbleToken.symbol})`);
  console.log(`   NFT名称: ${config.bubbleSkinNFT.name} (${config.bubbleSkinNFT.symbol})`);
  console.log(`   NFT基础URI: ${config.bubbleSkinNFT.baseURI}`);
  console.log(`   市场手续费: ${config.marketplace.feePercentage / 100}%`);
  console.log();

  const deployedContracts = {};

  try {
    // 1. 部署工具合约
    console.log("📦 部署工具合约...");

    // 部署随机数生成器
    console.log("   部署 RandomGenerator...");
    const RandomGenerator = await ethers.getContractFactory("RandomGenerator");
    const randomGenerator = await RandomGenerator.deploy();
    await randomGenerator.waitForDeployment();
    const randomGeneratorAddress = await randomGenerator.getAddress();
    deployedContracts.RandomGenerator = randomGeneratorAddress;
    console.log("✅ RandomGenerator 部署完成:", randomGeneratorAddress);

    // 部署权限管理器
    console.log("   部署 AccessControlManager...");
    const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
    const accessControlManager = await AccessControlManager.deploy();
    await accessControlManager.waitForDeployment();
    const accessControlManagerAddress = await accessControlManager.getAddress();
    deployedContracts.AccessControlManager = accessControlManagerAddress;
    console.log("✅ AccessControlManager 部署完成:", accessControlManagerAddress);

    // 2. 部署代币合约
    console.log("\n💰 部署代币合约...");
    console.log("   部署 BubbleToken...");
    const BubbleToken = await ethers.getContractFactory("BubbleToken");
    const bubbleToken = await BubbleToken.deploy();
    await bubbleToken.waitForDeployment();
    const bubbleTokenAddress = await bubbleToken.getAddress();
    deployedContracts.BubbleToken = bubbleTokenAddress;
    console.log("✅ BubbleToken 部署完成:", bubbleTokenAddress);

    // 3. 部署NFT合约
    console.log("\n🎨 部署NFT合约...");
    console.log("   部署 BubbleSkinNFT...");
    const BubbleSkinNFT = await ethers.getContractFactory("BubbleSkinNFT");
    const bubbleSkinNFT = await BubbleSkinNFT.deploy(
      config.bubbleSkinNFT.name,
      config.bubbleSkinNFT.symbol,
      config.bubbleSkinNFT.baseURI
    );
    await bubbleSkinNFT.waitForDeployment();
    const bubbleSkinNFTAddress = await bubbleSkinNFT.getAddress();
    deployedContracts.BubbleSkinNFT = bubbleSkinNFTAddress;
    console.log("✅ BubbleSkinNFT 部署完成:", bubbleSkinNFTAddress);

    // 4. 部署游戏合约
    console.log("\n🎮 部署游戏合约...");

    // 部署游戏奖励合约
    console.log("   部署 GameRewards...");
    const GameRewards = await ethers.getContractFactory("GameRewards");
    const gameRewards = await GameRewards.deploy(
      bubbleTokenAddress,
      bubbleSkinNFTAddress
    );
    await gameRewards.waitForDeployment();
    const gameRewardsAddress = await gameRewards.getAddress();
    deployedContracts.GameRewards = gameRewardsAddress;
    console.log("✅ GameRewards 部署完成:", gameRewardsAddress);

    // 部署市场合约
    console.log("   部署 Marketplace...");
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(config.marketplace.feeRecipient);
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    deployedContracts.Marketplace = marketplaceAddress;
    console.log("✅ Marketplace 部署完成:", marketplaceAddress);

    // 5. 配置合约权限和设置
    console.log("\n⚙️  配置合约权限...");

    // 为游戏奖励合约授予代币铸造权限
    console.log("   配置代币铸造权限...");
    try {
      const GAME_REWARD_ROLE = await bubbleToken.GAME_REWARD_ROLE();
      console.log(`   GAME_REWARD_ROLE: ${GAME_REWARD_ROLE}`);
      console.log(`   授予地址: ${gameRewardsAddress}`);

      // 检查是否已经有权限
      const hasRole = await bubbleToken.hasRole(GAME_REWARD_ROLE, gameRewardsAddress);
      if (hasRole) {
        console.log("   ✅ 代币铸造权限已存在，跳过授予");
      } else {
        const grantTokenRoleTx = await bubbleToken.grantRole(GAME_REWARD_ROLE, gameRewardsAddress);
        await waitForConfirmation(grantTokenRoleTx, "代币铸造权限授予", 60000);

        // 验证权限是否成功授予
        const hasRoleAfter = await bubbleToken.hasRole(GAME_REWARD_ROLE, gameRewardsAddress);
        if (!hasRoleAfter) {
          throw new Error("代币铸造权限授予失败 - 权限验证失败");
        }
        console.log("   ✅ 代币铸造权限验证成功");
      }
    } catch (error) {
      console.error("   ❌ 代币铸造权限配置失败:", error.message);
      throw error;
    }

    // 为游戏奖励合约授予NFT铸造权限
    console.log("   配置NFT铸造权限...");
    try {
      const MINTER_ROLE = await bubbleSkinNFT.MINTER_ROLE();
      console.log(`   MINTER_ROLE: ${MINTER_ROLE}`);
      console.log(`   授予地址: ${gameRewardsAddress}`);

      // 检查是否已经有权限
      const hasRole = await bubbleSkinNFT.hasRole(MINTER_ROLE, gameRewardsAddress);
      if (hasRole) {
        console.log("   ✅ NFT铸造权限已存在，跳过授予");
      } else {
        const grantNFTRoleTx = await bubbleSkinNFT.grantRole(MINTER_ROLE, gameRewardsAddress);
        await waitForConfirmation(grantNFTRoleTx, "NFT铸造权限授予", 60000);

        // 验证权限是否成功授予
        const hasRoleAfter = await bubbleSkinNFT.hasRole(MINTER_ROLE, gameRewardsAddress);
        if (!hasRoleAfter) {
          throw new Error("NFT铸造权限授予失败 - 权限验证失败");
        }
        console.log("   ✅ NFT铸造权限验证成功");
      }
    } catch (error) {
      console.error("   ❌ NFT铸造权限配置失败:", error.message);
      throw error;
    }

    // 配置市场支持的代币和NFT
    console.log("   配置市场支持的代币...");
    try {
      const setTokenTx = await marketplace.setSupportedPaymentToken(bubbleTokenAddress, true);
      await waitForConfirmation(setTokenTx, "市场代币配置", 30000);

      // 验证配置
      const isSupported = await marketplace.supportedPaymentTokens(bubbleTokenAddress);
      if (!isSupported) {
        throw new Error("市场代币配置失败 - 验证失败");
      }
      console.log("   ✅ 市场代币配置验证成功");
    } catch (error) {
      console.error("   ❌ 市场代币配置失败:", error.message);
      throw error;
    }

    console.log("   配置市场支持的NFT...");
    try {
      const setNFTTx = await marketplace.setSupportedNFTContract(bubbleSkinNFTAddress, true);
      await waitForConfirmation(setNFTTx, "市场NFT配置", 30000);

      // 验证配置
      const isSupported = await marketplace.supportedNFTContracts(bubbleSkinNFTAddress);
      if (!isSupported) {
        throw new Error("市场NFT配置失败 - 验证失败");
      }
      console.log("   ✅ 市场NFT配置验证成功");
    } catch (error) {
      console.error("   ❌ 市场NFT配置失败:", error.message);
      throw error;
    }

    // 配置市场手续费
    if (config.marketplace.feePercentage !== 250) {
      console.log("   配置市场手续费...");
      try {
        const setFeeTx = await marketplace.setFeePercentage(config.marketplace.feePercentage);
        await waitForConfirmation(setFeeTx, "市场手续费配置", 30000);

        // 验证配置
        const currentFee = await marketplace.feePercentage();
        if (currentFee !== BigInt(config.marketplace.feePercentage)) {
          throw new Error("市场手续费配置失败 - 验证失败");
        }
        console.log("   ✅ 市场手续费配置验证成功");
      } catch (error) {
        console.error("   ❌ 市场手续费配置失败:", error.message);
        throw error;
      }
    }

    // 6. 创建一些示例皮肤模板
    console.log("\n🎨 创建示例皮肤模板...");

    const sampleColorConfig = {
      primaryColor: "#FFB6C1",
      secondaryColor: "#87CEEB",
      accentColor: "#98FB98",
      transparency: 200
    };

    // 创建几个不同稀有度的皮肤模板
    const skinTemplates = [
      {
        name: "粉色泡泡",
        description: "可爱的粉色泡泡皮肤",
        rarity: 0, // COMMON
        effectType: 1, // GLOW
        content: '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="#FFB6C1" stroke="#FF69B4" stroke-width="2"/></svg>',
        maxSupply: 1000
      },
      {
        name: "蓝色闪电",
        description: "带有闪电特效的蓝色皮肤",
        rarity: 1, // RARE
        effectType: 4, // LIGHTNING
        content: "https://api.bubblebrawl.com/skins/lightning-blue.png",
        maxSupply: 500
      },
      {
        name: "彩虹泡泡",
        description: "绚丽的彩虹色泡泡皮肤",
        rarity: 2, // EPIC
        effectType: 3, // RAINBOW
        content: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
        maxSupply: 100
      }
    ];

    // 只在开发环境创建示例数据
    if (process.env.CREATE_TEST_DATA === "true" && process.env.DEPLOYMENT_ENVIRONMENT === "development") {
      for (const template of skinTemplates) {
        const createTemplateTx = await bubbleSkinNFT.createSkinTemplate(
          template.name,
          template.description,
          template.rarity,
          template.effectType,
          sampleColorConfig,
          template.content,
          template.maxSupply
        );
        await waitForConfirmation(createTemplateTx, `皮肤模板创建: ${template.name}`);
      }
    } else {
      console.log("⏭️  跳过示例数据创建（非开发环境）");
    }

    // 7. 合约验证
    if (process.env.AUTO_VERIFY_CONTRACTS === "true") {
      console.log("\n🔍 开始合约验证...");

      await verifyContract(randomGeneratorAddress);
      await verifyContract(accessControlManagerAddress);
      await verifyContract(bubbleTokenAddress);
      await verifyContract(bubbleSkinNFTAddress, [
        config.bubbleSkinNFT.name,
        config.bubbleSkinNFT.symbol,
        config.bubbleSkinNFT.baseURI
      ]);
      await verifyContract(gameRewardsAddress, [bubbleTokenAddress, bubbleSkinNFTAddress]);
      await verifyContract(marketplaceAddress, [config.marketplace.feeRecipient]);
    }

    // 8. 输出部署摘要
    console.log("\n📋 部署摘要:");
    console.log("=".repeat(60));
    console.log(`网络: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`部署者: ${deployer.address}`);
    console.log(`时间: ${new Date().toISOString()}`);
    console.log("-".repeat(60));
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name.padEnd(20)}: ${address}`);
    });
    console.log("=".repeat(60));

    // 9. 保存部署信息到文件
    const deploymentInfo = {
      network: {
        name: network.name,
        chainId: network.chainId.toString(),
      },
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      environment: process.env.DEPLOYMENT_ENVIRONMENT || "development",
      contracts: deployedContracts,
      config: config,
      gasUsed: "详见交易记录",
    };

    const deploymentDir = "deployments";
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const filename = `${deploymentDir}/deployment-${network.name}-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 部署信息已保存到: ${filename}`);

    // 10. 发送部署通知（如果配置了webhook）
    if (process.env.DEPLOYMENT_WEBHOOK_URL) {
      try {
        const webhook = require('axios');
        await webhook.post(process.env.DEPLOYMENT_WEBHOOK_URL, {
          text: `🚀 Bubble Brawl 合约部署完成！\n网络: ${network.name}\n部署者: ${deployer.address}\n合约数量: ${Object.keys(deployedContracts).length}`
        });
        console.log("📢 部署通知已发送");
      } catch (error) {
        console.log("⚠️  部署通知发送失败:", error.message);
      }
    }

    console.log("\n🎉 所有合约部署完成！");

  } catch (error) {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  }
}

// Export the main function for use by other scripts
module.exports = { main };

// Only run directly if this file is executed directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
