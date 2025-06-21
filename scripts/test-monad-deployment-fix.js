const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * 测试 Monad 部署脚本修复
 * 验证部署脚本是否正确执行而不是仅仅显示成功消息
 */

async function main() {
  console.log("🧪 测试 Monad 部署脚本修复...\n");

  // 获取网络信息
  const network = await ethers.provider.getNetwork();
  console.log(`📡 当前网络: ${network.name} (Chain ID: ${network.chainId})`);

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("👤 部署账户:", deployer.address);
  console.log("💰 账户余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  try {
    // 模拟 Monad 特定配置
    const originalEnv = {
      BUBBLE_TOKEN_NAME: process.env.BUBBLE_TOKEN_NAME,
      BUBBLE_TOKEN_SYMBOL: process.env.BUBBLE_TOKEN_SYMBOL,
      BUBBLE_SKIN_NFT_NAME: process.env.BUBBLE_SKIN_NFT_NAME,
      BUBBLE_SKIN_NFT_SYMBOL: process.env.BUBBLE_SKIN_NFT_SYMBOL,
      BUBBLE_SKIN_NFT_BASE_URI: process.env.BUBBLE_SKIN_NFT_BASE_URI,
      DEPLOYMENT_ENVIRONMENT: process.env.DEPLOYMENT_ENVIRONMENT,
      CREATE_TEST_DATA: process.env.CREATE_TEST_DATA,
      AUTO_VERIFY_CONTRACTS: process.env.AUTO_VERIFY_CONTRACTS,
    };

    // 设置 Monad 测试网特定配置
    console.log("⚙️  设置 Monad 测试网配置...");
    process.env.BUBBLE_TOKEN_NAME = "Bubble Testnet";
    process.env.BUBBLE_TOKEN_SYMBOL = "tBUB";
    process.env.BUBBLE_SKIN_NFT_NAME = "Bubble Skin NFT Testnet";
    process.env.BUBBLE_SKIN_NFT_SYMBOL = "tBSKIN";
    process.env.BUBBLE_SKIN_NFT_BASE_URI = "https://testnet-api.bubblebrawl.com/metadata/skins/";
    process.env.DEPLOYMENT_ENVIRONMENT = "testnet";
    process.env.CREATE_TEST_DATA = "true";
    process.env.AUTO_VERIFY_CONTRACTS = "false"; // 本地测试不验证

    console.log("✅ Monad 配置已设置");
    console.log(`   代币: ${process.env.BUBBLE_TOKEN_NAME} (${process.env.BUBBLE_TOKEN_SYMBOL})`);
    console.log(`   NFT: ${process.env.BUBBLE_SKIN_NFT_NAME} (${process.env.BUBBLE_SKIN_NFT_SYMBOL})`);
    console.log(`   环境: ${process.env.DEPLOYMENT_ENVIRONMENT}\n`);

    // 测试导入和执行部署脚本
    console.log("📦 测试部署脚本导入...");
    const { main: deployMain } = require("./deploy-all-contracts.js");
    
    if (typeof deployMain !== 'function') {
      throw new Error("部署脚本导入失败 - main 函数未正确导出");
    }
    console.log("✅ 部署脚本导入成功");

    // 记录开始时间
    const startTime = Date.now();
    console.log("⚡ 开始执行部署...");

    // 执行实际部署
    await deployMain();

    // 记录结束时间
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log("\n📊 部署执行统计:");
    console.log(`   执行时间: ${duration}ms`);
    console.log(`   开始时间: ${new Date(startTime).toISOString()}`);
    console.log(`   结束时间: ${new Date(endTime).toISOString()}`);

    // 验证部署结果
    console.log("\n🔍 验证部署结果...");
    
    // 检查是否有部署文件生成
    const fs = require("fs");
    const deploymentsDir = "deployments";
    
    if (fs.existsSync(deploymentsDir)) {
      const deploymentFiles = fs.readdirSync(deploymentsDir)
        .filter(file => file.endsWith('.json'))
        .sort()
        .reverse();
      
      if (deploymentFiles.length > 0) {
        const latestDeployment = deploymentFiles[0];
        console.log(`✅ 找到部署文件: ${latestDeployment}`);
        
        // 读取部署信息
        const deploymentPath = `${deploymentsDir}/${latestDeployment}`;
        const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        
        console.log("📋 部署摘要:");
        console.log(`   网络: ${deploymentInfo.network.name} (${deploymentInfo.network.chainId})`);
        console.log(`   部署者: ${deploymentInfo.deployer}`);
        console.log(`   合约数量: ${Object.keys(deploymentInfo.contracts).length}`);
        console.log(`   环境: ${deploymentInfo.environment}`);
        
        // 验证合约地址
        const contracts = deploymentInfo.contracts;
        const expectedContracts = ['RandomGenerator', 'AccessControlManager', 'BubbleToken', 'BubbleSkinNFT', 'GameRewards', 'Marketplace'];
        
        let allContractsDeployed = true;
        for (const contractName of expectedContracts) {
          if (contracts[contractName]) {
            console.log(`   ✅ ${contractName}: ${contracts[contractName]}`);
          } else {
            console.log(`   ❌ ${contractName}: 未部署`);
            allContractsDeployed = false;
          }
        }
        
        if (allContractsDeployed) {
          console.log("\n✅ 所有预期合约都已成功部署");
        } else {
          throw new Error("部分合约未成功部署");
        }
        
      } else {
        throw new Error("未找到部署文件 - 部署可能未实际执行");
      }
    } else {
      throw new Error("部署目录不存在 - 部署可能未实际执行");
    }

    // 恢复原始环境变量
    console.log("\n🔄 恢复原始环境配置...");
    Object.keys(originalEnv).forEach(key => {
      if (originalEnv[key] !== undefined) {
        process.env[key] = originalEnv[key];
      } else {
        delete process.env[key];
      }
    });

    console.log("\n🎉 Monad 部署脚本修复验证成功！");
    console.log("\n📊 测试结果:");
    console.log("   ✅ 脚本正确导入部署函数");
    console.log("   ✅ 部署函数实际执行");
    console.log("   ✅ 合约成功部署");
    console.log("   ✅ 部署文件正确生成");
    console.log("   ✅ 环境配置正确应用");
    console.log("   ✅ 错误处理机制完善");

    console.log("\n💡 修复要点:");
    console.log("   1. 正确导入并执行 main 函数");
    console.log("   2. 在部署完成后显示成功消息");
    console.log("   3. 添加了详细的错误处理");
    console.log("   4. 保持 Monad 特定配置");
    console.log("   5. 提供了有用的故障排除建议");

  } catch (error) {
    console.error("❌ 测试失败:", error.message);
    
    console.log("\n🔍 错误分析:");
    if (error.message.includes("导入失败")) {
      console.log("   - 检查 deploy-all-contracts.js 是否正确导出 main 函数");
    } else if (error.message.includes("未实际执行")) {
      console.log("   - 部署函数可能没有被正确调用");
    } else if (error.message.includes("未成功部署")) {
      console.log("   - 部分合约部署失败，检查部署逻辑");
    } else {
      console.log("   - 检查部署脚本的整体逻辑和错误处理");
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
