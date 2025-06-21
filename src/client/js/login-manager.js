/**
 * Login Manager for Bubble Brawl
 * Handles authentication flow and user interactions
 */

class LoginManager {
    constructor() {
        this.rainbowKitConfig = null;
        this.isInitialized = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
        
        // UI elements
        this.loadingOverlay = null;
        this.errorModal = null;
        this.networkStatus = null;
        
        // Event listeners
        this.eventListeners = new Map();
    }

    /**
     * Initialize the login manager
     */
    async init() {
        try {
            console.log('🔐 Initializing Login Manager...');

            // Initialize UI elements
            this.initializeUIElements();

            // Initialize RainbowKit
            this.rainbowKitConfig = new RainbowKitConfig();
            await this.rainbowKitConfig.init();

            // Setup event listeners
            this.setupEventListeners();

            // Render connect button
            this.renderConnectButton();

            // Setup wallet event monitoring
            this.setupWalletEventMonitoring();

            this.isInitialized = true;
            console.log('✅ Login Manager initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize Login Manager:', error);
            this.showError('初始化失败', error.message);
            throw error;
        }
    }

    /**
     * Initialize UI elements
     */
    initializeUIElements() {
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.errorModal = document.getElementById('errorModal');
        this.networkStatus = document.getElementById('networkStatus');

        // Update network status
        if (this.networkStatus) {
            this.networkStatus.textContent = '准备连接';
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Guest login button
        const guestLoginBtn = document.getElementById('guestLoginBtn');
        if (guestLoginBtn) {
            guestLoginBtn.addEventListener('click', () => {
                this.handleGuestLogin();
            });
        }

        // Error modal buttons
        const errorClose = document.getElementById('errorClose');
        const errorRetry = document.getElementById('errorRetry');
        const errorGuest = document.getElementById('errorGuest');

        if (errorClose) {
            errorClose.addEventListener('click', () => {
                this.hideError();
            });
        }

        if (errorRetry) {
            errorRetry.addEventListener('click', () => {
                this.hideError();
                this.retryConnection();
            });
        }

        if (errorGuest) {
            errorGuest.addEventListener('click', () => {
                this.hideError();
                this.handleGuestLogin();
            });
        }

        // Help section toggle
        const helpDetails = document.querySelector('.help-details');
        if (helpDetails) {
            helpDetails.addEventListener('toggle', (e) => {
                if (e.target.open) {
                    console.log('📖 Help section opened');
                }
            });
        }
    }

    /**
     * Render RainbowKit connect button
     */
    renderConnectButton() {
        try {
            // For now, create a simple connect button since RainbowKit integration is complex
            const container = document.getElementById('rainbowkit-container');
            if (!container) {
                throw new Error('RainbowKit container not found');
            }

            // Create connect button
            const connectBtn = document.createElement('button');
            connectBtn.className = 'rainbowkit-connect-btn';
            connectBtn.innerHTML = '🔗 连接钱包';
            connectBtn.style.cssText = `
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 16px;
                padding: 16px 32px;
                font-size: 1.1rem;
                font-weight: 600;
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
                font-family: 'Orbitron', sans-serif;
                min-width: 200px;
            `;

            // Add hover effects
            connectBtn.addEventListener('mouseenter', () => {
                connectBtn.style.transform = 'translateY(-2px)';
                connectBtn.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.4)';
                connectBtn.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            });

            connectBtn.addEventListener('mouseleave', () => {
                connectBtn.style.transform = 'translateY(0)';
                connectBtn.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
                connectBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            });

            // Add click handler
            connectBtn.addEventListener('click', () => {
                this.handleWalletConnect();
            });

            container.appendChild(connectBtn);

        } catch (error) {
            console.error('❌ Failed to render connect button:', error);
            this.showError('按钮渲染失败', error.message);
        }
    }

    /**
     * Handle wallet connection
     */
    async handleWalletConnect() {
        try {
            this.connectionAttempts++;
            console.log(`🔗 Attempting wallet connection (${this.connectionAttempts}/${this.maxConnectionAttempts})`);

            this.showLoading('连接钱包', '请在钱包中确认连接请求');
            this.updateNetworkStatus('连接中...');

            // Check if MetaMask is available
            if (typeof window.ethereum === 'undefined') {
                throw new Error('未检测到Web3钱包。请安装MetaMask或其他支持的钱包。');
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('用户拒绝连接钱包');
            }

            const account = accounts[0];
            console.log('✅ Wallet connected:', account);

            // Check network
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const currentChainId = parseInt(chainId, 16);

            if (currentChainId !== 10143) {
                console.log('⚠️ Wrong network, switching to Monad Testnet...');
                await this.switchToMonadTestnet();
            }

            // Create session
            const sessionData = {
                address: account,
                chainId: currentChainId,
                timestamp: Date.now(),
                loginMethod: 'wallet'
            };

            // Store session
            window.sessionManager.createSession(sessionData);

            this.updateNetworkStatus('已连接');
            this.showLoading('验证中', '正在验证网络和账户信息');

            // Simulate verification delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            this.hideLoading();

            // Show success and redirect
            this.showSuccess(account);

        } catch (error) {
            console.error('❌ Wallet connection failed:', error);
            this.hideLoading();
            this.updateNetworkStatus('连接失败');
            
            if (this.connectionAttempts < this.maxConnectionAttempts) {
                this.showError('连接失败', `${error.message}\n\n是否重试？`, true);
            } else {
                this.showError('连接失败', `多次尝试失败：${error.message}\n\n建议使用游客模式或检查钱包设置。`, false);
            }
        }
    }

    /**
     * Switch to Monad Testnet
     */
    async switchToMonadTestnet() {
        try {
            console.log('🌐 Switching to Monad Testnet...');
            this.showLoading('切换网络', '正在切换到Monad测试网');

            const monadTestnet = {
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

            try {
                // Try to switch to the network
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: monadTestnet.chainId }]
                });
            } catch (switchError) {
                // If network doesn't exist, add it
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [monadTestnet]
                    });
                } else {
                    throw switchError;
                }
            }

            console.log('✅ Successfully switched to Monad Testnet');

        } catch (error) {
            console.error('❌ Failed to switch network:', error);
            throw new Error(`网络切换失败: ${error.message}`);
        }
    }

    /**
     * Handle guest login
     */
    handleGuestLogin() {
        console.log('👤 Guest login selected');

        this.showLoading('游客登录', '正在准备游客模式');

        // Create guest session
        const sessionData = {
            address: null,
            chainId: null,
            timestamp: Date.now(),
            loginMethod: 'guest',
            isGuest: true
        };

        // Store session
        window.sessionManager.createSession(sessionData);

        // Simulate loading
        setTimeout(() => {
            this.hideLoading();
            this.redirectToGame();
        }, 1000);
    }

    /**
     * Show success message and redirect
     */
    showSuccess(account) {
        this.showLoading('登录成功', `欢迎，${account.slice(0, 6)}...${account.slice(-4)}`);

        setTimeout(() => {
            this.redirectToGame();
        }, 2000);
    }

    /**
     * Redirect to game page
     */
    redirectToGame() {
        console.log('🎮 Redirecting to game...');
        window.location.href = 'index.html';
    }

    /**
     * Retry connection
     */
    retryConnection() {
        if (this.connectionAttempts < this.maxConnectionAttempts) {
            this.handleWalletConnect();
        } else {
            this.showError('重试次数已达上限', '建议使用游客模式或检查钱包设置。');
        }
    }

    /**
     * Setup wallet event monitoring
     */
    setupWalletEventMonitoring() {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('👤 Accounts changed:', accounts);
                if (accounts.length === 0) {
                    this.updateNetworkStatus('已断开');
                }
            });

            window.ethereum.on('chainChanged', (chainId) => {
                console.log('🌐 Chain changed:', chainId);
                const currentChainId = parseInt(chainId, 16);
                if (currentChainId === 10143) {
                    this.updateNetworkStatus('Monad测试网');
                } else {
                    this.updateNetworkStatus('错误网络');
                }
            });
        }
    }

    /**
     * Update network status display
     */
    updateNetworkStatus(status) {
        if (this.networkStatus) {
            this.networkStatus.textContent = status;
        }
    }

    /**
     * Show loading overlay
     */
    showLoading(title, message) {
        if (this.loadingOverlay) {
            const loadingTitle = this.loadingOverlay.querySelector('.loading-title');
            const loadingText = this.loadingOverlay.querySelector('.loading-text');
            
            if (loadingTitle) loadingTitle.textContent = title;
            if (loadingText) loadingText.textContent = message;
            
            this.loadingOverlay.style.display = 'flex';
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'none';
        }
    }

    /**
     * Show error modal
     */
    showError(title, message, showRetry = false) {
        if (this.errorModal) {
            const errorTitle = this.errorModal.querySelector('.error-title');
            const errorMessage = this.errorModal.querySelector('.error-message');
            const errorRetry = this.errorModal.querySelector('.error-retry');
            
            if (errorTitle) errorTitle.textContent = title;
            if (errorMessage) errorMessage.textContent = message;
            if (errorRetry) {
                errorRetry.style.display = showRetry ? 'block' : 'none';
            }
            
            this.errorModal.style.display = 'flex';
        }
    }

    /**
     * Hide error modal
     */
    hideError() {
        if (this.errorModal) {
            this.errorModal.style.display = 'none';
        }
    }

    /**
     * Get initialization status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            connectionAttempts: this.connectionAttempts,
            maxConnectionAttempts: this.maxConnectionAttempts
        };
    }
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.LoginManager = LoginManager;
}

// Export for Node.js use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoginManager;
}
