// Contract Address Validation Utility
import { CONTRACT_ADDRESSES, isContractDeployed } from '../config/contracts'

// Validate Ethereum address format
export const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Validate all contract addresses
export const validateContractAddresses = () => {
  const results: Record<string, { address: string; valid: boolean; deployed: boolean }> = {}
  
  Object.entries(CONTRACT_ADDRESSES).forEach(([name, address]) => {
    results[name] = {
      address,
      valid: isValidEthereumAddress(address),
      deployed: isContractDeployed(name as keyof typeof CONTRACT_ADDRESSES)
    }
  })
  
  return results
}

// Get contract validation summary
export const getContractValidationSummary = () => {
  const validation = validateContractAddresses()
  
  const summary = {
    total: Object.keys(validation).length,
    valid: 0,
    deployed: 0,
    invalid: [] as string[],
    notDeployed: [] as string[]
  }
  
  Object.entries(validation).forEach(([name, result]) => {
    if (result.valid) {
      summary.valid++
    } else {
      summary.invalid.push(name)
    }
    
    if (result.deployed) {
      summary.deployed++
    } else {
      summary.notDeployed.push(name)
    }
  })
  
  return { validation, summary }
}

// Check if address has changed from previous deployment
export const checkAddressChanges = (previousAddresses: Record<string, string>) => {
  const changes: Record<string, { old: string; new: string }> = {}
  
  Object.entries(CONTRACT_ADDRESSES).forEach(([name, newAddress]) => {
    const oldAddress = previousAddresses[name]
    if (oldAddress && oldAddress !== newAddress) {
      changes[name] = { old: oldAddress, new: newAddress }
    }
  })
  
  return changes
}

// Previous contract addresses for comparison
export const PREVIOUS_CONTRACT_ADDRESSES = {
  BubbleToken: '0xd323f3339396Cf6C1E31b8Ede701B34360eC4730',
  BubbleSkinNFT: '0x20F49671A6f9ca3733363a90dDabA2234D98F716',
  GameRewards: '0x0000000000000000000000000000000000000000',
  RandomGenerator: '0x0000000000000000000000000000000000000000',
  Marketplace: '0x0000000000000000000000000000000000000000',
  AccessControlManager: '0x0000000000000000000000000000000000000000',
}

// Detect what changed in this update
export const detectContractChanges = () => {
  return checkAddressChanges(PREVIOUS_CONTRACT_ADDRESSES)
}

// Format address for display (truncate middle)
export const formatAddress = (address: string): string => {
  if (!isValidEthereumAddress(address)) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Get Monad testnet explorer URL for address
export const getExplorerUrl = (address: string): string => {
  return `https://testnet.monadexplorer.com/address/${address}`
}

// Contract deployment status with details
export const getContractStatus = (contractName: keyof typeof CONTRACT_ADDRESSES) => {
  const address = CONTRACT_ADDRESSES[contractName]
  const isValid = isValidEthereumAddress(address)
  const isDeployed = isContractDeployed(contractName)
  
  return {
    name: contractName,
    address,
    isValid,
    isDeployed,
    explorerUrl: getExplorerUrl(address),
    formattedAddress: formatAddress(address),
    status: isDeployed ? 'deployed' : 'not-deployed'
  }
}

// Get all contract statuses
export const getAllContractStatuses = () => {
  return Object.keys(CONTRACT_ADDRESSES).map(name =>
    getContractStatus(name as keyof typeof CONTRACT_ADDRESSES)
  )
}

// Contract descriptions and functionality
export const CONTRACT_DESCRIPTIONS = {
  BubbleToken: {
    name: 'Bubble Token (BUB)',
    description: '游戏内主要代币，用于购买道具、皮肤和参与游戏经济',
    functions: ['代币转账', '余额查询', '游戏奖励铸造', '代币销毁'],
    category: 'Core',
    icon: '🪙',
    color: 'blue'
  },
  BubbleSkinNFT: {
    name: 'Bubble Skin NFT',
    description: '游戏皮肤 NFT 合约，管理所有可收集的泡泡皮肤',
    functions: ['NFT 铸造', '皮肤模板管理', '元数据查询', '所有权转移'],
    category: 'Core',
    icon: '🎨',
    color: 'purple'
  },
  GameRewards: {
    name: 'Game Rewards',
    description: '游戏奖励系统，处理玩家游戏会话验证和奖励分发',
    functions: ['会话验证', '奖励计算', '奖励领取', '防重放保护'],
    category: 'Game',
    icon: '🏆',
    color: 'yellow'
  },
  RandomGenerator: {
    name: 'Random Generator',
    description: '链上随机数生成器，为游戏提供可验证的随机性',
    functions: ['随机数生成', '种子管理', '随机性验证', '游戏集成'],
    category: 'Utility',
    icon: '🎲',
    color: 'green'
  },
  Marketplace: {
    name: 'NFT Marketplace',
    description: 'NFT 交易市场，支持皮肤和道具的买卖交易',
    functions: ['NFT 上架', '购买交易', '手续费管理', '交易历史'],
    category: 'Economy',
    icon: '🛒',
    color: 'orange'
  },
  AccessControlManager: {
    name: 'Access Control Manager',
    description: '权限管理系统，统一管理所有合约的访问控制',
    functions: ['角色管理', '权限分配', '访问控制', '安全审计'],
    category: 'Security',
    icon: '🔐',
    color: 'red'
  }
} as const

// Get contract description
export const getContractDescription = (contractName: keyof typeof CONTRACT_ADDRESSES) => {
  return CONTRACT_DESCRIPTIONS[contractName]
}

// Get contracts by category
export const getContractsByCategory = () => {
  const categories: Record<string, any[]> = {}

  Object.entries(CONTRACT_DESCRIPTIONS).forEach(([name, desc]) => {
    if (!categories[desc.category]) {
      categories[desc.category] = []
    }
    categories[desc.category].push({
      name,
      ...desc,
      ...getContractStatus(name as keyof typeof CONTRACT_ADDRESSES)
    })
  })

  return categories
}
