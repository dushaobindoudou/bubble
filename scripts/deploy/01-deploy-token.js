const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 开始部署 $BUB 代币合约...");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // 部署 BubbleToken 合约
  console.log("\n📜 部署 BubbleToken 合约...");
  const BubbleToken = await ethers.getContractFactory("BubbleToken");
  const bubbleToken = await BubbleToken.deploy();
  await bubbleToken.waitForDeployment();

  const tokenAddress = await bubbleToken.getAddress();
  console.log("✅ BubbleToken 合约部署成功!");
  console.log("合约地址:", tokenAddress);

  // 验证部署
  console.log("\n🔍 验证合约部署...");
  const name = await bubbleToken.name();
  const symbol = await bubbleToken.symbol();
  const totalSupply = await bubbleToken.totalSupply();

  console.log("代币名称:", name);
  console.log("代币符号:", symbol);
  console.log("总供应量:", ethers.formatEther(totalSupply));

  // 保存部署信息
  const deploymentInfo = {
    network: hre.network.name,
    contractName: "BubbleToken",
    contractAddress: tokenAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    transactionHash: bubbleToken.deploymentTransaction().hash,
  };

  console.log("\n📋 部署信息:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  return deploymentInfo;
}

// 如果直接运行此脚本则执行部署
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ 部署失败:", error);
      process.exit(1);
    });
}

module.exports = main;
