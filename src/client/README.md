# 🫧 Bubble Brawl Web3 Authentication System

## 📋 Overview

This directory contains the comprehensive Web3 authentication system for Bubble Brawl, providing seamless integration between traditional gaming and blockchain technology. The system supports wallet-based authentication, smart contract integration, and social login fallbacks.

## 🏗️ Architecture

### Core Components

1. **Web3 Configuration** (`js/web3-config.js`)
   - Network settings for Monad Testnet
   - Contract addresses and ABIs
   - Error messages and constants

2. **Authentication Manager** (`js/web3-auth.js`)
   - Wallet connection and management
   - Signature-based authentication
   - Network switching and validation

3. **Authentication UI** (`js/auth-ui.js`)
   - Modern, responsive login interface
   - Multi-step authentication flow
   - Error handling and user feedback

4. **Game Integration** (`js/web3-integration.js`)
   - Seamless integration with existing game
   - Web3 features and smart contract interaction
   - Session management and logout

5. **Styling** (`css/auth.css`)
   - Modern bubble-themed design
   - Mobile-responsive layout
   - Smooth animations and transitions

## 🚀 Features

### Web3 Wallet Authentication
- **MetaMask Integration**: Primary wallet support
- **WalletConnect**: Mobile wallet connectivity
- **Coinbase Wallet**: Additional wallet option
- **Automatic Network Switching**: Monad Testnet configuration
- **Signature Authentication**: Secure user verification

### Smart Contract Integration
- **BubbleToken (BUB)**: Game token balance display
- **BubbleSkinNFT**: NFT skin management
- **GameRewards**: Reward claiming functionality
- **Marketplace**: NFT trading integration

### User Experience
- **Auto-Login**: Persistent sessions (24-hour validity)
- **Real-time Balance**: MON, BUB, and NFT balances
- **Network Status**: Current network indicator
- **Error Handling**: Comprehensive error messages
- **Mobile Support**: Responsive design for all devices

### Security Features
- **Signature Verification**: Message signing for authentication
- **Session Management**: Secure token storage
- **Network Validation**: Monad Testnet enforcement
- **No Private Key Storage**: Client-side security best practices

## 🛠️ Setup and Configuration

### 1. Contract Deployment
First, deploy the smart contracts to Monad Testnet:

```bash
# Deploy contracts
npm run deploy:monad

# Update client contract addresses
node scripts/update-client-contracts.js
```

### 2. Environment Configuration
The system automatically configures for Monad Testnet:

- **Chain ID**: 10143
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Currency**: MON
- **Explorer**: https://testnet.monadexplorer.com

### 3. Client Integration
The authentication system is automatically integrated when the page loads:

```html
<!-- Required scripts in index.html -->
<script src="//cdn.ethers.io/lib/ethers-5.7.2.umd.min.js"></script>
<script src="js/web3-config.js"></script>
<script src="js/web3-auth.js"></script>
<script src="js/auth-ui.js"></script>
<script src="js/web3-integration.js"></script>
```

## 🎮 Usage

### For Players

1. **Connect Wallet**
   - Click "🔗 Web3 登录" button
   - Select your preferred wallet
   - Approve connection in wallet
   - Sign authentication message

2. **Network Setup**
   - System automatically prompts to switch to Monad Testnet
   - Approve network addition/switch in wallet
   - Verify network status indicator

3. **Start Playing**
   - Click "🚀 开始游戏" after successful authentication
   - Your wallet address becomes your player identifier
   - Access Web3 features during gameplay

4. **Manage Assets**
   - View MON, BUB, and NFT balances
   - Claim game rewards (when available)
   - Trade NFTs in marketplace (when available)

### For Developers

#### Initialize Web3 Authentication
```javascript
// Authentication is auto-initialized
const authStatus = window.bubbleBrawlWeb3.getAuthStatus();
console.log('Auth Status:', authStatus);
```

#### Listen to Authentication Events
```javascript
const web3Auth = window.bubbleBrawlWeb3.web3Auth;

web3Auth.on('connected', (data) => {
    console.log('Wallet connected:', data);
});

web3Auth.on('disconnected', () => {
    console.log('Wallet disconnected');
});
```

#### Access Smart Contracts
```javascript
const contracts = web3Auth.contracts;

// Check BUB token balance
const balance = await contracts.BubbleToken.balanceOf(userAddress);

// Get user's NFTs
const nfts = await contracts.BubbleSkinNFT.getUserSkins(userAddress);
```

## 🔧 Configuration

### Contract Addresses
Contract addresses are automatically loaded from `contracts/deployment.json`:

```json
{
  "contracts": {
    "BubbleToken": "0x...",
    "BubbleSkinNFT": "0x...",
    "GameRewards": "0x...",
    "Marketplace": "0x..."
  }
}
```

### Network Settings
Monad Testnet configuration in `js/web3-config.js`:

```javascript
const MONAD_TESTNET = {
    chainId: '0x279F', // 10143
    chainName: 'Monad Testnet',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: ['https://testnet-rpc.monad.xyz'],
    blockExplorerUrls: ['https://testnet.monadexplorer.com']
};
```

## 🎨 Customization

### Styling
Modify `css/auth.css` to customize the authentication interface:

- **Colors**: Update gradient backgrounds and accent colors
- **Layout**: Adjust modal sizing and positioning
- **Animations**: Customize transitions and effects
- **Mobile**: Responsive breakpoints and mobile-specific styles

### Messages
Update user-facing messages in `js/web3-config.js`:

```javascript
const ERROR_MESSAGES = {
    WALLET_NOT_FOUND: '未检测到钱包，请安装 MetaMask 或其他支持的钱包',
    NETWORK_SWITCH_FAILED: '切换到 Monad 测试网失败',
    // ... more messages
};
```

## 🔒 Security Considerations

### Client-Side Security
- **No Private Keys**: Never store or transmit private keys
- **Signature Verification**: All authentication uses message signing
- **Session Tokens**: Encrypted and time-limited storage
- **Network Validation**: Enforces correct network usage

### Smart Contract Security
- **Access Control**: Role-based permissions
- **Input Validation**: Comprehensive parameter checking
- **Reentrancy Protection**: Guards against common attacks
- **Audit Trail**: Event logging for all actions

## 🐛 Troubleshooting

### Common Issues

1. **Wallet Not Detected**
   - Ensure MetaMask or compatible wallet is installed
   - Refresh page and try again
   - Check browser compatibility

2. **Network Switch Failed**
   - Manually add Monad Testnet to wallet
   - Check RPC URL connectivity
   - Verify chain ID (10143)

3. **Transaction Failures**
   - Ensure sufficient MON balance for gas
   - Check network congestion
   - Verify contract addresses

4. **Connection Issues**
   - Clear browser cache and localStorage
   - Disable conflicting browser extensions
   - Try different wallet or browser

### Debug Mode
Enable debug logging in browser console:

```javascript
localStorage.setItem('bubble_brawl_debug', 'true');
```

## 📱 Mobile Support

The authentication system is fully responsive and supports:

- **Mobile Wallets**: WalletConnect integration
- **Touch Interface**: Optimized for touch interactions
- **Responsive Design**: Adapts to all screen sizes
- **Deep Links**: Direct wallet app integration

## 🔄 Updates and Maintenance

### Contract Updates
When contracts are redeployed:

```bash
# Update client contract addresses
node scripts/update-client-contracts.js
```

### Version Management
- Contract addresses are versioned in deployment files
- Client code supports graceful fallbacks
- Automatic migration for address updates

## 📞 Support

For technical support or questions:

1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify network and wallet configuration
4. Contact development team with specific error details

---

**🎉 The Bubble Brawl Web3 authentication system provides a seamless bridge between traditional gaming and blockchain technology, offering players a secure and user-friendly way to access Web3 features while maintaining the fun and accessibility of the original game!**
