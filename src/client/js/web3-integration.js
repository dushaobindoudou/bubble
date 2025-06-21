/**
 * Web3 Integration for Bubble Brawl
 * Integrates Web3 authentication with the existing game
 */

class BubbleBrawlWeb3 {
    constructor() {
        this.web3Auth = null;
        this.authUI = null;
        this.isInitialized = false;
        this.gameStarted = false;
        
        this.init();
    }

    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initialize());
            } else {
                await this.initialize();
            }
        } catch (error) {
            console.error('Failed to initialize Web3 integration:', error);
        }
    }

    async initialize() {
        try {
            // Check if ethers is available
            if (typeof window.ethers === 'undefined') {
                console.warn('⚠️  Ethers.js not available, Web3 features disabled');
                this.showWeb3UnavailableMessage();
                return;
            }

            // Initialize Web3 Auth Manager
            this.web3Auth = new Web3AuthManager();

            // Initialize Auth UI
            this.authUI = new AuthUI(this.web3Auth);

            // Setup game integration
            this.setupGameIntegration();

            // Setup wallet status display
            this.setupWalletStatus();

            // Check for auto-login
            await this.checkAutoLogin();

            this.isInitialized = true;
            console.log('🫧 Bubble Brawl Web3 integration initialized');

        } catch (error) {
            console.error('Failed to initialize Web3 integration:', error);
            this.showWeb3ErrorMessage(error);
        }
    }

    /**
     * Setup game integration hooks
     */
    setupGameIntegration() {
        // Override the original start game function
        const originalStartGame = window.startGame;
        
        window.startGameWithWeb3 = () => {
            if (this.web3Auth.isConnected) {
                // Set player name to wallet address
                const playerNameInput = document.getElementById('playerNameInput');
                if (playerNameInput) {
                    playerNameInput.value = `Player_${this.web3Auth.address.slice(-4)}`;
                }
                
                // Start the original game
                if (originalStartGame) {
                    originalStartGame('player');
                }
                
                this.gameStarted = true;
                this.onGameStart();
            } else {
                this.authUI.show();
            }
        };

        // Modify the original start button to use Web3
        const startButton = document.getElementById('startButton');
        if (startButton) {
            const originalOnClick = startButton.onclick;
            startButton.onclick = (e) => {
                e.preventDefault();
                
                if (this.web3Auth.isConnected) {
                    // Use original logic but with Web3 integration
                    const playerNameInput = document.getElementById('playerNameInput');
                    const nickErrorText = document.querySelector('#startMenu .input-error');
                    
                    if (this.validNick(playerNameInput.value)) {
                        nickErrorText.style.opacity = 0;
                        window.startGameWithWeb3();
                    } else {
                        nickErrorText.style.opacity = 1;
                    }
                } else {
                    this.authUI.show();
                }
            };
        }

        // Add Web3 login button to the start menu
        this.addWeb3LoginButton();
    }

    /**
     * Add Web3 login button to the start menu
     */
    addWeb3LoginButton() {
        const startMenu = document.getElementById('startMenu');
        if (startMenu) {
            const web3Button = document.createElement('button');
            web3Button.id = 'web3LoginButton';
            web3Button.innerHTML = '🔗 Web3 登录';
            web3Button.style.cssText = `
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                margin: 10px 0;
                transition: all 0.2s;
                width: 200px;
            `;
            
            web3Button.addEventListener('click', () => {
                this.authUI.show();
            });
            
            web3Button.addEventListener('mouseenter', () => {
                web3Button.style.transform = 'translateY(-2px)';
                web3Button.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
            });
            
            web3Button.addEventListener('mouseleave', () => {
                web3Button.style.transform = 'translateY(0)';
                web3Button.style.boxShadow = 'none';
            });

            // Insert after the settings button
            const settingsButton = document.getElementById('settingsButton');
            if (settingsButton) {
                settingsButton.parentNode.insertBefore(web3Button, settingsButton.nextSibling);
            } else {
                startMenu.appendChild(web3Button);
            }
        }
    }

    /**
     * Setup wallet status display
     */
    setupWalletStatus() {
        // Create wallet status element
        const walletStatus = document.createElement('div');
        walletStatus.id = 'walletStatus';
        walletStatus.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            z-index: 1000;
            display: none;
            max-width: 200px;
        `;
        
        document.body.appendChild(walletStatus);

        // Update status when connection changes
        this.web3Auth.on('connected', (data) => {
            this.updateWalletStatus(data);
        });

        this.web3Auth.on('disconnected', () => {
            this.hideWalletStatus();
        });

        this.web3Auth.on('chainChanged', (chainId) => {
            this.updateNetworkStatus(chainId);
        });
    }

    /**
     * Update wallet status display
     */
    updateWalletStatus(data) {
        const walletStatus = document.getElementById('walletStatus');
        if (walletStatus) {
            const isCorrectNetwork = data.chainId === parseInt(this.web3Auth.config.MONAD_TESTNET.chainId, 16);
            const networkStatus = isCorrectNetwork ? '✅ Monad Testnet' : '⚠️ 错误网络';
            
            walletStatus.innerHTML = `
                <div style="margin-bottom: 4px;">
                    🔗 ${data.address.slice(0, 6)}...${data.address.slice(-4)}
                </div>
                <div style="font-size: 10px; opacity: 0.8;">
                    ${networkStatus}
                </div>
            `;
            walletStatus.style.display = 'block';
        }
    }

    /**
     * Update network status
     */
    updateNetworkStatus(chainId) {
        const walletStatus = document.getElementById('walletStatus');
        if (walletStatus && this.web3Auth.isConnected) {
            const isCorrectNetwork = chainId === parseInt(this.web3Auth.config.MONAD_TESTNET.chainId, 16);
            const networkStatus = isCorrectNetwork ? '✅ Monad Testnet' : '⚠️ 错误网络';
            
            const addressDiv = walletStatus.querySelector('div');
            if (addressDiv) {
                const networkDiv = addressDiv.nextElementSibling;
                if (networkDiv) {
                    networkDiv.innerHTML = networkStatus;
                }
            }
        }
    }

    /**
     * Hide wallet status
     */
    hideWalletStatus() {
        const walletStatus = document.getElementById('walletStatus');
        if (walletStatus) {
            walletStatus.style.display = 'none';
        }
    }

    /**
     * Check for auto-login
     */
    async checkAutoLogin() {
        const savedAddress = localStorage.getItem(this.web3Auth.config.STORAGE_KEYS.WALLET_ADDRESS);
        const lastLogin = localStorage.getItem(this.web3Auth.config.STORAGE_KEYS.LAST_LOGIN);
        
        // Auto-login if logged in within the last 24 hours
        if (savedAddress && lastLogin) {
            const timeDiff = Date.now() - parseInt(lastLogin);
            const twentyFourHours = 24 * 60 * 60 * 1000;
            
            if (timeDiff < twentyFourHours) {
                try {
                    await this.web3Auth.checkExistingConnection();
                } catch (error) {
                    console.warn('Auto-login failed:', error);
                }
            }
        }
    }

    /**
     * Handle game start
     */
    onGameStart() {
        // Add Web3 features to the game
        this.addGameFeatures();
        
        // Setup reward claiming
        this.setupRewardClaiming();
        
        // Setup NFT integration
        this.setupNFTIntegration();
    }

    /**
     * Add Web3 features to the game
     */
    addGameFeatures() {
        // Add logout button to game UI
        const gameArea = document.getElementById('gameAreaWrapper');
        if (gameArea) {
            const logoutBtn = document.createElement('button');
            logoutBtn.innerHTML = '🚪 退出';
            logoutBtn.style.cssText = `
                position: fixed;
                top: 50px;
                right: 10px;
                background: rgba(255, 0, 0, 0.8);
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                cursor: pointer;
                z-index: 1000;
            `;
            
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
            
            gameArea.appendChild(logoutBtn);
        }
    }

    /**
     * Setup reward claiming functionality
     */
    setupRewardClaiming() {
        // This would integrate with the GameRewards contract
        // For now, we'll add a placeholder button
        
        if (this.web3Auth.contracts.GameRewards) {
            // Add claim rewards button
            const claimBtn = document.createElement('button');
            claimBtn.innerHTML = '🎁 领取奖励';
            claimBtn.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                background: rgba(0, 255, 0, 0.8);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 14px;
                cursor: pointer;
                z-index: 1000;
            `;
            
            claimBtn.addEventListener('click', () => {
                this.claimRewards();
            });
            
            document.body.appendChild(claimBtn);
        }
    }

    /**
     * Setup NFT integration
     */
    setupNFTIntegration() {
        // This would integrate with the BubbleSkinNFT contract
        // Add NFT skin selection, etc.
        console.log('NFT integration ready');
    }

    /**
     * Claim rewards from smart contract
     */
    async claimRewards() {
        try {
            if (!this.web3Auth.contracts.GameRewards) {
                alert('游戏奖励合约未连接');
                return;
            }

            // This would implement actual reward claiming logic
            alert('奖励领取功能即将推出！');
            
        } catch (error) {
            console.error('Failed to claim rewards:', error);
            alert('领取奖励失败: ' + error.message);
        }
    }

    /**
     * Logout and disconnect wallet
     */
    logout() {
        this.web3Auth.disconnect();
        this.gameStarted = false;
        
        // Return to start menu
        document.getElementById('gameAreaWrapper').style.opacity = 0;
        document.getElementById('startMenuWrapper').style.maxHeight = '1000px';
        
        // Clear player name
        const playerNameInput = document.getElementById('playerNameInput');
        if (playerNameInput) {
            playerNameInput.value = '';
        }
        
        // Remove game-specific Web3 elements
        const logoutBtn = document.querySelector('button[style*="position: fixed"][style*="top: 50px"]');
        if (logoutBtn) {
            logoutBtn.remove();
        }
        
        const claimBtn = document.querySelector('button[style*="position: fixed"][style*="bottom: 10px"]');
        if (claimBtn) {
            claimBtn.remove();
        }
    }

    /**
     * Validate nickname (from original game)
     */
    validNick(nick) {
        const regex = /^\w*$/;
        return regex.exec(nick) !== null;
    }

    /**
     * Show Web3 unavailable message
     */
    showWeb3UnavailableMessage() {
        const web3Button = document.getElementById('web3LoginButton');
        if (web3Button) {
            web3Button.innerHTML = '⚠️ Web3 不可用';
            web3Button.disabled = true;
            web3Button.style.opacity = '0.5';
            web3Button.title = 'Web3库加载失败，请刷新页面重试';
        }
    }

    /**
     * Show Web3 error message
     */
    showWeb3ErrorMessage(error) {
        console.error('Web3 initialization error:', error);

        const web3Button = document.getElementById('web3LoginButton');
        if (web3Button) {
            web3Button.innerHTML = '❌ Web3 错误';
            web3Button.disabled = true;
            web3Button.style.opacity = '0.5';
            web3Button.title = `Web3初始化失败: ${error.message}`;
        }
    }

    /**
     * Get Web3 authentication status
     */
    getAuthStatus() {
        return {
            isInitialized: this.isInitialized,
            isConnected: this.web3Auth ? this.web3Auth.isConnected : false,
            address: this.web3Auth ? this.web3Auth.address : null,
            chainId: this.web3Auth ? this.web3Auth.chainId : null,
            gameStarted: this.gameStarted,
            ethersAvailable: typeof window.ethers !== 'undefined'
        };
    }
}

// Initialize Web3 integration when script loads
if (typeof window !== 'undefined') {
    window.BubbleBrawlWeb3 = BubbleBrawlWeb3;
    
    // Auto-initialize
    window.bubbleBrawlWeb3 = new BubbleBrawlWeb3();
}

// Export for Node.js use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BubbleBrawlWeb3;
}
