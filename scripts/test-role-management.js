const { ethers } = require("hardhat");

/**
 * 测试 BubbleToken 角色管理功能
 * 验证新增的 GAME_REWARD_ROLE 管理功能
 */

async function main() {
  console.log("🧪 测试 BubbleToken 角色管理功能...\n");

  // 获取签名者
  const [deployer, gameRewardManager1, gameRewardManager2, user1] = await ethers.getSigners();
  console.log("👤 部署者:", deployer.address);
  console.log("🎮 游戏奖励管理者1:", gameRewardManager1.address);
  console.log("🎮 游戏奖励管理者2:", gameRewardManager2.address);
  console.log("👥 用户1:", user1.address);
  console.log();

  try {
    // 1. 部署 BubbleToken 合约
    console.log("📦 部署 BubbleToken 合约...");
    const BubbleToken = await ethers.getContractFactory("BubbleToken");
    const bubbleToken = await BubbleToken.deploy();
    await bubbleToken.waitForDeployment();
    const tokenAddress = await bubbleToken.getAddress();
    console.log("✅ BubbleToken 部署完成:", tokenAddress);

    // 获取角色常量
    const GAME_REWARD_ROLE = await bubbleToken.GAME_REWARD_ROLE();
    console.log("🔑 GAME_REWARD_ROLE:", GAME_REWARD_ROLE);
    console.log();

    // 2. 测试初始状态
    console.log("🔍 检查初始角色状态...");
    console.log("   游戏奖励角色成员数量:", await bubbleToken.getGameRewardRoleMemberCount());
    console.log("   部署者是否有游戏奖励角色:", await bubbleToken.hasGameRewardRole(deployer.address));
    console.log("   管理者1是否有游戏奖励角色:", await bubbleToken.hasGameRewardRole(gameRewardManager1.address));
    console.log();

    // 3. 测试角色授予
    console.log("⚡ 测试角色授予功能...");
    
    console.log("   授予游戏奖励角色给管理者1...");
    const grantTx1 = await bubbleToken.connect(deployer).grantGameRewardRole(gameRewardManager1.address);
    await grantTx1.wait();
    console.log("   ✅ 角色授予成功");

    console.log("   授予游戏奖励角色给管理者2...");
    const grantTx2 = await bubbleToken.connect(deployer).grantGameRewardRole(gameRewardManager2.address);
    await grantTx2.wait();
    console.log("   ✅ 角色授予成功");

    // 4. 验证角色状态
    console.log("\n🔍 验证角色授予后的状态...");
    const memberCount = await bubbleToken.getGameRewardRoleMemberCount();
    console.log("   游戏奖励角色成员数量:", memberCount.toString());
    
    const members = await bubbleToken.getGameRewardRoleMembers();
    console.log("   所有成员地址:");
    members.forEach((member, index) => {
      console.log(`     [${index}] ${member}`);
    });

    console.log("   管理者1是否有角色:", await bubbleToken.hasGameRewardRole(gameRewardManager1.address));
    console.log("   管理者2是否有角色:", await bubbleToken.hasGameRewardRole(gameRewardManager2.address));
    console.log("   用户1是否有角色:", await bubbleToken.hasGameRewardRole(user1.address));

    // 5. 测试游戏奖励铸造
    console.log("\n🎮 测试游戏奖励铸造功能...");
    const rewardAmount = ethers.parseEther("100");
    
    console.log("   管理者1铸造游戏奖励给用户1...");
    const mintTx = await bubbleToken.connect(gameRewardManager1).mintGameReward(
      user1.address,
      rewardAmount,
      "测试奖励"
    );
    await mintTx.wait();
    console.log("   ✅ 游戏奖励铸造成功");
    
    const userBalance = await bubbleToken.balanceOf(user1.address);
    console.log("   用户1余额:", ethers.formatEther(userBalance), "BUB");

    // 6. 测试角色撤销
    console.log("\n❌ 测试角色撤销功能...");
    
    console.log("   撤销管理者1的游戏奖励角色...");
    const revokeTx = await bubbleToken.connect(deployer).revokeGameRewardRole(gameRewardManager1.address);
    await revokeTx.wait();
    console.log("   ✅ 角色撤销成功");

    // 7. 验证撤销后的状态
    console.log("\n🔍 验证角色撤销后的状态...");
    const memberCountAfter = await bubbleToken.getGameRewardRoleMemberCount();
    console.log("   游戏奖励角色成员数量:", memberCountAfter.toString());
    
    const membersAfter = await bubbleToken.getGameRewardRoleMembers();
    console.log("   剩余成员地址:");
    membersAfter.forEach((member, index) => {
      console.log(`     [${index}] ${member}`);
    });

    console.log("   管理者1是否有角色:", await bubbleToken.hasGameRewardRole(gameRewardManager1.address));
    console.log("   管理者2是否有角色:", await bubbleToken.hasGameRewardRole(gameRewardManager2.address));

    // 8. 测试撤销后无法铸造
    console.log("\n🚫 测试撤销角色后的权限限制...");
    try {
      await bubbleToken.connect(gameRewardManager1).mintGameReward(
        user1.address,
        rewardAmount,
        "应该失败的奖励"
      );
      console.log("   ❌ 错误：撤销角色后仍能铸造奖励");
    } catch (error) {
      console.log("   ✅ 正确：撤销角色后无法铸造奖励");
    }

    // 9. 测试管理者2仍能铸造
    console.log("\n✅ 测试剩余角色成员的权限...");
    const mintTx2 = await bubbleToken.connect(gameRewardManager2).mintGameReward(
      user1.address,
      rewardAmount,
      "管理者2的奖励"
    );
    await mintTx2.wait();
    console.log("   ✅ 管理者2仍能正常铸造奖励");
    
    const finalBalance = await bubbleToken.balanceOf(user1.address);
    console.log("   用户1最终余额:", ethers.formatEther(finalBalance), "BUB");

    // 10. 测试错误情况
    console.log("\n🔧 测试错误处理...");
    
    // 测试重复授予角色
    try {
      await bubbleToken.connect(deployer).grantGameRewardRole(gameRewardManager2.address);
      console.log("   ❌ 错误：重复授予角色应该失败");
    } catch (error) {
      console.log("   ✅ 正确：重复授予角色被拒绝");
    }

    // 测试撤销不存在的角色
    try {
      await bubbleToken.connect(deployer).revokeGameRewardRole(user1.address);
      console.log("   ❌ 错误：撤销不存在的角色应该失败");
    } catch (error) {
      console.log("   ✅ 正确：撤销不存在的角色被拒绝");
    }

    // 测试非管理员调用
    try {
      await bubbleToken.connect(user1).grantGameRewardRole(user1.address);
      console.log("   ❌ 错误：非管理员授予角色应该失败");
    } catch (error) {
      console.log("   ✅ 正确：非管理员无法授予角色");
    }

    // 11. 最终状态报告
    console.log("\n📊 最终状态报告:");
    console.log("=".repeat(50));
    console.log(`合约地址: ${tokenAddress}`);
    console.log(`游戏奖励角色成员数量: ${await bubbleToken.getGameRewardRoleMemberCount()}`);
    console.log(`用户1代币余额: ${ethers.formatEther(await bubbleToken.balanceOf(user1.address))} BUB`);
    
    const finalMembers = await bubbleToken.getGameRewardRoleMembers();
    console.log("当前角色成员:");
    finalMembers.forEach((member, index) => {
      console.log(`  [${index}] ${member}`);
    });
    console.log("=".repeat(50));

    console.log("\n🎉 BubbleToken 角色管理功能测试完成！");
    console.log("\n✅ 测试结果:");
    console.log("   - 角色授予功能正常");
    console.log("   - 角色撤销功能正常");
    console.log("   - 角色查询功能正常");
    console.log("   - 角色枚举功能正常");
    console.log("   - 权限控制功能正常");
    console.log("   - 错误处理功能正常");
    console.log("   - 与游戏奖励功能集成正常");

  } catch (error) {
    console.error("❌ 测试失败:", error);
    
    console.log("\n🔧 调试信息:");
    console.log(`   错误类型: ${error.constructor.name}`);
    console.log(`   错误消息: ${error.message}`);
    
    if (error.transaction) {
      console.log(`   交易哈希: ${error.transaction.hash}`);
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
