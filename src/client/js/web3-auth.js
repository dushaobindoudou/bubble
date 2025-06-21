/**
 * Web3 Authentication Manager for Bubble Brawl
 * Handles wallet connection, authentication, and network management
 */

class Web3AuthManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.chainId = null;
        this.isConnected = false;
        this.contracts = {};
        this.eventListeners = new Map();
        
        // Load configuration
        this.config = window.Web3Config;
        
        // Initialize
        this.init();
    }

    async init() {
        // Check for existing connection
        await this.checkExistingConnection();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load contract addresses from deployment
        await this.loadContractAddresses();
    }

    /**
     * Check for existing wallet connection
     */
    async checkExistingConnection() {
        try {
            const savedAddress = localStorage.getItem(this.config.STORAGE_KEYS.WALLET_ADDRESS);
            const savedWalletType = localStorage.getItem(this.config.STORAGE_KEYS.WALLET_TYPE);
            
            if (savedAddress && savedWalletType && window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
                    await this.connectWallet(savedWalletType, false);
                }
            }
        } catch (error) {
            console.warn('Failed to check existing connection:', error);
            this.clearStoredAuth();
        }
    }

    /**
     * Setup wallet event listeners
     */
    setupEventListeners() {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else if (accounts[0] !== this.address) {
                    this.handleAccountChange(accounts[0]);
                }
            });

            window.ethereum.on('chainChanged', (chainId) => {
                this.handleChainChange(chainId);
            });

            window.ethereum.on('disconnect', () => {
                this.disconnect();
            });
        }
    }

    /**
     * Connect to wallet
     */
    async connectWallet(walletType = 'metamask', showPrompt = true) {
        try {
            this.emit('connecting');

            if (!window.ethereum) {
                throw new Error(this.config.ERROR_MESSAGES.WALLET_NOT_FOUND);
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error(this.config.ERROR_MESSAGES.CONNECTION_REJECTED);
            }

            // Setup provider and signer
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.address = accounts[0];
            
            // Get chain ID
            const network = await this.provider.getNetwork();
            this.chainId = network.chainId;

            // Check if on correct network
            if (this.chainId !== parseInt(this.config.MONAD_TESTNET.chainId, 16)) {
                if (showPrompt) {
                    await this.switchToMonadTestnet();
                }
            }

            // Verify signature for authentication
            await this.authenticateWithSignature();

            // Check MON balance
            await this.checkMonBalance();

            // Initialize contracts
            await this.initializeContracts();

            // Store connection info
            this.storeAuthInfo(walletType);

            this.isConnected = true;
            this.emit('connected', {
                address: this.address,
                chainId: this.chainId,
                walletType
            });

            return {
                success: true,
                address: this.address,
                chainId: this.chainId
            };

        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Authenticate user with wallet signature
     */
    async authenticateWithSignature() {
        try {
            const message = `欢迎来到泡泡大作战！\n\n请签名以验证您的身份。\n\n时间戳: ${Date.now()}`;
            const signature = await this.signer.signMessage(message);
            
            // Store auth token
            const authToken = btoa(JSON.stringify({
                address: this.address,
                signature,
                timestamp: Date.now()
            }));
            
            localStorage.setItem(this.config.STORAGE_KEYS.AUTH_TOKEN, authToken);
            
            return signature;
        } catch (error) {
            throw new Error(this.config.ERROR_MESSAGES.SIGNATURE_FAILED);
        }
    }

    /**
     * Switch to Monad Testnet
     */
    async switchToMonadTestnet() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: this.config.MONAD_TESTNET.chainId }]
            });
        } catch (switchError) {
            // If network doesn't exist, add it
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [this.config.MONAD_TESTNET]
                });
            } else {
                throw new Error(this.config.ERROR_MESSAGES.NETWORK_SWITCH_FAILED);
            }
        }
        
        // Update chain ID after switch
        const network = await this.provider.getNetwork();
        this.chainId = network.chainId;
        
        this.emit('networkChanged', this.chainId);
    }

    /**
     * Check MON token balance
     */
    async checkMonBalance() {
        try {
            const balance = await this.provider.getBalance(this.address);
            const balanceInEther = ethers.utils.formatEther(balance);
            
            if (balance.lt(this.config.MIN_MON_BALANCE)) {
                console.warn('Low MON balance:', balanceInEther);
                this.emit('lowBalance', balanceInEther);
            }
            
            return balanceInEther;
        } catch (error) {
            console.error('Failed to check MON balance:', error);
            return '0';
        }
    }

    /**
     * Initialize smart contracts
     */
    async initializeContracts() {
        try {
            for (const [contractName, abi] of Object.entries(this.config.CONTRACT_ABIS)) {
                const address = this.config.CONTRACT_ADDRESSES[contractName];
                if (address && address !== '') {
                    this.contracts[contractName] = new ethers.Contract(address, abi, this.signer);
                }
            }
        } catch (error) {
            console.error('Failed to initialize contracts:', error);
        }
    }

    /**
     * Load contract addresses from deployment
     */
    async loadContractAddresses() {
        try {
            // Try to load from a deployment file or API
            // For now, we'll use placeholder addresses that would be populated from actual deployment

            // This would typically fetch from /api/contracts or a deployment.json file
            const response = await fetch('/contracts/deployment.json').catch(() => null);
            if (response && response.ok) {
                const deployment = await response.json();
                Object.assign(this.config.CONTRACT_ADDRESSES, deployment);
            } else {
                // Fallback: try to load from window global if set by deployment script
                if (window.BUBBLE_BRAWL_CONTRACTS) {
                    Object.assign(this.config.CONTRACT_ADDRESSES, window.BUBBLE_BRAWL_CONTRACTS);
                }
            }
        } catch (error) {
            console.warn('Could not load contract addresses:', error);
        }
    }

    /**
     * Get user's token balances
     */
    async getUserBalances() {
        if (!this.isConnected) return null;

        try {
            const balances = {
                MON: await this.checkMonBalance(),
                BUB: '0',
                NFTs: []
            };

            // Get BUB token balance
            if (this.contracts.BubbleToken) {
                const bubBalance = await this.contracts.BubbleToken.balanceOf(this.address);
                balances.BUB = ethers.utils.formatEther(bubBalance);
            }

            // Get NFT balance
            if (this.contracts.BubbleSkinNFT) {
                const nftBalance = await this.contracts.BubbleSkinNFT.balanceOf(this.address);
                const userSkins = await this.contracts.BubbleSkinNFT.getUserSkins(this.address);
                balances.NFTs = userSkins.map(id => id.toString());
            }

            return balances;
        } catch (error) {
            console.error('Failed to get user balances:', error);
            return null;
        }
    }

    /**
     * Handle account change
     */
    async handleAccountChange(newAddress) {
        this.address = newAddress;
        await this.authenticateWithSignature();
        await this.initializeContracts();
        this.storeAuthInfo(localStorage.getItem(this.config.STORAGE_KEYS.WALLET_TYPE));
        this.emit('accountChanged', newAddress);
    }

    /**
     * Handle chain change
     */
    handleChainChange(chainId) {
        this.chainId = parseInt(chainId, 16);
        this.emit('chainChanged', this.chainId);
        
        // If not on Monad testnet, prompt to switch
        if (this.chainId !== parseInt(this.config.MONAD_TESTNET.chainId, 16)) {
            this.emit('wrongNetwork', this.chainId);
        }
    }

    /**
     * Store authentication info
     */
    storeAuthInfo(walletType) {
        localStorage.setItem(this.config.STORAGE_KEYS.WALLET_ADDRESS, this.address);
        localStorage.setItem(this.config.STORAGE_KEYS.WALLET_TYPE, walletType);
        localStorage.setItem(this.config.STORAGE_KEYS.LAST_LOGIN, Date.now().toString());
    }

    /**
     * Clear stored authentication
     */
    clearStoredAuth() {
        Object.values(this.config.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }

    /**
     * Disconnect wallet
     */
    disconnect() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.chainId = null;
        this.isConnected = false;
        this.contracts = {};
        
        this.clearStoredAuth();
        this.emit('disconnected');
    }

    /**
     * Event emitter methods
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            address: this.address,
            chainId: this.chainId,
            isCorrectNetwork: this.chainId === parseInt(this.config.MONAD_TESTNET.chainId, 16)
        };
    }
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.Web3AuthManager = Web3AuthManager;
}

// Export for Node.js use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Web3AuthManager;
}
