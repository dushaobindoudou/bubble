const { ethers } = require("hardhat");

async function main() {
  console.log("🔑 授予皮肤合约权限...");

  // 获取合约地址
  const BUBBLE_SKIN_NFT_ADDRESS = "0x6Cde3abE9ACC5028330bd301415e59877D0A5Bdd";

  // 获取签名者
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);

  // 连接到BubbleSkinNFT合约
  const BubbleSkinNFT = await ethers.getContractFactory("BubbleSkinNFT");
  const bubbleSkinNFT = BubbleSkinNFT.attach(BUBBLE_SKIN_NFT_ADDRESS);

  try {
    // 获取角色哈希
    const ADMIN_ROLE = await bubbleSkinNFT.ADMIN_ROLE();
    const SKIN_MANAGER_ROLE = await bubbleSkinNFT.SKIN_MANAGER_ROLE();
    const MINTER_ROLE = await bubbleSkinNFT.MINTER_ROLE();
    const DEFAULT_ADMIN_ROLE = await bubbleSkinNFT.DEFAULT_ADMIN_ROLE();

    console.log("\n📋 角色哈希:");
    console.log("DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);
    console.log("ADMIN_ROLE:", ADMIN_ROLE);
    console.log("SKIN_MANAGER_ROLE:", SKIN_MANAGER_ROLE);
    console.log("MINTER_ROLE:", MINTER_ROLE);

    // 检查当前权限
    console.log("\n📋 检查当前权限...");
    
    const hasDefaultAdminRole = await bubbleSkinNFT.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    const hasAdminRole = await bubbleSkinNFT.hasRole(ADMIN_ROLE, deployer.address);
    const hasSkinManagerRole = await bubbleSkinNFT.hasRole(SKIN_MANAGER_ROLE, deployer.address);
    const hasMinterRole = await bubbleSkinNFT.hasRole(MINTER_ROLE, deployer.address);
    
    console.log("DEFAULT_ADMIN_ROLE:", hasDefaultAdminRole);
    console.log("ADMIN_ROLE:", hasAdminRole);
    console.log("SKIN_MANAGER_ROLE:", hasSkinManagerRole);
    console.log("MINTER_ROLE:", hasMinterRole);

    // 如果没有SKIN_MANAGER_ROLE，则授予
    if (!hasSkinManagerRole) {
      console.log("\n🎯 授予 SKIN_MANAGER_ROLE...");
      const tx1 = await bubbleSkinNFT.grantRole(SKIN_MANAGER_ROLE, deployer.address);
      await tx1.wait();
      console.log("✅ SKIN_MANAGER_ROLE 授予成功");
    } else {
      console.log("✅ 已拥有 SKIN_MANAGER_ROLE");
    }

    // 如果没有MINTER_ROLE，则授予
    if (!hasMinterRole) {
      console.log("\n🎯 授予 MINTER_ROLE...");
      const tx2 = await bubbleSkinNFT.grantRole(MINTER_ROLE, deployer.address);
      await tx2.wait();
      console.log("✅ MINTER_ROLE 授予成功");
    } else {
      console.log("✅ 已拥有 MINTER_ROLE");
    }

    // 如果没有ADMIN_ROLE，则授予
    if (!hasAdminRole) {
      console.log("\n🎯 授予 ADMIN_ROLE...");
      const tx3 = await bubbleSkinNFT.grantRole(ADMIN_ROLE, deployer.address);
      await tx3.wait();
      console.log("✅ ADMIN_ROLE 授予成功");
    } else {
      console.log("✅ 已拥有 ADMIN_ROLE");
    }

    console.log("\n🎉 权限授予完成！");
    
    // 最终权限检查
    console.log("\n📋 最终权限状态:");
    console.log("DEFAULT_ADMIN_ROLE:", await bubbleSkinNFT.hasRole(DEFAULT_ADMIN_ROLE, deployer.address));
    console.log("ADMIN_ROLE:", await bubbleSkinNFT.hasRole(ADMIN_ROLE, deployer.address));
    console.log("SKIN_MANAGER_ROLE:", await bubbleSkinNFT.hasRole(SKIN_MANAGER_ROLE, deployer.address));
    console.log("MINTER_ROLE:", await bubbleSkinNFT.hasRole(MINTER_ROLE, deployer.address));

    // 测试合约函数
    console.log("\n🔍 测试合约函数...");
    try {
      const totalTemplates = await bubbleSkinNFT.getTotalTemplates();
      console.log("✅ getTotalTemplates:", totalTemplates.toString());
    } catch (error) {
      console.log("❌ getTotalTemplates 失败:", error.message);
    }

    try {
      const totalSupply = await bubbleSkinNFT.getTotalSupply();
      console.log("✅ getTotalSupply:", totalSupply.toString());
    } catch (error) {
      console.log("❌ getTotalSupply 失败:", error.message);
    }

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
