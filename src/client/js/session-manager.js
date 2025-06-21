/**
 * Session Manager for Bubble Brawl
 * Handles authentication sessions and persistence
 */

class SessionManager {
    constructor() {
        this.sessionKey = 'bubble_brawl_session';
        this.sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
        this.currentSession = null;
        
        this.init();
    }

    /**
     * Initialize session manager
     */
    init() {
        console.log('📝 Initializing Session Manager...');
        
        // Load existing session
        this.loadSession();
        
        // Setup session cleanup
        this.setupSessionCleanup();
        
        console.log('✅ Session Manager initialized');
    }

    /**
     * Create a new session
     */
    createSession(sessionData) {
        try {
            const session = {
                id: this.generateSessionId(),
                address: sessionData.address,
                chainId: sessionData.chainId,
                loginMethod: sessionData.loginMethod,
                isGuest: sessionData.isGuest || false,
                timestamp: Date.now(),
                expiresAt: Date.now() + this.sessionDuration,
                userAgent: navigator.userAgent,
                ip: null, // Would be set by server in production
                lastActivity: Date.now()
            };

            // Store session
            this.currentSession = session;
            this.saveSession();

            console.log('✅ Session created:', {
                id: session.id,
                address: session.address,
                loginMethod: session.loginMethod,
                isGuest: session.isGuest
            });

            return session;

        } catch (error) {
            console.error('❌ Failed to create session:', error);
            throw error;
        }
    }

    /**
     * Load session from storage
     */
    loadSession() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            if (!sessionData) {
                console.log('📝 No existing session found');
                return null;
            }

            const session = JSON.parse(sessionData);
            
            // Validate session
            if (this.isSessionValid(session)) {
                this.currentSession = session;
                this.updateLastActivity();
                console.log('✅ Valid session loaded:', {
                    id: session.id,
                    address: session.address,
                    loginMethod: session.loginMethod
                });
                return session;
            } else {
                console.log('⚠️ Invalid session found, clearing...');
                this.clearSession();
                return null;
            }

        } catch (error) {
            console.error('❌ Failed to load session:', error);
            this.clearSession();
            return null;
        }
    }

    /**
     * Save session to storage
     */
    saveSession() {
        try {
            if (!this.currentSession) {
                return;
            }

            localStorage.setItem(this.sessionKey, JSON.stringify(this.currentSession));
            console.log('💾 Session saved');

        } catch (error) {
            console.error('❌ Failed to save session:', error);
        }
    }

    /**
     * Clear session
     */
    clearSession() {
        try {
            this.currentSession = null;
            localStorage.removeItem(this.sessionKey);
            
            // Clear other related data
            const keysToRemove = [
                'bubble_brawl_wallet_address',
                'bubble_brawl_wallet_type',
                'bubble_brawl_auth_token',
                'bubble_brawl_user_preferences',
                'bubble_brawl_last_login'
            ];

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });

            console.log('🗑️ Session cleared');

        } catch (error) {
            console.error('❌ Failed to clear session:', error);
        }
    }

    /**
     * Check if session is valid
     */
    isSessionValid(session) {
        if (!session) {
            return false;
        }

        // Check required fields
        if (!session.id || !session.timestamp || !session.expiresAt) {
            console.log('❌ Session missing required fields');
            return false;
        }

        // Check expiration
        if (Date.now() > session.expiresAt) {
            console.log('⏰ Session expired');
            return false;
        }

        // Check session age (max 7 days regardless of activity)
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        if (Date.now() - session.timestamp > maxAge) {
            console.log('📅 Session too old');
            return false;
        }

        return true;
    }

    /**
     * Check if user has valid session
     */
    hasValidSession() {
        return this.currentSession && this.isSessionValid(this.currentSession);
    }

    /**
     * Get current session
     */
    getCurrentSession() {
        if (this.hasValidSession()) {
            return this.currentSession;
        }
        return null;
    }

    /**
     * Update last activity timestamp
     */
    updateLastActivity() {
        if (this.currentSession) {
            this.currentSession.lastActivity = Date.now();
            this.saveSession();
        }
    }

    /**
     * Extend session expiration
     */
    extendSession() {
        if (this.currentSession) {
            this.currentSession.expiresAt = Date.now() + this.sessionDuration;
            this.updateLastActivity();
            console.log('⏰ Session extended');
        }
    }

    /**
     * Get session info for display
     */
    getSessionInfo() {
        if (!this.currentSession) {
            return null;
        }

        return {
            id: this.currentSession.id,
            address: this.currentSession.address,
            chainId: this.currentSession.chainId,
            loginMethod: this.currentSession.loginMethod,
            isGuest: this.currentSession.isGuest,
            createdAt: new Date(this.currentSession.timestamp).toLocaleString(),
            expiresAt: new Date(this.currentSession.expiresAt).toLocaleString(),
            lastActivity: new Date(this.currentSession.lastActivity).toLocaleString(),
            timeRemaining: this.getTimeRemaining()
        };
    }

    /**
     * Get time remaining in session
     */
    getTimeRemaining() {
        if (!this.currentSession) {
            return 0;
        }

        const remaining = this.currentSession.expiresAt - Date.now();
        return Math.max(0, remaining);
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substr(2, 9);
        return `bb_${timestamp}_${randomPart}`;
    }

    /**
     * Setup automatic session cleanup
     */
    setupSessionCleanup() {
        // Check session validity every 5 minutes
        setInterval(() => {
            if (this.currentSession && !this.isSessionValid(this.currentSession)) {
                console.log('🧹 Cleaning up expired session');
                this.clearSession();
                
                // Redirect to login if on game page
                if (window.location.pathname.includes('index.html')) {
                    console.log('🔄 Redirecting to login due to expired session');
                    window.location.href = 'login.html';
                }
            }
        }, 5 * 60 * 1000); // 5 minutes

        // Update activity on user interaction
        const activityEvents = ['click', 'keypress', 'scroll', 'mousemove'];
        let lastActivityUpdate = 0;
        
        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                const now = Date.now();
                // Throttle activity updates to once per minute
                if (now - lastActivityUpdate > 60000) {
                    this.updateLastActivity();
                    lastActivityUpdate = now;
                }
            }, { passive: true });
        });
    }

    /**
     * Validate session against server (placeholder)
     */
    async validateSessionWithServer() {
        // In a real implementation, this would validate the session with the server
        // For now, we'll just return the local validation
        return this.hasValidSession();
    }

    /**
     * Get authentication headers for API requests
     */
    getAuthHeaders() {
        if (!this.hasValidSession()) {
            return {};
        }

        return {
            'Authorization': `Bearer ${this.currentSession.id}`,
            'X-Session-Address': this.currentSession.address || '',
            'X-Session-Chain': this.currentSession.chainId || '',
            'X-Login-Method': this.currentSession.loginMethod
        };
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.hasValidSession();
    }

    /**
     * Check if user is guest
     */
    isGuest() {
        return this.currentSession && this.currentSession.isGuest;
    }

    /**
     * Check if user has Web3 wallet connected
     */
    hasWalletConnected() {
        return this.currentSession && 
               this.currentSession.address && 
               this.currentSession.loginMethod === 'wallet';
    }

    /**
     * Get user address
     */
    getUserAddress() {
        return this.currentSession ? this.currentSession.address : null;
    }

    /**
     * Get user chain ID
     */
    getUserChainId() {
        return this.currentSession ? this.currentSession.chainId : null;
    }

    /**
     * Export session data (for debugging)
     */
    exportSessionData() {
        return {
            currentSession: this.currentSession,
            sessionKey: this.sessionKey,
            sessionDuration: this.sessionDuration,
            isValid: this.hasValidSession(),
            timeRemaining: this.getTimeRemaining()
        };
    }
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.SessionManager = SessionManager;
}

// Export for Node.js use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionManager;
}
