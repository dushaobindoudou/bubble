const { ethers } = require("hardhat");

async function main() {
  console.log("🔗 测试网络连接...");

  try {
    // 获取网络信息
    const network = await ethers.provider.getNetwork();
    console.log("网络信息:", {
      name: network.name,
      chainId: network.chainId.toString(),
    });

    // 获取最新区块
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("最新区块:", blockNumber);

    // 获取签名者
    const [signer] = await ethers.getSigners();
    console.log("签名者地址:", signer.address);

    // 获取余额
    const balance = await ethers.provider.getBalance(signer.address);
    console.log("余额:", ethers.formatEther(balance), "ETH");

    console.log("✅ 网络连接正常");

  } catch (error) {
    console.error("❌ 网络连接失败:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
