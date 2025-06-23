const { ethers } = require("hardhat");

async function main() {
  console.log("🔑 授予用户角色权限...");

  // 获取合约地址
  const BUBBLE_TOKEN_ADDRESS = "0xd323f3339396Cf6C1E31b8Ede701B34360eC4730";
  const BUBBLE_SKIN_NFT_ADDRESS = "0x20F49671A6f9ca3733363a90dDabA2234D98F716";

  // 获取签名者
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);

  // 连接到BubbleToken合约
  const BubbleToken = await ethers.getContractFactory("BubbleToken");
  const bubbleToken = BubbleToken.attach(BUBBLE_TOKEN_ADDRESS);

  // 连接到BubbleSkinNFT合约
  const BubbleSkinNFT = await ethers.getContractFactory("BubbleSkinNFT");
  const bubbleSkinNFT = BubbleSkinNFT.attach(BUBBLE_SKIN_NFT_ADDRESS);

  try {
    // 检查当前权限
    console.log("\n📋 检查当前权限...");
    
    const hasGameRewardRole = await bubbleToken.hasGameRewardRole(deployer.address);
    const hasAdminRole = await bubbleToken.hasRole(await bubbleToken.ADMIN_ROLE(), deployer.address);
    const hasDefaultAdminRole = await bubbleToken.hasRole(await bubbleToken.DEFAULT_ADMIN_ROLE(), deployer.address);
    
    console.log("GAME_REWARD_ROLE:", hasGameRewardRole);
    console.log("ADMIN_ROLE:", hasAdminRole);
    console.log("DEFAULT_ADMIN_ROLE:", hasDefaultAdminRole);

    // 如果没有GAME_REWARD_ROLE，则授予
    if (!hasGameRewardRole) {
      console.log("\n🎯 授予 GAME_REWARD_ROLE...");
      const tx1 = await bubbleToken.grantGameRewardRole(deployer.address);
      await tx1.wait();
      console.log("✅ GAME_REWARD_ROLE 授予成功");
    } else {
      console.log("✅ 已拥有 GAME_REWARD_ROLE");
    }

    // 检查NFT合约权限
    console.log("\n📋 检查NFT合约权限...");
    const hasNFTAdminRole = await bubbleSkinNFT.hasRole(await bubbleSkinNFT.ADMIN_ROLE(), deployer.address);
    const hasNFTMinterRole = await bubbleSkinNFT.hasRole(await bubbleSkinNFT.MINTER_ROLE(), deployer.address);
    const hasNFTSkinManagerRole = await bubbleSkinNFT.hasRole(await bubbleSkinNFT.SKIN_MANAGER_ROLE(), deployer.address);
    
    console.log("NFT ADMIN_ROLE:", hasNFTAdminRole);
    console.log("NFT MINTER_ROLE:", hasNFTMinterRole);
    console.log("NFT SKIN_MANAGER_ROLE:", hasNFTSkinManagerRole);

    // 如果没有MINTER_ROLE，则授予
    if (!hasNFTMinterRole) {
      console.log("\n🎯 授予 NFT MINTER_ROLE...");
      const tx2 = await bubbleSkinNFT.grantRole(await bubbleSkinNFT.MINTER_ROLE(), deployer.address);
      await tx2.wait();
      console.log("✅ NFT MINTER_ROLE 授予成功");
    } else {
      console.log("✅ 已拥有 NFT MINTER_ROLE");
    }

    // 如果没有SKIN_MANAGER_ROLE，则授予
    if (!hasNFTSkinManagerRole) {
      console.log("\n🎯 授予 NFT SKIN_MANAGER_ROLE...");
      const tx3 = await bubbleSkinNFT.grantRole(await bubbleSkinNFT.SKIN_MANAGER_ROLE(), deployer.address);
      await tx3.wait();
      console.log("✅ NFT SKIN_MANAGER_ROLE 授予成功");
    } else {
      console.log("✅ 已拥有 NFT SKIN_MANAGER_ROLE");
    }

    console.log("\n🎉 权限授予完成！");
    
    // 最终权限检查
    console.log("\n📋 最终权限状态:");
    console.log("Token GAME_REWARD_ROLE:", await bubbleToken.hasGameRewardRole(deployer.address));
    console.log("NFT MINTER_ROLE:", await bubbleSkinNFT.hasRole(await bubbleSkinNFT.MINTER_ROLE(), deployer.address));
    console.log("NFT SKIN_MANAGER_ROLE:", await bubbleSkinNFT.hasRole(await bubbleSkinNFT.SKIN_MANAGER_ROLE(), deployer.address));

  } catch (error) {
    console.error("❌ 授予权限失败:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
