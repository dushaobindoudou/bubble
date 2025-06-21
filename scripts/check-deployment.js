const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * 部署状态检查脚本
 * 验证已部署合约的状态和配置
 */

async function main() {
  console.log("🔍 检查部署状态...\n");

  // 获取网络信息
  const network = await ethers.provider.getNetwork();
  console.log(`📡 网络: ${network.name} (Chain ID: ${network.chainId})`);

  // 查找最新的部署文件
  const deploymentsDir = "deployments";
  if (!fs.existsSync(deploymentsDir)) {
    console.error("❌ 未找到部署目录，请先部署合约");
    process.exit(1);
  }

  const deploymentFiles = fs.readdirSync(deploymentsDir)
    .filter(file => file.includes(network.name) && file.endsWith('.json'))
    .sort()
    .reverse();

  if (deploymentFiles.length === 0) {
    console.error(`❌ 未找到 ${network.name} 网络的部署文件`);
    process.exit(1);
  }

  const latestDeployment = deploymentFiles[0];
  console.log(`📄 使用部署文件: ${latestDeployment}`);

  // 读取部署信息
  const deploymentPath = path.join(deploymentsDir, latestDeployment);
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

  console.log(`⏰ 部署时间: ${deploymentInfo.timestamp}`);
  console.log(`👤 部署者: ${deploymentInfo.deployer}\n`);

  // 检查每个合约
  const contracts = deploymentInfo.contracts;
  const contractChecks = [];

  for (const [contractName, contractAddress] of Object.entries(contracts)) {
    console.log(`🔍 检查 ${contractName}...`);
    
    try {
      // 检查合约代码
      const code = await ethers.provider.getCode(contractAddress);
      if (code === "0x") {
        console.log(`❌ ${contractName}: 合约代码不存在`);
        contractChecks.push({ name: contractName, status: "failed", error: "No code" });
        continue;
      }

      // 获取合约实例
      let contract;
      try {
        const contractFactory = await ethers.getContractFactory(contractName);
        contract = contractFactory.attach(contractAddress);
      } catch (error) {
        console.log(`⚠️  ${contractName}: 无法创建合约实例 - ${error.message}`);
        contractChecks.push({ name: contractName, status: "warning", error: error.message });
        continue;
      }

      // 执行合约特定的检查
      const checkResult = await checkContract(contractName, contract, deploymentInfo);
      contractChecks.push(checkResult);

      if (checkResult.status === "success") {
        console.log(`✅ ${contractName}: 运行正常`);
      } else if (checkResult.status === "warning") {
        console.log(`⚠️  ${contractName}: ${checkResult.error}`);
      } else {
        console.log(`❌ ${contractName}: ${checkResult.error}`);
      }

    } catch (error) {
      console.log(`❌ ${contractName}: 检查失败 - ${error.message}`);
      contractChecks.push({ name: contractName, status: "failed", error: error.message });
    }
  }

  // 输出检查摘要
  console.log("\n📊 检查摘要:");
  console.log("=".repeat(50));
  
  const successful = contractChecks.filter(c => c.status === "success").length;
  const warnings = contractChecks.filter(c => c.status === "warning").length;
  const failed = contractChecks.filter(c => c.status === "failed").length;

  console.log(`✅ 成功: ${successful}`);
  console.log(`⚠️  警告: ${warnings}`);
  console.log(`❌ 失败: ${failed}`);

  if (failed > 0) {
    console.log("\n❌ 部分合约检查失败，请检查部署状态");
    process.exit(1);
  } else if (warnings > 0) {
    console.log("\n⚠️  部分合约有警告，建议检查配置");
  } else {
    console.log("\n🎉 所有合约运行正常！");
  }
}

/**
 * 检查特定合约的状态
 */
async function checkContract(contractName, contract, deploymentInfo) {
  try {
    switch (contractName) {
      case "BubbleToken":
        return await checkBubbleToken(contract, deploymentInfo);
      
      case "BubbleSkinNFT":
        return await checkBubbleSkinNFT(contract, deploymentInfo);
      
      case "GameRewards":
        return await checkGameRewards(contract, deploymentInfo);
      
      case "Marketplace":
        return await checkMarketplace(contract, deploymentInfo);
      
      case "RandomGenerator":
        return await checkRandomGenerator(contract);
      
      case "AccessControlManager":
        return await checkAccessControlManager(contract);
      
      default:
        return { name: contractName, status: "success", details: "基本检查通过" };
    }
  } catch (error) {
    return { name: contractName, status: "failed", error: error.message };
  }
}

async function checkBubbleToken(contract, deploymentInfo) {
  const name = await contract.name();
  const symbol = await contract.symbol();
  const totalSupply = await contract.totalSupply();
  
  const expectedName = deploymentInfo.config?.bubbleToken?.name || "Bubble";
  const expectedSymbol = deploymentInfo.config?.bubbleToken?.symbol || "BUB";
  
  if (name !== expectedName || symbol !== expectedSymbol) {
    return { 
      name: "BubbleToken", 
      status: "warning", 
      error: `配置不匹配: ${name}/${symbol} vs ${expectedName}/${expectedSymbol}` 
    };
  }
  
  return { 
    name: "BubbleToken", 
    status: "success", 
    details: `${name} (${symbol}), 总供应量: ${ethers.formatEther(totalSupply)}` 
  };
}

async function checkBubbleSkinNFT(contract, deploymentInfo) {
  const name = await contract.name();
  const symbol = await contract.symbol();
  const totalTemplates = await contract.getTotalTemplates();
  const totalSupply = await contract.getTotalSupply();
  
  return { 
    name: "BubbleSkinNFT", 
    status: "success", 
    details: `${name} (${symbol}), 模板数: ${totalTemplates}, NFT数: ${totalSupply}` 
  };
}

async function checkGameRewards(contract, deploymentInfo) {
  const rewardConfig = await contract.rewardConfig();
  const [totalRewards, totalTokens, totalSessions, enabled] = await contract.getSystemStats();
  
  if (!enabled) {
    return { 
      name: "GameRewards", 
      status: "warning", 
      error: "奖励系统已禁用" 
    };
  }
  
  return { 
    name: "GameRewards", 
    status: "success", 
    details: `奖励数: ${totalRewards}, 代币数: ${ethers.formatEther(totalTokens)}, 会话数: ${totalSessions}` 
  };
}

async function checkMarketplace(contract, deploymentInfo) {
  const feePercentage = await contract.feePercentage();
  const feeRecipient = await contract.feeRecipient();
  const [totalListings, totalSales, totalVolume, activeListings] = await contract.getMarketStats();
  
  return { 
    name: "Marketplace", 
    status: "success", 
    details: `手续费: ${feePercentage/100}%, 挂单: ${totalListings}, 销售: ${totalSales}` 
  };
}

async function checkRandomGenerator(contract) {
  const nonce = await contract.getCurrentNonce();
  
  return { 
    name: "RandomGenerator", 
    status: "success", 
    details: `当前 nonce: ${nonce}` 
  };
}

async function checkAccessControlManager(contract) {
  // 检查基本角色是否存在
  const adminRole = await contract.DEFAULT_ADMIN_ROLE();
  
  return { 
    name: "AccessControlManager", 
    status: "success", 
    details: "权限管理器运行正常" 
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 检查失败:", error);
    process.exit(1);
  });
