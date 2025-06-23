// Smart Contract Configuration for Monad Testnet
export const MONAD_TESTNET_CHAIN_ID = 10143

// 📋 部署摘要:
// ============================================================
// 网络: monadTestnet (Chain ID: 10143)
// 部署者: 0x20F49671A6f9ca3733363a90dDabA2234D98F716
// 时间: 2025-06-22T06:23:50.342Z
// ------------------------------------------------------------
// RandomGenerator     : 0xD6F375Fb0AF6e578faD82D2196A7ea7C540F510d
// AccessControlManager: 0x1D6eFa9E902dEB94BF77Df6341fA9A12e20806Eb
// BubbleToken         : 0x2b775cbd54080ED6f118EA57fEADd4b4A5590537
// BubbleSkinNFT       : 0xEdD8e930A6dfe5f0Df35651a5dB8273D0C1a5221
// GameRewards         : 0x97B3f1cA8605dDBa9fBC12C4bCB4f238293DBC8D
// Marketplace         : 0xF7989Ed95b49123a1D73AD6da8A03C1011c3d416
// ============================================================

// Deployed Contract Addresses on Monad Testnet
export const CONTRACT_ADDRESSES = {
  BubbleToken: '0x2b775cbd54080ED6f118EA57fEADd4b4A5590537',
  BubbleSkinNFT: '0xEdD8e930A6dfe5f0Df35651a5dB8273D0C1a5221',
  GameRewards: '0x97B3f1cA8605dDBa9fBC12C4bCB4f238293DBC8D',
  RandomGenerator: '0xD6F375Fb0AF6e578faD82D2196A7ea7C540F510d',
  Marketplace: '0xF7989Ed95b49123a1D73AD6da8A03C1011c3d416',
  AccessControlManager: '0x1D6eFa9E902dEB94BF77Df6341fA9A12e20806Eb',
} as const

// Contract ABIs
export { default as BubbleTokenABI } from '../contracts/abis/BubbleToken.json'
export { default as BubbleSkinNFTABI } from '../contracts/abis/BubbleSkinNFT.json'
export { default as AccessControlManagerABI } from '../contracts/abis/AccessControlManager.json'
export { default as GameRewardsABI } from '../contracts/abis/GameRewards.json'
// TODO: Add Marketplace and RandomGenerator ABIs when available
// export { default as MarketplaceABI } from '../contracts/abis/Marketplace.json'
// export { default as RandomGeneratorABI } from '../contracts/abis/RandomGenerator.json'

// Type definitions for contract addresses
export type ContractName = keyof typeof CONTRACT_ADDRESSES
export type ContractAddress = typeof CONTRACT_ADDRESSES[ContractName]

// Helper function to get contract address
export const getContractAddress = (contractName: ContractName): `0x${string}` => {
  const address = CONTRACT_ADDRESSES[contractName]
  if (address === '0x0000000000000000000000000000000000000000') {
    console.warn(`Contract ${contractName} is not deployed yet`)
  }
  return address as `0x${string}`
}

// Network configuration
export const MONAD_TESTNET_CONFIG = {
  chainId: MONAD_TESTNET_CHAIN_ID,
  name: 'Monad Testnet',
  currency: 'MON',
  rpcUrl: 'https://testnet-rpc.monad.xyz',
  blockExplorer: 'https://testnet.monadexplorer.com',
}

// Contract deployment verification
export const isContractDeployed = (contractName: ContractName): boolean => {
  return CONTRACT_ADDRESSES[contractName] !== '0x0000000000000000000000000000000000000000'
}

// Get all deployed contracts
export const getDeployedContracts = (): Partial<typeof CONTRACT_ADDRESSES> => {
  return Object.fromEntries(
    Object.entries(CONTRACT_ADDRESSES).filter(([_, address]) => 
      address !== '0x0000000000000000000000000000000000000000'
    )
  )
}

// Environment-based contract addresses (for different environments)
export const getContractAddressForEnv = (
  contractName: ContractName,
  environment: 'development' | 'staging' | 'production' = 'development'
): `0x${string}` => {
  // For now, we only have testnet addresses
  // In the future, this could switch between different networks
  return getContractAddress(contractName)
}
