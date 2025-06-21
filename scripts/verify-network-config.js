const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * 验证网络配置脚本
 * 检查网络连接、账户余额和配置有效性
 */

async function main() {
  console.log("🔍 验证网络配置...\n");

  // 获取当前网络信息
  const network = await ethers.provider.getNetwork();
  console.log(`📡 当前网络: ${network.name} (Chain ID: ${network.chainId})`);

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  
  console.log(`👤 部署账户: ${deployer.address}`);

  try {
    // 检查账户余额
    const balance = await ethers.provider.getBalance(deployer.address);
    const balanceInEth = ethers.formatEther(balance);
    console.log(`💰 账户余额: ${balanceInEth} ETH`);

    // 余额检查
    if (parseFloat(balanceInEth) < 0.1) {
      console.warn("⚠️  警告: 账户余额较低，可能不足以支付部署费用");
    } else {
      console.log("✅ 账户余额充足");
    }

    // 检查网络连接
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`🔗 最新区块: ${blockNumber}`);

    // 检查 Gas 价格
    const feeData = await ethers.provider.getFeeData();
    if (feeData.gasPrice) {
      const gasPriceGwei = ethers.formatUnits(feeData.gasPrice, "gwei");
      console.log(`⛽ 当前 Gas 价格: ${gasPriceGwei} Gwei`);
    }

    // 验证环境变量
    console.log("\n🔧 环境变量检查:");
    
    const requiredVars = [
      "DEPLOYER_PRIVATE_KEY",
      "BUBBLE_TOKEN_NAME",
      "BUBBLE_TOKEN_SYMBOL",
      "BUBBLE_SKIN_NFT_NAME",
      "BUBBLE_SKIN_NFT_SYMBOL",
      "BUBBLE_SKIN_NFT_BASE_URI"
    ];

    let allVarsPresent = true;
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        console.log(`✅ ${varName}: 已设置`);
      } else {
        console.log(`❌ ${varName}: 未设置`);
        allVarsPresent = false;
      }
    }

    if (!allVarsPresent) {
      console.log("\n⚠️  警告: 某些必需的环境变量未设置，部署可能失败");
    }

    // 网络特定检查
    if (network.chainId === 31337n) {
      console.log("\n🏠 本地网络检查:");
      console.log("✅ 运行在本地 Hardhat 网络");
    } else if (network.chainId === 10143n) {
      console.log("\n🧪 Monad 测试网检查:");
      console.log("✅ 连接到 Monad 测试网");
      
      if (process.env.MONAD_API_KEY) {
        console.log("✅ Monad API Key 已设置（用于合约验证）");
      } else {
        console.log("⚠️  Monad API Key 未设置，无法自动验证合约");
      }
    }

    // 估算部署成本
    console.log("\n💸 部署成本估算:");
    if (feeData.gasPrice) {
      const estimatedGasUsage = 15000000; // 估算的总 Gas 使用量
      const estimatedCost = feeData.gasPrice * BigInt(estimatedGasUsage);
      const estimatedCostEth = ethers.formatEther(estimatedCost);
      console.log(`📊 估算部署成本: ${estimatedCostEth} ETH`);
      
      if (parseFloat(balanceInEth) < parseFloat(estimatedCostEth) * 1.2) {
        console.log("⚠️  警告: 账户余额可能不足以完成所有合约部署");
      } else {
        console.log("✅ 账户余额足够完成部署");
      }
    }

    console.log("\n🎉 网络配置验证完成!");

  } catch (error) {
    console.error("❌ 网络配置验证失败:", error.message);
    process.exit(1);
  }
}

// 错误处理
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  });
