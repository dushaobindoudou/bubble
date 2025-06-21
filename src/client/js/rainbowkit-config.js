/**
 * RainbowKit Configuration for Bubble Brawl
 * Configures wallet connectors and Monad Testnet
 */

class RainbowKitConfig {
    constructor() {
        this.config = null;
        this.wagmiConfig = null;
        this.queryClient = null;
        this.isInitialized = false;
    }

    /**
     * Initialize RainbowKit with Monad Testnet configuration
     */
    async init() {
        try {
            console.log('🌈 Initializing RainbowKit...');

            // Check if required libraries are available
            if (typeof window.RainbowKit === 'undefined' || 
                typeof window.wagmi === 'undefined' || 
                typeof window.viem === 'undefined') {
                throw new Error('Required libraries (RainbowKit, Wagmi, Viem) not loaded');
            }

            // Define Monad Testnet
            const monadTestnet = {
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
            };

            // Configure chains
            const { chains, publicClient, webSocketPublicClient } = window.wagmi.configureChains(
                [monadTestnet],
                [
                    window.wagmi.publicProvider(),
                    window.wagmi.jsonRpcProvider({
                        rpc: (chain) => ({
                            http: 'https://testnet-rpc.monad.xyz',
                        }),
                    }),
                ]
            );

            // Configure connectors
            const { connectors } = window.RainbowKit.getDefaultWallets({
                appName: 'Bubble Brawl',
                projectId: 'bubble-brawl-web3-game', // You should get a real project ID from WalletConnect
                chains,
            });

            // Create Wagmi config
            this.wagmiConfig = window.wagmi.createConfig({
                autoConnect: true,
                connectors,
                publicClient,
                webSocketPublicClient,
            });

            // Create query client
            this.queryClient = new window.TanStackReactQuery.QueryClient();

            // Configure RainbowKit theme
            const theme = window.RainbowKit.lightTheme({
                accentColor: '#667eea',
                accentColorForeground: 'white',
                borderRadius: 'medium',
                fontStack: 'system',
                overlayBlur: 'small',
            });

            // Store configuration
            this.config = {
                chains,
                theme,
                monadTestnet,
                connectors,
            };

            this.isInitialized = true;
            console.log('✅ RainbowKit initialized successfully');
            
            return this.config;

        } catch (error) {
            console.error('❌ Failed to initialize RainbowKit:', error);
            throw error;
        }
    }

    /**
     * Create and render RainbowKit connect button
     */
    renderConnectButton(containerId) {
        if (!this.isInitialized) {
            throw new Error('RainbowKit not initialized. Call init() first.');
        }

        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with ID '${containerId}' not found`);
        }

        try {
            // Create connect button using RainbowKit
            const connectButton = window.RainbowKit.ConnectButton.Custom({
                children: ({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;

                    return React.createElement('div', {
                        style: { display: ready ? 'block' : 'none' }
                    }, [
                        !connected ? React.createElement('button', {
                            key: 'connect',
                            onClick: openConnectModal,
                            className: 'rainbowkit-connect-btn',
                            style: {
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '16px',
                                padding: '16px 32px',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                                fontFamily: 'Orbitron, sans-serif',
                            }
                        }, '🔗 连接钱包') : React.createElement('div', {
                            key: 'connected',
                            style: {
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                justifyContent: 'center'
                            }
                        }, [
                            chain.unsupported ? React.createElement('button', {
                                key: 'wrong-network',
                                onClick: openChainModal,
                                style: {
                                    background: '#ff4757',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '12px 20px',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                }
                            }, '⚠️ 错误网络') : React.createElement('button', {
                                key: 'chain',
                                onClick: openChainModal,
                                style: {
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '12px',
                                    padding: '8px 16px',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                }
                            }, `${chain.name}`),
                            React.createElement('button', {
                                key: 'account',
                                onClick: openAccountModal,
                                style: {
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '12px',
                                    padding: '8px 16px',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                }
                            }, `${account.displayName}`)
                        ])
                    ]);
                }
            });

            // Render the button
            ReactDOM.render(connectButton, container);

        } catch (error) {
            console.error('❌ Failed to render connect button:', error);
            
            // Fallback: create a simple button
            container.innerHTML = `
                <button class="rainbowkit-fallback-btn" onclick="window.rainbowKitConfig.showFallbackModal()">
                    🔗 连接钱包
                </button>
            `;
        }
    }

    /**
     * Show fallback modal when RainbowKit fails
     */
    showFallbackModal() {
        alert('RainbowKit 加载失败，请刷新页面重试或使用游客模式。');
    }

    /**
     * Get current connection status
     */
    getConnectionStatus() {
        if (!this.wagmiConfig) {
            return { connected: false, account: null, chain: null };
        }

        try {
            const account = window.wagmi.useAccount();
            const network = window.wagmi.useNetwork();
            
            return {
                connected: account.isConnected,
                account: account.address,
                chain: network.chain,
                isCorrectNetwork: network.chain?.id === 10143
            };
        } catch (error) {
            console.warn('Failed to get connection status:', error);
            return { connected: false, account: null, chain: null };
        }
    }

    /**
     * Switch to Monad Testnet
     */
    async switchToMonadTestnet() {
        if (!this.config) {
            throw new Error('RainbowKit not initialized');
        }

        try {
            const { switchNetwork } = window.wagmi.useSwitchNetwork();
            if (switchNetwork) {
                await switchNetwork(10143);
            }
        } catch (error) {
            console.error('Failed to switch network:', error);
            throw error;
        }
    }

    /**
     * Disconnect wallet
     */
    async disconnect() {
        try {
            const { disconnect } = window.wagmi.useDisconnect();
            if (disconnect) {
                await disconnect();
            }
        } catch (error) {
            console.error('Failed to disconnect:', error);
            throw error;
        }
    }

    /**
     * Get wallet client for transactions
     */
    async getWalletClient() {
        if (!this.wagmiConfig) {
            throw new Error('Wagmi not configured');
        }

        try {
            const walletClient = await window.wagmi.getWalletClient();
            return walletClient;
        } catch (error) {
            console.error('Failed to get wallet client:', error);
            throw error;
        }
    }

    /**
     * Get public client for reading
     */
    getPublicClient() {
        if (!this.wagmiConfig) {
            throw new Error('Wagmi not configured');
        }

        try {
            const publicClient = window.wagmi.getPublicClient();
            return publicClient;
        } catch (error) {
            console.error('Failed to get public client:', error);
            throw error;
        }
    }
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.RainbowKitConfig = RainbowKitConfig;
}

// Export for Node.js use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RainbowKitConfig;
}
