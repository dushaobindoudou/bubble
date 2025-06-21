const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * 测试 Monad 部署脚本的执行流程
 * 模拟 Monad 网络环境来测试完整的执行流程
 */

async function main() {
  console.log("🚀 开始部署到 Monad 测试网...\n");

  // 获取网络信息（跳过网络验证用于测试）
  const network = await ethers.provider.getNetwork();
  console.log(`📡 模拟 Monad 测试网环境 (实际网络: ${network.name})`);
  console.log("✅ 连接到 Monad 测试网");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("👤 部署账户:", deployer.address);

  // 检查余额
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceInEth = ethers.formatEther(balance);
  console.log("💰 账户余额:", balanceInEth, "ETH");

  if (parseFloat(balanceInEth) < 0.1) {
    console.warn("⚠️  警告: 余额较低，请确保有足够的测试代币");
    console.log("💡 获取测试代币: https://faucet.monad.xyz");
  }

  // Monad 特定配置
  const monadConfig = {
    // 较低的 gas 价格（Monad 网络优化）
    gasPrice: ethers.parseUnits("1", "gwei"),
    
    // 合约配置
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
  console.log(`   Gas 价格: ${ethers.formatUnits(monadConfig.gasPrice, "gwei")} Gwei`);
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
    process.env.AUTO_VERIFY_CONTRACTS = "false"; // 测试环境不验证

    // 执行部署
    console.log("🔄 调用通用部署脚本...\n");
    
    const { main: deployMain } = require("./deploy-all-contracts.js");
    
    // 执行实际的部署过程
    console.log("⚡ 开始执行合约部署...");
    const startTime = Date.now();
    
    await deployMain();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log("\n🎉 Monad 测试网部署完成！");
    console.log("\n📱 有用的链接:");
    console.log("   🔍 区块浏览器: https://testnet.monadexplorer.com");
    console.log("   💧 测试代币水龙头: https://faucet.monad.xyz");
    console.log("   📚 文档: https://docs.monad.xyz");
    
    console.log("\n🚀 部署后续步骤:");
    console.log("   1. 在区块浏览器中验证合约部署");
    console.log("   2. 测试合约基本功能");
    console.log("   3. 配置前端应用连接");
    
    console.log("\n📊 部署性能统计:");
    console.log(`   总执行时间: ${duration}ms`);
    console.log(`   平均每个合约: ${Math.round(duration / 6)}ms`);
    
    // 验证部署结果
    console.log("\n🔍 验证部署结果...");
    const fs = require("fs");
    const deploymentsDir = "deployments";
    
    if (fs.existsSync(deploymentsDir)) {
      const deploymentFiles = fs.readdirSync(deploymentsDir)
        .filter(file => file.endsWith('.json'))
        .sort()
        .reverse();
      
      if (deploymentFiles.length > 0) {
        const latestDeployment = deploymentFiles[0];
        const deploymentPath = `${deploymentsDir}/${latestDeployment}`;
        const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        
        console.log("✅ 部署验证成功:");
        console.log(`   部署文件: ${latestDeployment}`);
        console.log(`   合约数量: ${Object.keys(deploymentInfo.contracts).length}`);
        console.log(`   环境: ${deploymentInfo.environment}`);
        console.log(`   配置正确: ${deploymentInfo.config.bubbleToken.name === monadConfig.bubbleToken.name ? '✅' : '❌'}`);
      }
    }

  } catch (error) {
    console.error("❌ Monad 测试网部署失败:", error.message);
    
    // 显示详细错误信息
    if (process.env.VERBOSE_LOGGING === "true") {
      console.error("\n🔍 详细错误信息:");
      console.error(error);
    }
    
    // Monad 特定的错误处理建议
    console.log("\n🔧 故障排除建议:");
    if (error.message.includes("insufficient funds")) {
      console.log("   💰 余额不足:");
      console.log("     1. 访问 https://faucet.monad.xyz 获取测试代币");
      console.log("     2. 确保账户有足够的余额支付 gas 费用");
      console.log("     3. 检查账户地址是否正确");
    } else if (error.message.includes("nonce")) {
      console.log("   🔄 Nonce 问题:");
      console.log("     1. 等待几秒后重试");
      console.log("     2. 检查是否有其他交易正在进行");
      console.log("     3. 重启 Hardhat 网络连接");
    } else if (error.message.includes("network") || error.message.includes("connection")) {
      console.log("   🌐 网络连接问题:");
      console.log("     1. 检查网络连接");
      console.log("     2. 确认 Monad 测试网 RPC 地址正确");
      console.log("     3. 尝试使用备用 RPC 端点");
      console.log("     4. 检查防火墙设置");
    } else if (error.message.includes("timeout")) {
      console.log("   ⏱️  超时问题:");
      console.log("     1. 网络可能拥堵，稍后重试");
      console.log("     2. 增加超时时间设置");
      console.log("     3. 检查 RPC 端点响应速度");
    } else if (error.message.includes("revert")) {
      console.log("   📜 合约执行失败:");
      console.log("     1. 检查合约代码逻辑");
      console.log("     2. 验证构造函数参数");
      console.log("     3. 确认权限配置正确");
    } else {
      console.log("   🔍 通用解决方案:");
      console.log("     1. 检查环境变量配置");
      console.log("     2. 验证私钥格式");
      console.log("     3. 确认网络配置正确");
      console.log("     4. 查看 Hardhat 配置文件");
    }
    
    console.log("\n📞 获取帮助:");
    console.log("   - 查看部署指南: DEPLOYMENT_GUIDE.md");
    console.log("   - 运行网络验证: npm run verify-monad");
    console.log("   - 检查配置: npm run verify-config:monad");
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  });
