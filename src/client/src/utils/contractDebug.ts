/**
 * 合约调试工具
 * 用于测试和验证合约调用
 */

import { createPublicClient, http } from 'viem'
import { CONTRACT_ADDRESSES } from '../config/contracts'
import MarketplaceABI from '../contracts/abis/Marketplace.json'
import BubbleSkinNFTABI from '../contracts/abis/BubbleSkinNFT.json'

// Monad 测试网配置
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
}

// 创建公共客户端
const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
})

/**
 * 测试 Marketplace 合约调用
 */
export const testMarketplaceContract = async () => {
  console.log('🔍 测试 Marketplace 合约调用...')
  
  try {
    // 测试获取活跃挂单
    console.log('📋 测试 getActiveListings...')
    const activeListings = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.Marketplace as `0x${string}`,
      abi: MarketplaceABI.abi,
      functionName: 'getActiveListings',
      args: [0, 10], // offset, limit
    })
    console.log('✅ getActiveListings 成功:', activeListings)

    // 测试获取市场统计
    console.log('📊 测试 getMarketStats...')
    const marketStats = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.Marketplace as `0x${string}`,
      abi: MarketplaceABI.abi,
      functionName: 'getMarketStats',
    })
    console.log('✅ getMarketStats 成功:', marketStats)

    // 测试获取手续费比例
    console.log('💰 测试 feePercentage...')
    const feePercentage = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.Marketplace as `0x${string}`,
      abi: MarketplaceABI.abi,
      functionName: 'feePercentage',
    })
    console.log('✅ feePercentage 成功:', feePercentage)

    return {
      success: true,
      data: {
        activeListings,
        marketStats,
        feePercentage,
      }
    }
  } catch (error) {
    console.error('❌ Marketplace 合约调用失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 测试 BubbleSkinNFT 合约调用
 */
export const testBubbleSkinNFTContract = async (tokenId: number = 1) => {
  console.log('🔍 测试 BubbleSkinNFT 合约调用...')
  
  try {
    // 测试获取皮肤模板
    console.log(`🎨 测试 getSkinTemplate (tokenId: ${tokenId})...`)
    const skinTemplate = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.BubbleSkinNFT as `0x${string}`,
      abi: BubbleSkinNFTABI,
      functionName: 'getSkinTemplate',
      args: [tokenId],
    })
    console.log('✅ getSkinTemplate 成功:', skinTemplate)

    // 测试获取总模板数
    console.log('📊 测试 getTotalTemplates...')
    const totalTemplates = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.BubbleSkinNFT as `0x${string}`,
      abi: BubbleSkinNFTABI,
      functionName: 'getTotalTemplates',
    })
    console.log('✅ getTotalTemplates 成功:', totalTemplates)

    return {
      success: true,
      data: {
        skinTemplate,
        totalTemplates,
      }
    }
  } catch (error) {
    console.error('❌ BubbleSkinNFT 合约调用失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 测试网络连接
 */
export const testNetworkConnection = async () => {
  console.log('🌐 测试网络连接...')
  
  try {
    const blockNumber = await publicClient.getBlockNumber()
    console.log('✅ 网络连接成功，当前区块:', blockNumber)
    
    const chainId = await publicClient.getChainId()
    console.log('✅ 链 ID:', chainId)
    
    return {
      success: true,
      data: {
        blockNumber,
        chainId,
      }
    }
  } catch (error) {
    console.error('❌ 网络连接失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 验证合约地址
 */
export const validateContractAddresses = async () => {
  console.log('🔍 验证合约地址...')
  
  const results = {
    Marketplace: { address: CONTRACT_ADDRESSES.Marketplace, valid: false },
    BubbleSkinNFT: { address: CONTRACT_ADDRESSES.BubbleSkinNFT, valid: false },
    BubbleToken: { address: CONTRACT_ADDRESSES.BubbleToken, valid: false },
  }
  
  try {
    // 检查 Marketplace 合约
    const marketplaceCode = await publicClient.getBytecode({
      address: CONTRACT_ADDRESSES.Marketplace as `0x${string}`,
    })
    results.Marketplace.valid = !!marketplaceCode && marketplaceCode !== '0x'
    
    // 检查 BubbleSkinNFT 合约
    const nftCode = await publicClient.getBytecode({
      address: CONTRACT_ADDRESSES.BubbleSkinNFT as `0x${string}`,
    })
    results.BubbleSkinNFT.valid = !!nftCode && nftCode !== '0x'
    
    // 检查 BubbleToken 合约
    const tokenCode = await publicClient.getBytecode({
      address: CONTRACT_ADDRESSES.BubbleToken as `0x${string}`,
    })
    results.BubbleToken.valid = !!tokenCode && tokenCode !== '0x'
    
    console.log('✅ 合约地址验证结果:', results)
    return results
  } catch (error) {
    console.error('❌ 合约地址验证失败:', error)
    return results
  }
}

/**
 * 运行完整的合约调试测试
 */
export const runContractDebugTests = async () => {
  console.log('🚀 开始运行合约调试测试...')
  
  const results = {
    network: await testNetworkConnection(),
    contracts: await validateContractAddresses(),
    marketplace: await testMarketplaceContract(),
    nft: await testBubbleSkinNFTContract(),
  }
  
  console.log('📋 测试结果汇总:', results)
  
  // 生成测试报告
  const report = {
    timestamp: new Date().toISOString(),
    network: {
      connected: results.network.success,
      blockNumber: results.network.data?.blockNumber,
      chainId: results.network.data?.chainId,
    },
    contracts: {
      marketplace: results.contracts.Marketplace.valid,
      nft: results.contracts.BubbleSkinNFT.valid,
      token: results.contracts.BubbleToken.valid,
    },
    functionality: {
      marketplaceRead: results.marketplace.success,
      nftRead: results.nft.success,
    },
    errors: [
      ...(results.network.success ? [] : [`网络: ${results.network.error}`]),
      ...(results.marketplace.success ? [] : [`Marketplace: ${results.marketplace.error}`]),
      ...(results.nft.success ? [] : [`NFT: ${results.nft.error}`]),
    ]
  }
  
  console.log('📊 测试报告:', report)
  return report
}

/**
 * 在浏览器控制台中暴露调试函数
 */
if (typeof window !== 'undefined') {
  (window as any).contractDebug = {
    testMarketplace: testMarketplaceContract,
    testNFT: testBubbleSkinNFTContract,
    testNetwork: testNetworkConnection,
    validateAddresses: validateContractAddresses,
    runAllTests: runContractDebugTests,
  }
  
  console.log('🛠️ 合约调试工具已加载到 window.contractDebug')
  console.log('可用方法:', Object.keys((window as any).contractDebug))
}
