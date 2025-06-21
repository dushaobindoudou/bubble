const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * Monad Testnet Network Parameters Verification Script
 * Verifies the correct network configuration for Monad Testnet
 */

async function main() {
  console.log("🔍 验证 Monad 测试网网络参数...\n");

  // Expected Monad Testnet parameters
  const expectedParams = {
    chainId: 10143,
    name: "Monad Testnet",
    currency: "MON",
    rpcUrl: "https://testnet-rpc.monad.xyz",
    blockExplorer: "https://testnet.monadexplorer.com",
    faucet: "https://faucet.monad.xyz"
  };

  console.log("📋 预期的 Monad 测试网参数:");
  console.log(`   网络名称: ${expectedParams.name}`);
  console.log(`   Chain ID: ${expectedParams.chainId}`);
  console.log(`   货币符号: ${expectedParams.currency}`);
  console.log(`   RPC URL: ${expectedParams.rpcUrl}`);
  console.log(`   区块浏览器: ${expectedParams.blockExplorer}`);
  console.log(`   水龙头: ${expectedParams.faucet}\n`);

  try {
    // Check environment variables
    console.log("🔧 检查环境变量配置:");
    
    const envChainId = process.env.MONAD_TESTNET_CHAIN_ID;
    const envRpcUrl = process.env.MONAD_TESTNET_RPC_URL;
    
    if (envChainId && parseInt(envChainId) === expectedParams.chainId) {
      console.log(`✅ MONAD_TESTNET_CHAIN_ID: ${envChainId} (正确)`);
    } else {
      console.log(`❌ MONAD_TESTNET_CHAIN_ID: ${envChainId || '未设置'} (应为 ${expectedParams.chainId})`);
    }
    
    if (envRpcUrl === expectedParams.rpcUrl) {
      console.log(`✅ MONAD_TESTNET_RPC_URL: ${envRpcUrl} (正确)`);
    } else {
      console.log(`❌ MONAD_TESTNET_RPC_URL: ${envRpcUrl || '未设置'} (应为 ${expectedParams.rpcUrl})`);
    }

    // Check network connection
    console.log("\n🌐 检查网络连接:");
    
    const network = await ethers.provider.getNetwork();
    console.log(`   当前连接的网络: ${network.name}`);
    console.log(`   当前 Chain ID: ${network.chainId}`);
    
    if (network.chainId === BigInt(expectedParams.chainId)) {
      console.log("✅ Chain ID 匹配 Monad 测试网");
    } else {
      console.log(`❌ Chain ID 不匹配 (期望: ${expectedParams.chainId}, 实际: ${network.chainId})`);
      console.log("💡 请确保使用正确的网络: --network monadTestnet");
      return;
    }

    // Check account and balance
    console.log("\n👤 检查部署账户:");
    const [deployer] = await ethers.getSigners();
    console.log(`   部署账户: ${deployer.address}`);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    const balanceInEth = ethers.formatEther(balance);
    console.log(`   账户余额: ${balanceInEth} MON`);
    
    if (parseFloat(balanceInEth) > 0) {
      console.log("✅ 账户有余额");
    } else {
      console.log("⚠️  账户余额为零");
      console.log(`💧 获取测试代币: ${expectedParams.faucet}`);
    }

    // Check network responsiveness
    console.log("\n📡 检查网络响应:");
    const startTime = Date.now();
    const blockNumber = await ethers.provider.getBlockNumber();
    const responseTime = Date.now() - startTime;
    
    console.log(`   最新区块: ${blockNumber}`);
    console.log(`   响应时间: ${responseTime}ms`);
    
    if (responseTime < 5000) {
      console.log("✅ 网络响应良好");
    } else {
      console.log("⚠️  网络响应较慢");
    }

    // Check gas price
    const feeData = await ethers.provider.getFeeData();
    if (feeData.gasPrice) {
      const gasPriceGwei = ethers.formatUnits(feeData.gasPrice, "gwei");
      console.log(`   当前 Gas 价格: ${gasPriceGwei} Gwei`);
    }

    // Verify hardhat configuration
    console.log("\n⚙️  验证 Hardhat 配置:");
    const hre = require("hardhat");
    const networkConfig = hre.config.networks.monadTestnet;
    
    if (networkConfig) {
      console.log("✅ Hardhat 中已配置 monadTestnet 网络");
      
      if (networkConfig.chainId === expectedParams.chainId) {
        console.log(`✅ Hardhat 配置的 Chain ID: ${networkConfig.chainId} (正确)`);
      } else {
        console.log(`❌ Hardhat 配置的 Chain ID: ${networkConfig.chainId} (应为 ${expectedParams.chainId})`);
      }
      
      if (networkConfig.url === expectedParams.rpcUrl) {
        console.log(`✅ Hardhat 配置的 RPC URL: ${networkConfig.url} (正确)`);
      } else {
        console.log(`❌ Hardhat 配置的 RPC URL: ${networkConfig.url} (应为 ${expectedParams.rpcUrl})`);
      }
    } else {
      console.log("❌ Hardhat 中未找到 monadTestnet 网络配置");
    }

    // Check etherscan configuration for contract verification
    console.log("\n🔍 检查合约验证配置:");
    const etherscanConfig = hre.config.etherscan;
    
    if (etherscanConfig && etherscanConfig.customChains) {
      const monadChain = etherscanConfig.customChains.find(chain => chain.network === "monadTestnet");
      if (monadChain) {
        console.log("✅ 已配置 Monad 测试网的合约验证");
        
        if (monadChain.chainId === expectedParams.chainId) {
          console.log(`✅ 验证配置的 Chain ID: ${monadChain.chainId} (正确)`);
        } else {
          console.log(`❌ 验证配置的 Chain ID: ${monadChain.chainId} (应为 ${expectedParams.chainId})`);
        }
        
        if (monadChain.urls.browserURL === expectedParams.blockExplorer) {
          console.log(`✅ 区块浏览器 URL: ${monadChain.urls.browserURL} (正确)`);
        } else {
          console.log(`❌ 区块浏览器 URL: ${monadChain.urls.browserURL} (应为 ${expectedParams.blockExplorer})`);
        }
      } else {
        console.log("❌ 未找到 Monad 测试网的合约验证配置");
      }
    }

    console.log("\n🎉 Monad 测试网参数验证完成！");
    console.log("\n📱 有用的链接:");
    console.log(`   🔍 区块浏览器: ${expectedParams.blockExplorer}`);
    console.log(`   💧 测试代币水龙头: ${expectedParams.faucet}`);
    console.log("   📚 文档: https://docs.monad.xyz");
    
    console.log("\n🚀 下一步:");
    console.log("   1. 如果余额不足，请访问水龙头获取测试代币");
    console.log("   2. 运行部署: npm run deploy:monad");
    console.log("   3. 在区块浏览器中查看交易");

  } catch (error) {
    console.error("❌ 网络参数验证失败:", error.message);
    
    console.log("\n🔧 故障排除建议:");
    if (error.message.includes("could not detect network")) {
      console.log("   - 检查网络连接");
      console.log("   - 验证 RPC URL 是否正确");
      console.log("   - 确认 Monad 测试网是否正常运行");
    } else if (error.message.includes("invalid")) {
      console.log("   - 检查环境变量配置");
      console.log("   - 验证私钥格式是否正确");
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
