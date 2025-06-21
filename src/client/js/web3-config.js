/**
 * Web3 Configuration for Bubble Brawl
 * Handles network configuration and contract addresses
 */

// Monad Testnet Configuration
const MONAD_TESTNET = {
    chainId: '0x279F', // 10143 in hex
    chainName: 'Monad Testnet',
    nativeCurrency: {
        name: 'MON',
        symbol: 'MON',
        decimals: 18
    },
    rpcUrls: ['https://testnet-rpc.monad.xyz'],
    blockExplorerUrls: ['https://testnet.monadexplorer.com']
};

// Contract Addresses (will be populated from deployment)
const CONTRACT_ADDRESSES = {
    BubbleToken: '',
    BubbleSkinNFT: '',
    GameRewards: '',
    Marketplace: '',
    RandomGenerator: '',
    AccessControlManager: ''
};

// Contract ABIs (simplified for client use)
const CONTRACT_ABIS = {
    BubbleToken: [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function hasGameRewardRole(address account) view returns (bool)",
        "function getGameRewardRoleMembers() view returns (address[])",
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event Approval(address indexed owner, address indexed spender, uint256 value)"
    ],
    BubbleSkinNFT: [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function balanceOf(address owner) view returns (uint256)",
        "function ownerOf(uint256 tokenId) view returns (address)",
        "function tokenURI(uint256 tokenId) view returns (string)",
        "function approve(address to, uint256 tokenId)",
        "function getApproved(uint256 tokenId) view returns (address)",
        "function setApprovalForAll(address operator, bool approved)",
        "function isApprovedForAll(address owner, address operator) view returns (bool)",
        "function transferFrom(address from, address to, uint256 tokenId)",
        "function safeTransferFrom(address from, address to, uint256 tokenId)",
        "function getUserSkins(address user) view returns (uint256[])",
        "function getSkinTemplate(uint256 templateId) view returns (tuple(string name, string description, uint8 rarity, uint8 effectType, tuple(string primaryColor, string secondaryColor, string accentColor, uint8 transparency) colorConfig, string content, uint256 maxSupply, uint256 currentSupply, bool active))",
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
        "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
        "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)"
    ],
    GameRewards: [
        "function claimReward(bytes32 sessionId) returns (bool)",
        "function getPlayerRewards(address player) view returns (tuple(uint256 totalRewards, uint256 totalTokens, uint256 totalNFTs, uint256 lastClaimTime))",
        "function getUnclaimedRewards(address player) view returns (uint256)",
        "function isSessionClaimed(bytes32 sessionId) view returns (bool)",
        "event RewardClaimed(address indexed player, uint256 tokenAmount, uint256 nftCount, bytes32 sessionId)"
    ],
    Marketplace: [
        "function listNFT(address nftContract, uint256 tokenId, uint256 price) returns (uint256)",
        "function buyNFT(uint256 listingId) payable returns (bool)",
        "function cancelListing(uint256 listingId) returns (bool)",
        "function getListing(uint256 listingId) view returns (tuple(address seller, address nftContract, uint256 tokenId, uint256 price, bool active))",
        "function getActiveListings() view returns (uint256[])",
        "event NFTListed(uint256 indexed listingId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 price)",
        "event NFTSold(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 price)",
        "event ListingCancelled(uint256 indexed listingId)"
    ]
};

// Supported Wallets Configuration
const SUPPORTED_WALLETS = {
    metamask: {
        name: 'MetaMask',
        icon: '🦊',
        downloadUrl: 'https://metamask.io/download/',
        deepLink: null
    },
    walletconnect: {
        name: 'WalletConnect',
        icon: '🔗',
        downloadUrl: 'https://walletconnect.com/',
        deepLink: null
    },
    coinbase: {
        name: 'Coinbase Wallet',
        icon: '🔵',
        downloadUrl: 'https://www.coinbase.com/wallet',
        deepLink: 'https://go.cb-w.com/dapp'
    }
};

// Error Messages
const ERROR_MESSAGES = {
    WALLET_NOT_FOUND: '未检测到钱包，请安装 MetaMask 或其他支持的钱包',
    NETWORK_SWITCH_FAILED: '切换到 Monad 测试网失败',
    CONNECTION_REJECTED: '用户拒绝连接钱包',
    INSUFFICIENT_BALANCE: 'MON 代币余额不足以支付 Gas 费用',
    TRANSACTION_FAILED: '交易失败，请重试',
    SIGNATURE_FAILED: '签名失败，请重试',
    CONTRACT_INTERACTION_FAILED: '合约交互失败'
};

// Success Messages
const SUCCESS_MESSAGES = {
    WALLET_CONNECTED: '钱包连接成功！',
    NETWORK_SWITCHED: '已切换到 Monad 测试网',
    TRANSACTION_SUCCESS: '交易成功！',
    LOGOUT_SUCCESS: '已安全退出登录'
};

// Minimum MON balance required for gas fees (0.01 MON)
const MIN_MON_BALANCE = '10000000000000000'; // 0.01 MON in wei

// Gas settings for Monad Testnet
const GAS_SETTINGS = {
    gasLimit: 300000,
    maxFeePerGas: '50000000000', // 50 Gwei
    maxPriorityFeePerGas: '2000000000' // 2 Gwei
};

// Local storage keys
const STORAGE_KEYS = {
    WALLET_ADDRESS: 'bubble_brawl_wallet_address',
    WALLET_TYPE: 'bubble_brawl_wallet_type',
    AUTH_TOKEN: 'bubble_brawl_auth_token',
    USER_PREFERENCES: 'bubble_brawl_user_preferences',
    LAST_LOGIN: 'bubble_brawl_last_login'
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MONAD_TESTNET,
        CONTRACT_ADDRESSES,
        CONTRACT_ABIS,
        SUPPORTED_WALLETS,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
        MIN_MON_BALANCE,
        GAS_SETTINGS,
        STORAGE_KEYS
    };
} else {
    // Browser environment
    window.Web3Config = {
        MONAD_TESTNET,
        CONTRACT_ADDRESSES,
        CONTRACT_ABIS,
        SUPPORTED_WALLETS,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
        MIN_MON_BALANCE,
        GAS_SETTINGS,
        STORAGE_KEYS
    };
}
