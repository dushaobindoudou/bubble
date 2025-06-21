const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * 简化的部署测试脚本
 * 用于验证部署配置和基本功能
 */

async function main() {
  console.log("🧪 开始部署测试...\n");

  // 获取网络信息
  const network = await ethers.provider.getNetwork();
  console.log(`📡 网络: ${network.name} (Chain ID: ${network.chainId})`);

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("👤 部署账户:", deployer.address);
  console.log("💰 账户余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  try {
    // 1. 部署 BubbleToken
    console.log("💰 部署 BubbleToken...");
    const BubbleToken = await ethers.getContractFactory("BubbleToken");
    const bubbleToken = await BubbleToken.deploy();
    await bubbleToken.waitForDeployment();
    const bubbleTokenAddress = await bubbleToken.getAddress();
    console.log("✅ BubbleToken 部署完成:", bubbleTokenAddress);

    // 验证代币基本功能
    const name = await bubbleToken.name();
    const symbol = await bubbleToken.symbol();
    const totalSupply = await bubbleToken.totalSupply();
    console.log(`   名称: ${name} (${symbol})`);
    console.log(`   总供应量: ${ethers.formatEther(totalSupply)} BUB`);

    // 2. 部署 BubbleSkinNFT
    console.log("\n🎨 部署 BubbleSkinNFT...");
    const BubbleSkinNFT = await ethers.getContractFactory("BubbleSkinNFT");
    const bubbleSkinNFT = await BubbleSkinNFT.deploy(
      "Bubble Skin NFT Test",
      "tBSKIN",
      "https://test-api.bubblebrawl.com/metadata/skins/"
    );
    await bubbleSkinNFT.waitForDeployment();
    const bubbleSkinNFTAddress = await bubbleSkinNFT.getAddress();
    console.log("✅ BubbleSkinNFT 部署完成:", bubbleSkinNFTAddress);

    // 验证NFT基本功能
    const nftName = await bubbleSkinNFT.name();
    const nftSymbol = await bubbleSkinNFT.symbol();
    console.log(`   名称: ${nftName} (${nftSymbol})`);

    // 3. 部署 GameRewards
    console.log("\n🎮 部署 GameRewards...");
    const GameRewards = await ethers.getContractFactory("GameRewards");
    const gameRewards = await GameRewards.deploy(
      bubbleTokenAddress,
      bubbleSkinNFTAddress
    );
    await gameRewards.waitForDeployment();
    const gameRewardsAddress = await gameRewards.getAddress();
    console.log("✅ GameRewards 部署完成:", gameRewardsAddress);

    // 4. 部署 Marketplace
    console.log("\n🛒 部署 Marketplace...");
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(deployer.address);
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    console.log("✅ Marketplace 部署完成:", marketplaceAddress);

    // 5. 基本权限配置测试
    console.log("\n⚙️  测试权限配置...");
    
    // 授予游戏奖励合约代币铸造权限
    const GAME_REWARD_ROLE = await bubbleToken.GAME_REWARD_ROLE();
    await bubbleToken.grantRole(GAME_REWARD_ROLE, gameRewardsAddress);
    console.log("✅ 已授予 GameRewards 代币铸造权限");

    // 授予游戏奖励合约NFT铸造权限
    const MINTER_ROLE = await bubbleSkinNFT.MINTER_ROLE();
    await bubbleSkinNFT.grantRole(MINTER_ROLE, gameRewardsAddress);
    console.log("✅ 已授予 GameRewards NFT铸造权限");

    // 6. 功能测试
    console.log("\n🧪 功能测试...");

    // 创建一个测试皮肤模板
    const sampleColorConfig = {
      primaryColor: "#FFB6C1",
      secondaryColor: "#87CEEB",
      accentColor: "#98FB98",
      transparency: 200
    };
    const sampleContent = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="#FFB6C1"/></svg>';

    await bubbleSkinNFT.createSkinTemplate(
      "测试皮肤",
      "测试用皮肤模板",
      0, // COMMON
      1, // GLOW
      sampleColorConfig,
      sampleContent,
      1000
    );
    console.log("✅ 已创建测试皮肤模板");

    // 测试奖励计算
    const testSession = {
      player: deployer.address,
      finalRank: 1,
      maxMass: 5000,
      survivalTime: 600,
      killCount: 5,
      sessionEndTime: Math.floor(Date.now() / 1000),
      sessionId: ethers.keccak256(ethers.toUtf8Bytes("test-session")),
      verified: true,
      claimed: false,
      submittedAt: Math.floor(Date.now() / 1000)
    };

    const calculatedReward = await gameRewards.calculateReward(testSession);
    console.log(`✅ 奖励计算测试: ${ethers.formatEther(calculatedReward)} BUB`);

    // 7. 输出测试摘要
    console.log("\n📋 部署测试摘要:");
    console.log("=".repeat(50));
    console.log(`BubbleToken:     ${bubbleTokenAddress}`);
    console.log(`BubbleSkinNFT:   ${bubbleSkinNFTAddress}`);
    console.log(`GameRewards:     ${gameRewardsAddress}`);
    console.log(`Marketplace:     ${marketplaceAddress}`);
    console.log("=".repeat(50));

    console.log("\n🎉 部署测试成功完成！");
    console.log("\n💡 下一步:");
    console.log("   1. 运行完整部署: npm run deploy");
    console.log("   2. 运行合约测试: npm run test:contracts");
    console.log("   3. 部署到测试网: npm run deploy:monad");

  } catch (error) {
    console.error("❌ 部署测试失败:", error);
    
    // 提供调试建议
    console.log("\n🔧 调试建议:");
    if (error.message.includes("insufficient funds")) {
      console.log("   - 检查账户余额是否足够");
    } else if (error.message.includes("revert")) {
      console.log("   - 检查合约逻辑和权限配置");
    } else if (error.message.includes("network")) {
      console.log("   - 检查网络连接和配置");
    } else {
      console.log("   - 检查合约代码和依赖");
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  });
