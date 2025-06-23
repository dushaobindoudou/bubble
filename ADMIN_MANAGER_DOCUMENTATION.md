# 🎮 Bubble Brawl Admin Manager Documentation

## 📋 Overview

The Bubble Brawl Admin Manager is a comprehensive administrative interface for managing all aspects of the Bubble Brawl gaming ecosystem. It provides a unified dashboard for contract management, user permissions, token operations, NFT management, marketplace configuration, and more.

## 🌐 Network Information

**Network:** Monad Testnet
**Chain ID:** 10143
**RPC URL:** https://testnet-rpc.monad.xyz
**Block Explorer:** https://testnet.monadexplorer.com
**Currency:** MON

## 📍 Deployed Contract Addresses

| Contract | Address | Description |
|----------|---------|-------------|
| **RandomGenerator** | `0xD6F375Fb0AF6e578faD82D2196A7ea7C540F510d` | Secure random number generation for game mechanics |
| **AccessControlManager** | `0x1D6eFa9E902dEB94BF77Df6341fA9A12e20806Eb` | Centralized permission and role management |
| **BubbleToken** | `0x2b775cbd54080ED6f118EA57fEADd4b4A5590537` | Main game token (BUB) with allocation management |
| **BubbleSkinNFT** | `0xEdD8e930A6dfe5f0Df35651a5dB8273D0C1a5221` | NFT skins for game characters |
| **GameRewards** | `0x97B3f1cA8605dDBa9fBC12C4bCB4f238293DBC8D` | Decentralized game reward distribution system |
| **Marketplace** | `0xF7989Ed95b49123a1D73AD6da8A03C1011c3d416` | NFT trading marketplace |

---

## 🏠 Manager Dashboard

### Features
- **Real-time Statistics:** Overview of all contract activities
- **Quick Actions:** Direct access to common administrative tasks
- **System Health:** Monitor contract status and performance
- **Navigation Hub:** Easy access to all management modules

### Key Metrics Displayed
- Total BUB tokens in circulation
- Active NFT skins and templates
- Pending game reward verifications
- Marketplace trading volume
- User permission statistics

---

## 🏆 Game Rewards Manager

### Purpose
Manage the decentralized game reward system where players submit sessions for verification and claim rewards.

### Key Features

#### **Session Verification**
- View pending player-submitted game sessions
- Verify or reject sessions with detailed reasoning
- Batch verification for efficiency
- Session details including score, duration, and game mode

#### **Reward Configuration**
- Set base reward amounts for different game modes
- Configure multipliers for special events
- Adjust daily reward limits
- Enable/disable reward distribution

#### **Player Management**
- Set individual player daily limits
- View player session history and statistics
- Manage player reward eligibility
- Track player performance metrics

#### **System Maintenance**
- Clean up expired sessions
- Monitor system statistics
- Configure session validity periods
- Manage maximum sessions per day

### Available Contract Methods
```solidity
// Player Session Management
submitPlayerSession(GameSession session)
verifyPlayerSession(bytes32 sessionId, bool approved)
verifyPlayerSessionsBatch(bytes32[] sessionIds, bool[] approvals)
claimReward(bytes32 sessionId)
claimRewardsBatch(bytes32[] sessionIds)

// Admin Configuration
updateRewardConfig(RewardConfig config)
setRewardEnabled(bool enabled)
setPlayerDailyLimit(address player, uint256 maxRewards, uint256 maxTokens)
setSessionValidityPeriod(uint256 newPeriod)
setMaxSessionsPerDay(uint256 newLimit)

// Query Functions
getPlayerSessions(address player)
getPendingVerificationSessions(uint256 offset, uint256 limit)
getSystemStats()
calculateReward(GameSession session)
```

---

## 🪙 Token Manager

### Purpose
Comprehensive management of the BUB token including minting, burning, allocation management, and transfer operations.

### Key Features

#### **Token Operations**
- **Minting:** Create new BUB tokens for game rewards
- **Batch Minting:** Efficiently mint tokens for multiple recipients
- **Burning:** Remove tokens from circulation
- **Admin Transfers:** Move tokens between addresses

#### **Allocation Management**
- **Team Tokens:** Release tokens from team allocation pool
- **Community Tokens:** Distribute community incentive tokens
- **Liquidity Tokens:** Release tokens for DEX liquidity
- **Daily Limits:** Configure and monitor daily reward limits

#### **Statistics & Monitoring**
- Real-time token supply information
- Allocation pool balances
- Daily reward usage tracking
- Holder balance queries
- Transaction history

### Token Allocation Breakdown
- **Game Rewards:** 45% (45,000,000 BUB)
- **Community:** 25% (25,000,000 BUB)
- **Team:** 15% (15,000,000 BUB)
- **Liquidity:** 15% (15,000,000 BUB)

### Available Contract Methods
```solidity
// Minting Operations
mintGameReward(address player, uint256 amount, string reason)
mintGameRewardsBatch(address[] players, uint256[] amounts, string reason)

// Allocation Management
releaseTeamTokens(address to, uint256 amount)
releaseCommunityTokens(address to, uint256 amount)
releaseLiquidityTokens(address to, uint256 amount)
setDailyRewardLimit(uint256 newLimit)

// Role Management
grantGameRewardRole(address account)
revokeGameRewardRole(address account)
getGameRewardRoleMembers()

// Query Functions
getRemainingGameRewards()
getRemainingTeamTokens()
getRemainingCommunityTokens()
getRemainingLiquidityTokens()
getTodayRemainingRewards()
getAllocationStats()
```

---

## 🎨 Skin Manager

### Purpose
Manage NFT skin templates and minting operations for game character customization.

### Key Features

#### **Template Management**
- Create new skin templates with rarity levels
- Update template metadata and descriptions
- Configure color schemes and visual effects
- Enable/disable templates
- Batch template operations

#### **NFT Minting**
- Mint specific skins for users
- Random skin minting by rarity
- Batch minting operations
- Custom skin creation

#### **Content Management**
- Support for SVG vector graphics
- IPFS/URL content linking
- Template preview system
- Metadata management

### Rarity System
- **Common:** Basic skins with standard effects
- **Rare:** Enhanced visual effects and unique colors
- **Epic:** Special animations and particle effects
- **Legendary:** Exclusive designs with premium effects

### Available Contract Methods
```solidity
// Template Management
createSkinTemplate(SkinTemplate template)
createSkinTemplatesBatch(SkinTemplate[] templates)
updateSkinTemplate(uint256 templateId, string name, string description)
setTemplateActive(uint256 templateId, bool isActive)
updateTemplateColorConfig(uint256 templateId, ColorConfig colorConfig)

// NFT Minting
mintSkin(address to, uint256 templateId)
mintSkinsBatch(address to, uint256[] templateIds)
mintRandomSkin(address to, RarityLevel rarity)

// Query Functions
getSkinTemplate(uint256 templateId)
getSkinInfo(uint256 tokenId)
getUserSkins(address user)
getTemplatesByRarity(RarityLevel rarity)
getTotalTemplates()
```

---

## 🛒 Marketplace Manager

### Purpose
Configure and manage the NFT trading marketplace including fees, supported tokens, and trading statistics.

### Key Features

#### **Fee Management**
- Set marketplace trading fees (in basis points)
- Configure fee recipient address
- Monitor fee collection statistics
- Update fee structures

#### **Token & NFT Support**
- Manage supported payment tokens
- Configure supported NFT contracts
- Batch operations for efficiency
- Real-time support status updates

#### **Trading Statistics**
- Total listings and sales volume
- Active marketplace listings
- Trading performance metrics
- Revenue analytics

#### **Marketplace Administration**
- Monitor active listings
- Manage marketplace policies
- Handle dispute resolution
- System maintenance

### Available Contract Methods
```solidity
// Trading Functions
listNFT(address nftContract, uint256 tokenId, address paymentToken, uint256 price, uint256 duration)
buyNFT(uint256 listingId)
cancelListing(uint256 listingId)

// Administrative Functions
setFeePercentage(uint256 _feePercentage)
setFeeRecipient(address _feeRecipient)
setSupportedPaymentToken(address token, bool supported)
setSupportedNFTContract(address nftContract, bool supported)
setSupportedPaymentTokensBatch(address[] tokens, bool[] supported)

// Query Functions
getActiveListings(uint256 offset, uint256 limit)
getUserListings(address user)
getUserPurchases(address user)
getMarketStats()
```

---

## 🎲 Random Generator Manager

### Purpose
Manage the secure random number generation system used for game mechanics and NFT minting.

### Key Features

#### **Random Number Generation**
- Generate simple random numbers (0 to max)
- Range-based random generation
- Weighted random selection
- Batch random number generation

#### **Seed Management**
- Update cryptographic seeds (admin only)
- Monitor seed usage and nonce values
- Secure seed rotation procedures
- Audit trail for seed changes

#### **Usage Statistics**
- Track total random generations
- Monitor generation patterns
- Performance metrics
- Security audit logs

### Security Considerations
- Only contract owner can update seeds
- Cryptographically secure random generation
- Nonce-based replay protection
- Audit logging for all operations

### Available Contract Methods
```solidity
// Random Number Generation
generateRandom(uint256 max)
generateRandomInRange(uint256 min, uint256 max)
weightedRandomSelect(uint256[] weights)
generateMultipleRandom(uint256 count, uint256 max)

// Administrative Functions
updateSeed(uint256 newSeed) // Owner only

// Query Functions
getCurrentSeed() // Owner only
getCurrentNonce()
```

---

## 🔐 Permission Manager

### Purpose
Comprehensive role and permission management system with integration to AccessControlManager.

### Key Features

#### **Multi-Tab Interface**
- **Overview:** Current permission status across all contracts
- **Management:** Grant and revoke permissions
- **History:** Track permission changes over time
- **ACM:** Advanced AccessControlManager features

#### **Role Management**
- Grant/revoke roles for token and NFT contracts
- Batch permission operations
- Self-service permission requests
- Role hierarchy management

#### **Permission Types**

**Token Contract Roles:**
- `DEFAULT_ADMIN_ROLE` - Super administrator
- `ADMIN_ROLE` - Contract administrator
- `GAME_REWARD_ROLE` - Game reward minting
- `MINTER_ROLE` - Token minting permissions

**NFT Contract Roles:**
- `ADMIN_ROLE` - NFT contract administrator
- `MINTER_ROLE` - NFT minting permissions
- `SKIN_MANAGER_ROLE` - Skin template management

#### **Security Features**
- Address validation
- Permission verification before operations
- Gas fee estimation
- Confirmation dialogs for critical operations
- Audit logging

### Available Contract Methods
```solidity
// Token Contract
grantRole(bytes32 role, address account)
revokeRole(bytes32 role, address account)
hasRole(bytes32 role, address account)
grantGameRewardRole(address account)
revokeGameRewardRole(address account)

// NFT Contract
grantRole(bytes32 role, address account)
revokeRole(bytes32 role, address account)
hasRole(bytes32 role, address account)

// AccessControlManager
getUserRoles(address account)
getUserPermissionHistory(address account)
getPermissionHistoryCount()
grantRoleBatch(bytes32 role, address[] accounts)
revokeRoleBatch(bytes32 role, address[] accounts)
```

---

## 🚀 Getting Started

### Prerequisites
1. **Wallet Setup:** MetaMask or compatible Web3 wallet
2. **Network Configuration:** Add Monad Testnet to your wallet
3. **Test Tokens:** Obtain MON tokens for gas fees
4. **Permissions:** Contact admin for initial role assignments

### Initial Setup Steps

1. **Connect Wallet**
   - Navigate to the Manager page
   - Click "Connect Wallet"
   - Select your preferred wallet
   - Approve the connection

2. **Verify Network**
   - Ensure you're connected to Monad Testnet
   - Check that your wallet shows the correct chain ID (10143)

3. **Check Permissions**
   - Visit the Permission Manager
   - Review your current roles and permissions
   - Request additional permissions if needed

4. **Explore Dashboard**
   - Review the overview statistics
   - Familiarize yourself with available modules
   - Test basic operations in a safe environment

### Common Operations

#### **Minting Game Rewards**
1. Navigate to Token Manager
2. Click "Mint Tokens"
3. Enter recipient address and amount
4. Add reason for minting
5. Confirm transaction

#### **Creating Skin Templates**
1. Go to Skin Manager
2. Click "Create Template"
3. Fill in template details
4. Set rarity and effects
5. Upload or link content
6. Submit for creation

#### **Verifying Game Sessions**
1. Open Game Rewards Manager
2. Review pending sessions
3. Check session details
4. Approve or reject with reasoning
5. Process batch operations if needed

---

## 🛡️ Security Best Practices

### Access Control
- **Principle of Least Privilege:** Only grant necessary permissions
- **Regular Audits:** Review and update permissions periodically
- **Role Separation:** Separate administrative and operational roles
- **Multi-signature:** Use multi-sig wallets for critical operations

### Transaction Security
- **Gas Estimation:** Always check gas fees before transactions
- **Address Verification:** Double-check all addresses before operations
- **Amount Validation:** Verify token amounts and calculations
- **Confirmation Dialogs:** Use built-in confirmation systems

### Operational Security
- **Backup Procedures:** Maintain secure backups of critical data
- **Monitoring:** Regularly monitor contract activities
- **Incident Response:** Have procedures for handling security incidents
- **Documentation:** Keep detailed logs of all administrative actions

---

## 🔧 Troubleshooting

### Common Issues

#### **Transaction Failures**
- **Insufficient Gas:** Increase gas limit or price
- **Permission Denied:** Verify you have required roles
- **Network Issues:** Check Monad Testnet connectivity
- **Wallet Problems:** Reconnect or refresh wallet connection

#### **Permission Issues**
- **Role Not Found:** Contact admin for role assignment
- **Access Denied:** Verify contract permissions
- **Outdated Permissions:** Refresh page and reconnect wallet

#### **Interface Problems**
- **Loading Issues:** Clear browser cache and reload
- **Display Problems:** Check browser compatibility
- **Connection Errors:** Verify network settings

### Support Resources
- **Documentation:** This comprehensive guide
- **Contract Explorer:** Use Monad block explorer for transaction details
- **Community:** Join the Bubble Brawl Discord for support
- **Development Team:** Contact developers for technical issues

---

## 📊 Monitoring & Analytics

### Key Metrics to Track
- **Token Distribution:** Monitor allocation pool usage
- **NFT Activity:** Track template creation and minting
- **Game Rewards:** Monitor session verification rates
- **Marketplace:** Track trading volume and fees
- **Permissions:** Audit role assignments and changes

### Reporting Features
- **Real-time Dashboards:** Live statistics and metrics
- **Historical Data:** Track trends over time
- **Export Capabilities:** Download data for analysis
- **Alert Systems:** Notifications for important events

---

## 🔄 Updates & Maintenance

### Regular Maintenance Tasks
- **Permission Audits:** Monthly review of all roles
- **Contract Monitoring:** Daily health checks
- **Data Cleanup:** Remove expired sessions and old data
- **Security Updates:** Apply patches and improvements

### Upgrade Procedures
- **Contract Upgrades:** Follow proper upgrade protocols
- **Interface Updates:** Deploy new UI versions safely
- **Data Migration:** Ensure data integrity during upgrades
- **Rollback Plans:** Maintain rollback capabilities

---

## 📞 Contact & Support

### Development Team
- **Smart Contracts:** Contract development and security
- **Frontend:** UI/UX and interface development
- **DevOps:** Infrastructure and deployment

### Community Resources
- **Discord:** Real-time community support
- **GitHub:** Technical documentation and issues
- **Documentation:** Comprehensive guides and tutorials

---

*Last Updated: 2025-06-22*
*Version: 1.0.0*
*Network: Monad Testnet*
