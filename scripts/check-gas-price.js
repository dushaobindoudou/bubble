const { ethers } = require("hardhat");
const { GasPriceManager } = require("./utils/gas-price-manager");
require("dotenv").config();

/**
 * Gas 价格检查工具
 * 检查当前网络的 Gas 价格并提供建议
 */

async function main() {
  console.log("⛽ Gas 价格检查工具\n");

  // 获取网络信息
  const network = await ethers.provider.getNetwork();
  console.log(`📡 网络: ${network.name} (Chain ID: ${network.chainId})`);

  // 确定网络名称
  let networkName = "unknown";
  if (network.chainId === 10143n) {
    networkName = "monadTestnet";
  } else if (network.chainId === 11155111n) {
    networkName = "sepolia";
  } else if (network.chainId === 1n) {
    networkName = "mainnet";
  } else if (network.chainId === 31337n) {
    networkName = "hardhat";
  }

  console.log(`🏷️  网络类型: ${networkName}\n`);

  // 初始化 Gas 价格管理器
  const gasPriceManager = new GasPriceManager(ethers.provider, networkName);

  try {
    // 获取当前网络费用数据
    console.log("🔍 检查当前网络费用数据...");
    const feeData = await ethers.provider.getFeeData();
    
    console.log("📊 原始网络费用数据:");
    if (feeData.gasPrice) {
      console.log(`   Gas Price: ${ethers.formatUnits(feeData.gasPrice, "gwei")} Gwei`);
    }
    if (feeData.maxFeePerGas) {
      console.log(`   Max Fee Per Gas: ${ethers.formatUnits(feeData.maxFeePerGas, "gwei")} Gwei`);
    }
    if (feeData.maxPriorityFeePerGas) {
      console.log(`   Max Priority Fee: ${ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei")} Gwei`);
    }

    // 获取优化的 Gas 价格
    console.log("\n🎯 获取优化的 Gas 价格配置...");
    const optimalGasPrice = await gasPriceManager.getOptimalGasPrice();
    
    console.log("✅ 推荐的 Gas 配置:");
    console.log(`   类型: ${optimalGasPrice.type}`);
    if (optimalGasPrice.gasPrice) {
      console.log(`   Gas Price: ${ethers.formatUnits(optimalGasPrice.gasPrice, "gwei")} Gwei`);
    }
    if (optimalGasPrice.maxFeePerGas) {
      console.log(`   Max Fee Per Gas: ${ethers.formatUnits(optimalGasPrice.maxFeePerGas, "gwei")} Gwei`);
    }
    if (optimalGasPrice.maxPriorityFeePerGas) {
      console.log(`   Max Priority Fee: ${ethers.formatUnits(optimalGasPrice.maxPriorityFeePerGas, "gwei")} Gwei`);
    }

    // 检查环境变量配置
    console.log("\n⚙️  检查环境变量配置:");
    const envGasPrice = process.env.GAS_PRICE;
    const networkSpecificGasPrice = process.env[`${networkName.toUpperCase()}_GAS_PRICE`];
    
    console.log(`   通用 GAS_PRICE: ${envGasPrice || '未设置'} Gwei`);
    if (networkSpecificGasPrice) {
      console.log(`   ${networkName.toUpperCase()}_GAS_PRICE: ${networkSpecificGasPrice} Gwei`);
    }

    // 提供配置建议
    console.log("\n💡 配置建议:");
    
    if (networkName === "monadTestnet") {
      const currentMonadGasPrice = process.env.MONAD_GAS_PRICE;
      const recommendedPrice = optimalGasPrice.gasPrice ? 
        Math.ceil(parseFloat(ethers.formatUnits(optimalGasPrice.gasPrice, "gwei"))) : 50;
      
      console.log(`   当前 MONAD_GAS_PRICE: ${currentMonadGasPrice || '未设置'} Gwei`);
      console.log(`   推荐 MONAD_GAS_PRICE: ${recommendedPrice} Gwei`);
      
      if (!currentMonadGasPrice || parseInt(currentMonadGasPrice) < recommendedPrice) {
        console.log(`   ⚠️  建议更新环境变量: MONAD_GAS_PRICE=${recommendedPrice}`);
      } else {
        console.log(`   ✅ 当前配置适合网络条件`);
      }
    }

    // 估算部署成本
    console.log("\n💸 部署成本估算:");
    const estimatedGasUsage = {
      "RandomGenerator": 500000,
      "AccessControlManager": 800000,
      "BubbleToken": 2000000,
      "BubbleSkinNFT": 3000000,
      "GameRewards": 4000000,
      "Marketplace": 2500000,
      "权限配置": 300000,
      "市场配置": 200000
    };

    let totalGasEstimate = 0;
    console.log("   各合约预估 Gas 使用量:");
    
    Object.entries(estimatedGasUsage).forEach(([contract, gasUsage]) => {
      totalGasEstimate += gasUsage;
      console.log(`     ${contract.padEnd(20)}: ${gasUsage.toLocaleString()} Gas`);
    });

    console.log(`   总计预估 Gas: ${totalGasEstimate.toLocaleString()}`);

    // 计算成本
    if (optimalGasPrice.gasPrice) {
      const totalCost = optimalGasPrice.gasPrice * BigInt(totalGasEstimate);
      const totalCostEth = ethers.formatEther(totalCost);
      console.log(`   预估总成本: ${totalCostEth} ETH/MON`);
    }

    // 检查账户余额
    console.log("\n💰 账户余额检查:");
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    const balanceInEth = ethers.formatEther(balance);
    
    console.log(`   部署账户: ${deployer.address}`);
    console.log(`   当前余额: ${balanceInEth} ${networkName === 'monadTestnet' ? 'MON' : 'ETH'}`);
    
    if (optimalGasPrice.gasPrice) {
      const totalCost = optimalGasPrice.gasPrice * BigInt(totalGasEstimate);
      const totalCostEth = parseFloat(ethers.formatEther(totalCost));
      const currentBalance = parseFloat(balanceInEth);
      
      if (currentBalance > totalCostEth * 1.5) {
        console.log("   ✅ 余额充足，可以进行部署");
      } else if (currentBalance > totalCostEth) {
        console.log("   ⚠️  余额勉强够用，建议获取更多测试代币");
      } else {
        console.log("   ❌ 余额不足，需要获取更多测试代币");
        if (networkName === "monadTestnet") {
          console.log("   💧 获取测试代币: https://faucet.monad.xyz");
        }
      }
    }

    // 网络状态检查
    console.log("\n📊 网络状态检查:");
    const startTime = Date.now();
    const blockNumber = await ethers.provider.getBlockNumber();
    const responseTime = Date.now() - startTime;
    
    console.log(`   最新区块: ${blockNumber}`);
    console.log(`   RPC 响应时间: ${responseTime}ms`);
    
    if (responseTime < 1000) {
      console.log("   ✅ 网络响应良好");
    } else if (responseTime < 3000) {
      console.log("   ⚠️  网络响应较慢");
    } else {
      console.log("   ❌ 网络响应很慢，可能影响部署");
    }

    // 提供操作建议
    console.log("\n🚀 操作建议:");
    
    if (networkName === "monadTestnet") {
      console.log("   1. 确保 MONAD_GAS_PRICE 设置合适的值");
      console.log("   2. 使用 Gas 价格管理的部署脚本:");
      console.log("      npm run deploy:monad-gas-fix");
      console.log("   3. 如果部署失败，可以尝试增加 Gas 价格");
    }
    
    console.log("   4. 监控网络拥堵情况，选择合适的部署时机");
    console.log("   5. 保持足够的账户余额以应对 Gas 价格波动");

  } catch (error) {
    console.error("❌ Gas 价格检查失败:", error.message);
    
    console.log("\n🔧 故障排除:");
    console.log("   1. 检查网络连接");
    console.log("   2. 验证 RPC 端点配置");
    console.log("   3. 确认私钥和账户配置");
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  });
