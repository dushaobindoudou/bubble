const { ethers } = require("hardhat");

async function main() {
  console.log("🔑 授予用户角色权限...");

  // 获取合约地址
  const BUBBLE_TOKEN_ADDRESS = "0xd323f3339396Cf6C1E31b8Ede701B34360eC4730";

  // 获取签名者
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);

  // 连接到BubbleToken合约
  const BubbleToken = await ethers.getContractFactory("BubbleToken");
  const bubbleToken = BubbleToken.attach(BUBBLE_TOKEN_ADDRESS);

  try {
    // 检查当前权限
    console.log("\n📋 检查当前权限...");
    
    const hasGameRewardRole = await bubbleToken.hasGameRewardRole(deployer.address);
    console.log("GAME_REWARD_ROLE:", hasGameRewardRole);

    // 如果没有GAME_REWARD_ROLE，则授予
    if (!hasGameRewardRole) {
      console.log("\n🎯 授予 GAME_REWARD_ROLE...");
      const tx1 = await bubbleToken.grantGameRewardRole(deployer.address);
      await tx1.wait();
      console.log("✅ GAME_REWARD_ROLE 授予成功");
    } else {
      console.log("✅ 已拥有 GAME_REWARD_ROLE");
    }

    console.log("\n🎉 权限授予完成！");

  } catch (error) {
    console.error("❌ 授予权限失败:", error.message);
    if (error.reason) {
      console.error("原因:", error.reason);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
