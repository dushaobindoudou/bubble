/**
 * Marketplace 合约调试工具
 * 用于测试和验证 Marketplace 合约调用
 */

import { createPublicClient, http } from 'viem'
import { CONTRACT_ADDRESSES } from '../config/contracts'
import MarketplaceABI from '../contracts/abis/Marketplace.json'

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
 * 测试 getActiveListings 函数
 */
export const testGetActiveListings = async () => {
  console.log('🔍 测试 getActiveListings...')
  
  try {
    console.log('合约地址:', CONTRACT_ADDRESSES.Marketplace)
    console.log('ABI 长度:', MarketplaceABI.abi.length)
    
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.Marketplace as `0x${string}`,
      abi: MarketplaceABI.abi,
      functionName: 'getActiveListings',
      args: [0, 10], // offset, limit
    })
    
    console.log('✅ getActiveListings 成功:', result)
    console.log('挂单数量:', Array.isArray(result) ? result.length : 0)
    
    if (Array.isArray(result) && result.length > 0) {
      console.log('第一个挂单:', result[0])
    }
    
    return {
      success: true,
      data: result,
      count: Array.isArray(result) ? result.length : 0
    }
  } catch (error) {
    console.error('❌ getActiveListings 失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 测试 getMarketStats 函数
 */
export const testGetMarketStats = async () => {
  console.log('📊 测试 getMarketStats...')
  
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.Marketplace as `0x${string}`,
      abi: MarketplaceABI.abi,
      functionName: 'getMarketStats',
    })
    
    console.log('✅ getMarketStats 成功:', result)
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('❌ getMarketStats 失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 测试 feePercentage 函数
 */
export const testGetFeePercentage = async () => {
  console.log('💰 测试 feePercentage...')
  
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.Marketplace as `0x${string}`,
      abi: MarketplaceABI.abi,
      functionName: 'feePercentage',
    })
    
    console.log('✅ feePercentage 成功:', result)
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('❌ feePercentage 失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 检查合约是否部署
 */
export const checkMarketplaceContract = async () => {
  console.log('🔍 检查 Marketplace 合约部署状态...')
  
  try {
    const bytecode = await publicClient.getBytecode({
      address: CONTRACT_ADDRESSES.Marketplace as `0x${string}`,
    })
    
    const isDeployed = !!bytecode && bytecode !== '0x'
    console.log('合约部署状态:', isDeployed ? '✅ 已部署' : '❌ 未部署')
    console.log('字节码长度:', bytecode?.length || 0)
    
    return {
      success: true,
      isDeployed,
      bytecodeLength: bytecode?.length || 0
    }
  } catch (error) {
    console.error('❌ 检查合约失败:', error)
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
    const chainId = await publicClient.getChainId()
    
    console.log('✅ 网络连接成功')
    console.log('当前区块:', blockNumber)
    console.log('链 ID:', chainId)
    
    return {
      success: true,
      blockNumber,
      chainId
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
 * 运行完整的 Marketplace 调试测试
 */
export const runMarketplaceDebugTests = async () => {
  console.log('🚀 开始运行 Marketplace 调试测试...')
  
  const results = {
    network: await testNetworkConnection(),
    contract: await checkMarketplaceContract(),
    activeListings: await testGetActiveListings(),
    marketStats: await testGetMarketStats(),
    feePercentage: await testGetFeePercentage(),
  }
  
  console.log('📋 测试结果汇总:', results)
  
  // 生成测试报告
  const report = {
    timestamp: new Date().toISOString(),
    network: {
      connected: results.network.success,
      blockNumber: results.network.blockNumber,
      chainId: results.network.chainId,
    },
    contract: {
      deployed: results.contract.isDeployed,
      address: CONTRACT_ADDRESSES.Marketplace,
    },
    functions: {
      getActiveListings: results.activeListings.success,
      getMarketStats: results.marketStats.success,
      feePercentage: results.feePercentage.success,
    },
    data: {
      activeListingsCount: results.activeListings.count || 0,
      marketStats: results.marketStats.data,
      feePercentage: results.feePercentage.data,
    },
    errors: [
      ...(results.network.success ? [] : [`网络: ${results.network.error}`]),
      ...(results.contract.success ? [] : [`合约: ${results.contract.error}`]),
      ...(results.activeListings.success ? [] : [`getActiveListings: ${results.activeListings.error}`]),
      ...(results.marketStats.success ? [] : [`getMarketStats: ${results.marketStats.error}`]),
      ...(results.feePercentage.success ? [] : [`feePercentage: ${results.feePercentage.error}`]),
    ]
  }
  
  console.log('📊 测试报告:', report)
  
  // 显示简化的结果
  if (report.errors.length === 0) {
    console.log('🎉 所有测试通过！')
    console.log(`📈 找到 ${report.data.activeListingsCount} 个活跃挂单`)
  } else {
    console.log('⚠️ 发现问题:')
    report.errors.forEach(error => console.log(`  • ${error}`))
  }
  
  return report
}

/**
 * 在浏览器控制台中暴露调试函数
 */
if (typeof window !== 'undefined') {
  (window as any).marketplaceDebug = {
    testActiveListings: testGetActiveListings,
    testMarketStats: testGetMarketStats,
    testFeePercentage: testGetFeePercentage,
    checkContract: checkMarketplaceContract,
    testNetwork: testNetworkConnection,
    runAllTests: runMarketplaceDebugTests,
  }
  
  console.log('🛠️ Marketplace 调试工具已加载到 window.marketplaceDebug')
  console.log('可用方法:', Object.keys((window as any).marketplaceDebug))
  console.log('运行完整测试: window.marketplaceDebug.runAllTests()')
}
