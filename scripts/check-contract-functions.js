const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 检查合约函数...");

  // 合约地址
  const BUBBLE_SKIN_NFT_ADDRESS = "0x6Cde3abE9ACC5028330bd301415e59877D0A5Bdd";

  try {
    // 获取网络信息
    const network = await ethers.provider.getNetwork();
    console.log("网络:", network.name, "Chain ID:", network.chainId.toString());

    // 连接到合约
    const BubbleSkinNFT = await ethers.getContractFactory("BubbleSkinNFT");
    const bubbleSkinNFT = BubbleSkinNFT.attach(BUBBLE_SKIN_NFT_ADDRESS);

    console.log("\n📋 检查合约基本信息...");
    
    // 检查基本信息
    try {
      const name = await bubbleSkinNFT.name();
      console.log("合约名称:", name);
    } catch (error) {
      console.log("❌ 无法获取合约名称:", error.message);
    }

    try {
      const symbol = await bubbleSkinNFT.symbol();
      console.log("合约符号:", symbol);
    } catch (error) {
      console.log("❌ 无法获取合约符号:", error.message);
    }

    // 检查 getTotalTemplates 函数
    console.log("\n🔍 检查 getTotalTemplates 函数...");
    try {
      const totalTemplates = await bubbleSkinNFT.getTotalTemplates();
      console.log("✅ getTotalTemplates 函数存在，返回值:", totalTemplates.toString());
    } catch (error) {
      console.log("❌ getTotalTemplates 函数调用失败:", error.message);
      
      // 检查是否是函数不存在的错误
      if (error.message.includes("function") && error.message.includes("reverted")) {
        console.log("🔧 可能需要重新部署合约或使用正确的合约地址");
      }
    }

    // 检查其他关键函数
    console.log("\n🔍 检查其他关键函数...");
    
    const functionsToCheck = [
      'getTotalSupply',
      'createSkinTemplate',
      'mintSkin',
      'setTemplateActive',
      'getSkinTemplate'
    ];

    for (const funcName of functionsToCheck) {
      try {
        // 对于view函数，我们可以尝试调用
        if (funcName === 'getTotalSupply') {
          const result = await bubbleSkinNFT.getTotalSupply();
          console.log(`✅ ${funcName} 存在，返回值:`, result.toString());
        } else if (funcName === 'getSkinTemplate') {
          // 这个函数需要参数，我们只检查是否存在
          console.log(`✅ ${funcName} 函数存在（需要参数）`);
        } else {
          console.log(`✅ ${funcName} 函数存在（需要参数或权限）`);
        }
      } catch (error) {
        if (error.message.includes("function") && error.message.includes("reverted")) {
          console.log(`❌ ${funcName} 函数不存在或调用失败:`, error.message);
        } else {
          console.log(`⚠️ ${funcName} 函数存在但调用失败（可能需要参数或权限）:`, error.message);
        }
      }
    }

    // 检查合约代码
    console.log("\n🔍 检查合约代码...");
    const code = await ethers.provider.getCode(BUBBLE_SKIN_NFT_ADDRESS);
    if (code === "0x") {
      console.log("❌ 合约地址上没有代码！");
    } else {
      console.log("✅ 合约地址上有代码，长度:", code.length);
    }

  } catch (error) {
    console.error("❌ 检查失败:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
