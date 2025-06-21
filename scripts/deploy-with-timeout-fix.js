const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * 修复超时问题的部署脚本
 * 专门用于测试和解决部署挂起问题
 */

// 改进的等待确认函数
async function waitForConfirmationFixed(tx, description, timeoutMs = 30000) {
  console.log(`⏳ 等待 ${description} 交易确认...`);
  console.log(`   交易哈希: ${tx.hash}`);
  
  try {
    // 获取网络信息
    const network = await ethers.provider.getNetwork();
    const isLocalNetwork = network.chainId === 31337n || network.chainId === 1337n;
    
    // 本地网络使用1个确认，其他网络使用配置的确认数
    const confirmations = isLocalNetwork ? 1 : parseInt(process.env.CONFIRMATIONS || "2");
    console.log(`   等待 ${confirmations} 个确认 (网络: ${network.name})`);
    
    // 对于本地网络，使用更短的超时时间
    const actualTimeout = isLocalNetwork ? 10000 : timeoutMs;
    
    // 创建超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`交易确认超时 (${actualTimeout}ms): ${description}`));
      }, actualTimeout);
    });
    
    // 等待交易确认或超时
    const receipt = await Promise.race([
      tx.wait(confirmations),
      timeoutPromise
    ]);
    
    console.log(`✅ ${description} 完成`);
    console.log(`   Gas 使用: ${receipt.gasUsed.toString()}`);
    console.log(`   区块号: ${receipt.blockNumber}`);
    console.log(`   状态: ${receipt.status === 1 ? '成功' : '失败'}`);
    
    return receipt;
    
  } catch (error) {
    console.error(`❌ ${description} 失败:`, error.message);
    
    // 尝试获取交易状态
    try {
      const txReceipt = await ethers.provider.getTransactionReceipt(tx.hash);
      if (txReceipt) {
        console.log(`   交易已上链 - 状态: ${txReceipt.status === 1 ? '成功' : '失败'}`);
        console.log(`   区块号: ${txReceipt.blockNumber}`);
        console.log(`   Gas 使用: ${txReceipt.gasUsed.toString()}`);
        
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

// 安全的角色授予函数
async function grantRoleSafely(contract, role, account, roleName) {
  console.log(`   配置 ${roleName}...`);
  console.log(`   角色: ${role}`);
  console.log(`   账户: ${account}`);
  
  try {
    // 检查是否已经有权限
    const hasRole = await contract.hasRole(role, account);
    if (hasRole) {
      console.log(`   ✅ ${roleName} 已存在，跳过授予`);
      return null;
    }
    
    // 授予权限
    console.log(`   正在授予 ${roleName}...`);
    const tx = await contract.grantRole(role, account);
    const receipt = await waitForConfirmationFixed(tx, `${roleName}授予`);
    
    // 验证权限是否成功授予
    const hasRoleAfter = await contract.hasRole(role, account);
    if (!hasRoleAfter) {
      throw new Error(`${roleName}授予失败 - 权限验证失败`);
    }
    
    console.log(`   ✅ ${roleName} 验证成功`);
    return receipt;
    
  } catch (error) {
    console.error(`   ❌ ${roleName} 配置失败:`, error.message);
    throw error;
  }
}

async function main() {
  console.log("🧪 开始修复超时问题的部署测试...\n");

  // 获取网络信息
  const network = await ethers.provider.getNetwork();
  console.log(`📡 网络: ${network.name} (Chain ID: ${network.chainId})`);

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("👤 部署账户:", deployer.address);
  console.log("💰 账户余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  try {
    // 1. 快速部署核心合约
    console.log("💰 部署 BubbleToken...");
    const BubbleToken = await ethers.getContractFactory("BubbleToken");
    const bubbleToken = await BubbleToken.deploy();
    await bubbleToken.waitForDeployment();
    const bubbleTokenAddress = await bubbleToken.getAddress();
    console.log("✅ BubbleToken 部署完成:", bubbleTokenAddress);

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

    console.log("\n🎮 部署 GameRewards...");
    const GameRewards = await ethers.getContractFactory("GameRewards");
    const gameRewards = await GameRewards.deploy(
      bubbleTokenAddress,
      bubbleSkinNFTAddress
    );
    await gameRewards.waitForDeployment();
    const gameRewardsAddress = await gameRewards.getAddress();
    console.log("✅ GameRewards 部署完成:", gameRewardsAddress);

    // 2. 测试权限配置（这是之前挂起的地方）
    console.log("\n⚙️  测试权限配置（修复版本）...");

    // 获取角色常量
    const GAME_REWARD_ROLE = await bubbleToken.GAME_REWARD_ROLE();
    const MINTER_ROLE = await bubbleSkinNFT.MINTER_ROLE();

    console.log(`🔑 角色信息:`);
    console.log(`   GAME_REWARD_ROLE: ${GAME_REWARD_ROLE}`);
    console.log(`   MINTER_ROLE: ${MINTER_ROLE}`);
    console.log(`   GameRewards 地址: ${gameRewardsAddress}\n`);

    // 测试代币铸造权限授予
    await grantRoleSafely(
      bubbleToken, 
      GAME_REWARD_ROLE, 
      gameRewardsAddress, 
      "代币铸造权限"
    );

    // 测试NFT铸造权限授予
    await grantRoleSafely(
      bubbleSkinNFT, 
      MINTER_ROLE, 
      gameRewardsAddress, 
      "NFT铸造权限"
    );

    // 3. 验证权限配置
    console.log("\n🔍 验证权限配置...");
    
    const hasTokenRole = await bubbleToken.hasRole(GAME_REWARD_ROLE, gameRewardsAddress);
    const hasNFTRole = await bubbleSkinNFT.hasRole(MINTER_ROLE, gameRewardsAddress);
    
    console.log(`   代币铸造权限: ${hasTokenRole ? '✅ 已授予' : '❌ 未授予'}`);
    console.log(`   NFT铸造权限: ${hasNFTRole ? '✅ 已授予' : '❌ 未授予'}`);

    if (!hasTokenRole || !hasNFTRole) {
      throw new Error("权限验证失败");
    }

    // 4. 测试基本功能
    console.log("\n🧪 测试基本功能...");
    
    // 测试代币名称和符号
    const tokenName = await bubbleToken.name();
    const tokenSymbol = await bubbleToken.symbol();
    console.log(`   代币: ${tokenName} (${tokenSymbol})`);
    
    // 测试NFT名称和符号
    const nftName = await bubbleSkinNFT.name();
    const nftSymbol = await bubbleSkinNFT.symbol();
    console.log(`   NFT: ${nftName} (${nftSymbol})`);

    // 5. 性能测试
    console.log("\n⏱️  性能测试...");
    const startTime = Date.now();
    
    // 测试多个快速交易
    for (let i = 0; i < 3; i++) {
      console.log(`   执行测试交易 ${i + 1}/3...`);
      const testTx = await bubbleToken.transfer(deployer.address, 0);
      await waitForConfirmationFixed(testTx, `测试交易 ${i + 1}`, 5000);
    }
    
    const endTime = Date.now();
    console.log(`   性能测试完成，总耗时: ${endTime - startTime}ms`);

    console.log("\n🎉 超时问题修复测试成功完成！");
    console.log("\n📊 测试结果:");
    console.log("   ✅ 合约部署正常");
    console.log("   ✅ 权限配置正常");
    console.log("   ✅ 交易确认正常");
    console.log("   ✅ 超时机制正常");
    
    console.log("\n💡 修复要点:");
    console.log("   1. 添加了交易确认超时机制");
    console.log("   2. 本地网络使用1个确认而非2个");
    console.log("   3. 增加了详细的错误处理和日志");
    console.log("   4. 添加了权限验证步骤");
    console.log("   5. 实现了交易状态检查");

  } catch (error) {
    console.error("❌ 测试失败:", error);
    
    console.log("\n🔧 调试信息:");
    console.log(`   错误类型: ${error.constructor.name}`);
    console.log(`   错误消息: ${error.message}`);
    
    if (error.transaction) {
      console.log(`   交易哈希: ${error.transaction.hash}`);
    }
    
    if (error.receipt) {
      console.log(`   交易状态: ${error.receipt.status}`);
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
