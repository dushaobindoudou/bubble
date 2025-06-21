/**
 * Authentication UI Manager for Bubble Brawl
 * Handles the authentication interface and user interactions
 */

class AuthUI {
    constructor(web3Auth) {
        this.web3Auth = web3Auth;
        this.isVisible = false;
        this.currentStep = 'wallet-selection';
        this.init();
    }

    init() {
        this.createAuthModal();
        this.setupEventListeners();
        this.bindWeb3Events();
    }

    /**
     * Create the authentication modal HTML
     */
    createAuthModal() {
        const modalHTML = `
            <div id="authModal" class="auth-modal" style="display: none;">
                <div class="auth-modal-overlay"></div>
                <div class="auth-modal-content">
                    <div class="auth-header">
                        <h2>🫧 连接到泡泡大作战</h2>
                        <button class="auth-close" id="authCloseBtn">&times;</button>
                    </div>
                    
                    <!-- Wallet Selection Step -->
                    <div id="walletSelection" class="auth-step active">
                        <div class="auth-step-content">
                            <h3>选择您的钱包</h3>
                            <p class="auth-description">选择一个钱包来连接到游戏并管理您的资产</p>
                            
                            <div class="wallet-options">
                                <button class="wallet-option" data-wallet="metamask">
                                    <span class="wallet-icon">🦊</span>
                                    <div class="wallet-info">
                                        <span class="wallet-name">MetaMask</span>
                                        <span class="wallet-desc">最受欢迎的以太坊钱包</span>
                                    </div>
                                    <span class="wallet-arrow">→</span>
                                </button>
                                
                                <button class="wallet-option" data-wallet="walletconnect">
                                    <span class="wallet-icon">🔗</span>
                                    <div class="wallet-info">
                                        <span class="wallet-name">WalletConnect</span>
                                        <span class="wallet-desc">连接移动端钱包</span>
                                    </div>
                                    <span class="wallet-arrow">→</span>
                                </button>
                                
                                <button class="wallet-option" data-wallet="coinbase">
                                    <span class="wallet-icon">🔵</span>
                                    <div class="wallet-info">
                                        <span class="wallet-name">Coinbase Wallet</span>
                                        <span class="wallet-desc">安全的自托管钱包</span>
                                    </div>
                                    <span class="wallet-arrow">→</span>
                                </button>
                            </div>
                            
                            <div class="auth-divider">
                                <span>或者</span>
                            </div>
                            
                            <button class="social-auth-btn" id="googleAuthBtn">
                                <span class="social-icon">🔍</span>
                                使用 Google 账户登录
                            </button>
                            
                            <div class="auth-help">
                                <p>没有钱包？ <a href="#" id="walletHelpBtn">了解如何创建</a></p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Connecting Step -->
                    <div id="connecting" class="auth-step">
                        <div class="auth-step-content">
                            <div class="loading-spinner"></div>
                            <h3>正在连接...</h3>
                            <p id="connectingMessage">请在您的钱包中确认连接</p>
                        </div>
                    </div>
                    
                    <!-- Network Switch Step -->
                    <div id="networkSwitch" class="auth-step">
                        <div class="auth-step-content">
                            <div class="network-info">
                                <h3>⚠️ 网络切换</h3>
                                <p>游戏需要连接到 Monad 测试网</p>
                                
                                <div class="network-details">
                                    <div class="network-item">
                                        <span class="label">网络名称:</span>
                                        <span class="value">Monad Testnet</span>
                                    </div>
                                    <div class="network-item">
                                        <span class="label">链 ID:</span>
                                        <span class="value">10143</span>
                                    </div>
                                    <div class="network-item">
                                        <span class="label">货币符号:</span>
                                        <span class="value">MON</span>
                                    </div>
                                    <div class="network-item">
                                        <span class="label">RPC URL:</span>
                                        <span class="value">https://testnet-rpc.monad.xyz</span>
                                    </div>
                                </div>
                                
                                <button class="primary-btn" id="switchNetworkBtn">切换到 Monad 测试网</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Success Step -->
                    <div id="authSuccess" class="auth-step">
                        <div class="auth-step-content">
                            <div class="success-icon">✅</div>
                            <h3>连接成功！</h3>
                            <p>欢迎来到泡泡大作战</p>
                            
                            <div class="user-info" id="userInfo">
                                <div class="user-address">
                                    <span class="label">钱包地址:</span>
                                    <span class="address" id="userAddress"></span>
                                    <button class="copy-btn" id="copyAddressBtn">📋</button>
                                </div>
                                
                                <div class="user-balances" id="userBalances">
                                    <div class="balance-item">
                                        <span class="balance-label">MON:</span>
                                        <span class="balance-value" id="monBalance">加载中...</span>
                                    </div>
                                    <div class="balance-item">
                                        <span class="balance-label">BUB:</span>
                                        <span class="balance-value" id="bubBalance">加载中...</span>
                                    </div>
                                    <div class="balance-item">
                                        <span class="balance-label">NFTs:</span>
                                        <span class="balance-value" id="nftBalance">加载中...</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button class="primary-btn" id="startGameBtn">🚀 开始游戏</button>
                        </div>
                    </div>
                    
                    <!-- Error Step -->
                    <div id="authError" class="auth-step">
                        <div class="auth-step-content">
                            <div class="error-icon">❌</div>
                            <h3>连接失败</h3>
                            <p id="errorMessage">发生了未知错误</p>
                            
                            <div class="error-actions">
                                <button class="secondary-btn" id="retryBtn">重试</button>
                                <button class="primary-btn" id="backToSelectionBtn">返回选择</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Wallet Help Step -->
                    <div id="walletHelp" class="auth-step">
                        <div class="auth-step-content">
                            <h3>💡 如何创建钱包</h3>
                            
                            <div class="help-content">
                                <div class="help-section">
                                    <h4>1. 选择钱包</h4>
                                    <p>我们推荐使用 MetaMask，它是最受欢迎和安全的以太坊钱包。</p>
                                </div>
                                
                                <div class="help-section">
                                    <h4>2. 安装钱包</h4>
                                    <p>访问 <a href="https://metamask.io" target="_blank">metamask.io</a> 下载并安装浏览器扩展。</p>
                                </div>
                                
                                <div class="help-section">
                                    <h4>3. 创建账户</h4>
                                    <p>按照钱包的指引创建新账户，并安全保存您的助记词。</p>
                                </div>
                                
                                <div class="help-section">
                                    <h4>4. 获取测试代币</h4>
                                    <p>访问 Monad 测试网水龙头获取免费的 MON 代币用于支付 Gas 费用。</p>
                                </div>
                            </div>
                            
                            <button class="primary-btn" id="backFromHelpBtn">返回</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Setup UI event listeners
     */
    setupEventListeners() {
        // Close modal
        document.getElementById('authCloseBtn').addEventListener('click', () => {
            this.hide();
        });

        // Wallet selection
        document.querySelectorAll('.wallet-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const walletType = e.currentTarget.dataset.wallet;
                this.connectWallet(walletType);
            });
        });

        // Social auth
        document.getElementById('googleAuthBtn').addEventListener('click', () => {
            this.showSocialAuth();
        });

        // Network switch
        document.getElementById('switchNetworkBtn').addEventListener('click', () => {
            this.switchNetwork();
        });

        // Help
        document.getElementById('walletHelpBtn').addEventListener('click', () => {
            this.showStep('walletHelp');
        });

        document.getElementById('backFromHelpBtn').addEventListener('click', () => {
            this.showStep('walletSelection');
        });

        // Error handling
        document.getElementById('retryBtn').addEventListener('click', () => {
            this.showStep('walletSelection');
        });

        document.getElementById('backToSelectionBtn').addEventListener('click', () => {
            this.showStep('walletSelection');
        });

        // Success actions
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('copyAddressBtn').addEventListener('click', () => {
            this.copyAddress();
        });

        // Close on overlay click
        document.querySelector('.auth-modal-overlay').addEventListener('click', () => {
            this.hide();
        });
    }

    /**
     * Bind Web3 authentication events
     */
    bindWeb3Events() {
        this.web3Auth.on('connecting', () => {
            this.showStep('connecting');
            this.updateConnectingMessage('正在连接钱包...');
        });

        this.web3Auth.on('connected', (data) => {
            this.showStep('authSuccess');
            this.updateUserInfo(data);
        });

        this.web3Auth.on('error', (error) => {
            this.showError(error.message);
        });

        this.web3Auth.on('wrongNetwork', () => {
            this.showStep('networkSwitch');
        });

        this.web3Auth.on('networkChanged', () => {
            if (this.web3Auth.chainId === parseInt(this.web3Auth.config.MONAD_TESTNET.chainId, 16)) {
                this.showStep('authSuccess');
            }
        });

        this.web3Auth.on('lowBalance', (balance) => {
            this.showWarning(`MON 余额较低 (${balance})，可能无法支付 Gas 费用`);
        });
    }

    /**
     * Show the authentication modal
     */
    show() {
        document.getElementById('authModal').style.display = 'flex';
        this.isVisible = true;
        this.showStep('walletSelection');
    }

    /**
     * Hide the authentication modal
     */
    hide() {
        document.getElementById('authModal').style.display = 'none';
        this.isVisible = false;
    }

    /**
     * Show specific step
     */
    showStep(stepId) {
        // Hide all steps
        document.querySelectorAll('.auth-step').forEach(step => {
            step.classList.remove('active');
        });

        // Show target step
        document.getElementById(stepId).classList.add('active');
        this.currentStep = stepId;
    }

    /**
     * Connect wallet
     */
    async connectWallet(walletType) {
        try {
            await this.web3Auth.connectWallet(walletType);
        } catch (error) {
            this.showError(error.message);
        }
    }

    /**
     * Switch network
     */
    async switchNetwork() {
        try {
            this.updateConnectingMessage('正在切换网络...');
            this.showStep('connecting');
            await this.web3Auth.switchToMonadTestnet();
        } catch (error) {
            this.showError(error.message);
        }
    }

    /**
     * Show social authentication (placeholder)
     */
    showSocialAuth() {
        alert('社交登录功能即将推出！\n目前请使用 Web3 钱包登录。');
    }

    /**
     * Update connecting message
     */
    updateConnectingMessage(message) {
        document.getElementById('connectingMessage').textContent = message;
    }

    /**
     * Update user info display
     */
    async updateUserInfo(data) {
        document.getElementById('userAddress').textContent = 
            `${data.address.slice(0, 6)}...${data.address.slice(-4)}`;

        // Load and display balances
        const balances = await this.web3Auth.getUserBalances();
        if (balances) {
            document.getElementById('monBalance').textContent = `${parseFloat(balances.MON).toFixed(4)} MON`;
            document.getElementById('bubBalance').textContent = `${parseFloat(balances.BUB).toFixed(2)} BUB`;
            document.getElementById('nftBalance').textContent = `${balances.NFTs.length} 个`;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        this.showStep('authError');
    }

    /**
     * Show warning message
     */
    showWarning(message) {
        // Create a temporary warning notification
        const warning = document.createElement('div');
        warning.className = 'auth-warning';
        warning.textContent = message;
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff9800;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 10001;
            max-width: 300px;
        `;
        
        document.body.appendChild(warning);
        
        setTimeout(() => {
            warning.remove();
        }, 5000);
    }

    /**
     * Copy address to clipboard
     */
    copyAddress() {
        const address = this.web3Auth.address;
        navigator.clipboard.writeText(address).then(() => {
            const btn = document.getElementById('copyAddressBtn');
            const originalText = btn.textContent;
            btn.textContent = '✅';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
    }

    /**
     * Start the game
     */
    startGame() {
        this.hide();
        
        // Trigger the original game start with Web3 integration
        if (window.startGameWithWeb3) {
            window.startGameWithWeb3();
        } else {
            // Fallback to original game start
            const playerNameInput = document.getElementById('playerNameInput');
            playerNameInput.value = `Player_${this.web3Auth.address.slice(-4)}`;
            
            // Trigger original start game function
            if (window.startGame) {
                window.startGame('player');
            }
        }
    }
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.AuthUI = AuthUI;
}

// Export for Node.js use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthUI;
}
