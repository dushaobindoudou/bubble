import { configureChains, createConfig } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import {
  connectorsForWallets,
} from '@rainbow-me/rainbowkit'
import {
  // Popular Wallets
  injectedWallet,
  rainbowWallet,
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,

  // Mobile Wallets
  trustWallet,
  argentWallet,
  imTokenWallet,
  zerionWallet,
  uniswapWallet,

  // Browser Extension Wallets
  braveWallet,
  phantomWallet,
  frameWallet,
  talismanWallet,
  rabbyWallet,
  enkryptWallet,

  // Hardware Wallets
  ledgerWallet,

  // DeFi & Specialized Wallets
  safeWallet,
  xdefiWallet,
  // oneInchWallet,

  // Additional Popular Wallets
  okxWallet,
  coin98Wallet,
  bitgetWallet,
  tokenPocketWallet,
  foxWallet,
  frontierWallet,
  coreWallet,
  mewWallet,
  tahoWallet,
  omniWallet,
  bifrostWallet,
  bitskiWallet,
  // bloomWallet,
  dawnWallet,
} from '@rainbow-me/rainbowkit/wallets'
import type { Chain } from 'wagmi'

// Define Monad Testnet
export const monadTestnet: Chain = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    public: { http: ['https://testnet-rpc.monad.xyz'] },
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { 
      name: 'Monad Explorer', 
      url: 'https://testnet.monadexplorer.com' 
    },
  },
  testnet: true,
}

// Configure chains and providers
export const { chains, publicClient, webSocketPublicClient } = configureChains(
  [monadTestnet],
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: chain.rpcUrls.default.http[0],
      }),
    }),
    publicProvider(),
  ]
)

// Get project ID for WalletConnect
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'bubble-brawl-web3-game'

// Configure comprehensive EVM wallet list with verified wallets
const connectors = connectorsForWallets([
  {
    groupName: '热门推荐',
    wallets: [
      metaMaskWallet({ projectId, chains }),
      rainbowWallet({ projectId, chains }),
      coinbaseWallet({ appName: 'Bubble Brawl', chains }),
      walletConnectWallet({ projectId, chains }),
      trustWallet({ projectId, chains }),
      phantomWallet({ chains }),
    ],
  },
  {
    groupName: '移动端钱包',
    wallets: [
      trustWallet({ projectId, chains }),
      imTokenWallet({ projectId, chains }),
      argentWallet({ projectId, chains }),
      zerionWallet({ projectId, chains }),
      uniswapWallet({ projectId, chains }),
      tokenPocketWallet({ projectId, chains }),
      okxWallet({ projectId, chains }),
      coin98Wallet({ projectId, chains }),
      bitgetWallet({ projectId, chains }),
    ],
  },
  {
    groupName: '浏览器扩展',
    wallets: [
      injectedWallet({ chains }),
      braveWallet({ chains }),
      phantomWallet({ chains }),
      frameWallet({ chains }),
      talismanWallet({ chains }),
      rabbyWallet({ chains }),
      enkryptWallet({ chains }),
      foxWallet({ projectId, chains }),
      frontierWallet({ projectId, chains }),
      mewWallet({ chains }),
    ],
  },
  {
    groupName: '硬件钱包',
    wallets: [
      ledgerWallet({ projectId, chains }),
    ],
  },
  {
    groupName: 'DeFi 专用',
    wallets: [
      safeWallet({ chains }),
      xdefiWallet({ chains }),
      // oneInchWallet({ projectId, chains }),
      tahoWallet({ chains }),
      omniWallet({ projectId, chains }),
    ],
  },
  {
    groupName: '其他钱包',
    wallets: [
      coreWallet({ projectId, chains }),
      bifrostWallet({ projectId, chains }),
      bitskiWallet({ chains }),
      // bloomWallet({ projectId, chains }),
      dawnWallet({ chains }),
    ],
  },
])

// Create wagmi config
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

// Export chain information for use in components
export const SUPPORTED_CHAINS = {
  MONAD_TESTNET: monadTestnet,
}

export const DEFAULT_CHAIN = monadTestnet

// Contract addresses on Monad Testnet
export const CONTRACT_ADDRESSES = {
  BubbleToken: import.meta.env.VITE_BUBBLE_TOKEN_ADDRESS || '0xd323f3339396Cf6C1E31b8Ede701B34360eC4730',
  BubbleSkinNFT: import.meta.env.VITE_BUBBLE_SKIN_NFT_ADDRESS || '0x20F49671A6f9ca3733363a90dDabA2234D98F716',
  GameRewards: import.meta.env.VITE_GAME_REWARDS_ADDRESS || '0x0000000000000000000000000000000000000000',
  Marketplace: import.meta.env.VITE_MARKETPLACE_ADDRESS || '0x0000000000000000000000000000000000000000',
  RandomGenerator: import.meta.env.VITE_RANDOM_GENERATOR_ADDRESS || '0x0000000000000000000000000000000000000000',
  AccessControlManager: import.meta.env.VITE_ACCESS_CONTROL_MANAGER_ADDRESS || '0x0000000000000000000000000000000000000000',
}

// Gas settings optimized for Monad
export const GAS_SETTINGS = {
  gasLimit: 500000,
  maxFeePerGas: '20000000000', // 20 gwei
  maxPriorityFeePerGas: '2000000000', // 2 gwei
}

// Network switching helper
export const isCorrectNetwork = (chainId: number): boolean => {
  return chainId === monadTestnet.id
}

// Get network name by chain ID
export const getNetworkName = (chainId: number): string => {
  switch (chainId) {
    case monadTestnet.id:
      return monadTestnet.name
    case 1:
      return 'Ethereum Mainnet'
    case 5:
      return 'Goerli Testnet'
    case 11155111:
      return 'Sepolia Testnet'
    case 137:
      return 'Polygon Mainnet'
    case 80001:
      return 'Polygon Mumbai'
    case 56:
      return 'BSC Mainnet'
    case 97:
      return 'BSC Testnet'
    case 43114:
      return 'Avalanche Mainnet'
    case 43113:
      return 'Avalanche Fuji'
    case 250:
      return 'Fantom Mainnet'
    case 4002:
      return 'Fantom Testnet'
    case 42161:
      return 'Arbitrum One'
    case 421613:
      return 'Arbitrum Goerli'
    case 10:
      return 'Optimism Mainnet'
    case 420:
      return 'Optimism Goerli'
    default:
      return `Unknown Network (${chainId})`
  }
}

// Network switching utilities
export const switchToMonadTestnet = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('No wallet detected')
  }

  try {
    // Try to switch to Monad Testnet
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${monadTestnet.id.toString(16)}` }],
    })
  } catch (switchError: any) {
    // If the network doesn't exist, add it
    if (switchError.code === 4902) {
      await addMonadTestnetToWallet()
    } else {
      throw switchError
    }
  }
}

export const addMonadTestnetToWallet = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('No wallet detected')
  }

  const networkParams = {
    chainId: `0x${monadTestnet.id.toString(16)}`,
    chainName: monadTestnet.name,
    nativeCurrency: monadTestnet.nativeCurrency,
    rpcUrls: [monadTestnet.rpcUrls.default.http[0]],
    blockExplorerUrls: monadTestnet.blockExplorers ? [monadTestnet.blockExplorers.default.url] : [],
  }

  await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [networkParams],
  })
}

// Check if wallet supports network switching
export const supportsNetworkSwitching = (): boolean => {
  return typeof window.ethereum !== 'undefined' &&
         typeof window.ethereum.request === 'function'
}

// Get user-friendly error messages for network issues
export const getNetworkErrorMessage = (chainId: number): string => {
  if (chainId === monadTestnet.id) {
    return ''
  }

  const networkName = getNetworkName(chainId)
  return `您当前连接到 ${networkName}。请切换到 Monad 测试网以使用 Bubble Brawl。`
}

// Validate if a chain ID is supported
export const isSupportedChain = (chainId: number): boolean => {
  return chainId === monadTestnet.id
}

// Get chain configuration by ID
export const getChainById = (chainId: number): Chain | undefined => {
  return chains.find(chain => chain.id === chainId)
}
