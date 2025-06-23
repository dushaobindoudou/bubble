import type { Session } from '../types'

export class SessionManager {
  private sessionKey = 'bubble_brawl_session'
  private sessionDuration = 24 * 60 * 60 * 1000 // 24 hours
  private currentSession: Session | null = null

  constructor() {
    this.loadSession()
    this.setupSessionCleanup()
  }

  /**
   * Create a new session
   */
  createSession(sessionData: {
    address?: string | undefined
    chainId?: number | undefined
    loginMethod: 'wallet' | 'guest'
    isGuest: boolean
    timestamp: number
  }): Session {
    const session: Session = {
      id: this.generateSessionId(),
      address: sessionData.address,
      chainId: sessionData.chainId,
      loginMethod: sessionData.loginMethod,
      isGuest: sessionData.isGuest,
      timestamp: sessionData.timestamp,
      expiresAt: sessionData.timestamp + this.sessionDuration,
      userAgent: navigator.userAgent,
      ip: undefined, // Would be set by server in production
      lastActivity: Date.now(),
    }

    this.currentSession = session
    this.saveSession()
    return session
  }

  /**
   * Load session from storage
   */
  private loadSession(): Session | null {
    try {
      const sessionData = localStorage.getItem(this.sessionKey)
      if (!sessionData) {
        return null
      }

      const session = JSON.parse(sessionData) as Session
      
      if (this.isSessionValid(session)) {
        this.currentSession = session
        this.updateLastActivity()
        return session
      } else {
        this.clearSession()
        return null
      }
    } catch (error) {
      console.error('Failed to load session:', error)
      this.clearSession()
      return null
    }
  }

  /**
   * Save session to storage
   */
  private saveSession(): void {
    try {
      if (!this.currentSession) {
        return
      }
      localStorage.setItem(this.sessionKey, JSON.stringify(this.currentSession))
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }

  /**
   * Update existing session
   */
  updateSession(updates: Partial<Session>): void {
    if (!this.currentSession) {
      return
    }

    this.currentSession = {
      ...this.currentSession,
      ...updates,
      lastActivity: Date.now(),
    }
    
    this.saveSession()
  }

  /**
   * Clear session
   */
  clearSession(): void {
    try {
      this.currentSession = null
      localStorage.removeItem(this.sessionKey)
      
      // Clear other related data
      const keysToRemove = [
        'bubble_brawl_wallet_address',
        'bubble_brawl_wallet_type',
        'bubble_brawl_auth_token',
        'bubble_brawl_user_preferences',
        'bubble_brawl_last_login',
      ]

      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error('Failed to clear session:', error)
    }
  }

  /**
   * Check if session is valid
   */
  isSessionValid(session: Session | null): boolean {
    if (!session) {
      return false
    }

    // Check required fields
    if (!session.id || !session.timestamp || !session.expiresAt) {
      return false
    }

    // Check expiration
    if (Date.now() > session.expiresAt) {
      return false
    }

    // Check session age (max 7 days regardless of activity)
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
    if (Date.now() - session.timestamp > maxAge) {
      return false
    }

    return true
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    if (this.currentSession && this.isSessionValid(this.currentSession)) {
      return this.currentSession
    }
    return null
  }

  /**
   * Update last activity timestamp
   */
  updateLastActivity(): void {
    if (this.currentSession) {
      this.currentSession.lastActivity = Date.now()
      this.saveSession()
    }
  }

  /**
   * Extend session expiration
   */
  extendSession(): void {
    if (this.currentSession) {
      this.currentSession.expiresAt = Date.now() + this.sessionDuration
      this.updateLastActivity()
    }
  }

  /**
   * Get time remaining in session
   */
  getTimeRemaining(): number {
    if (!this.currentSession) {
      return 0
    }
    return Math.max(0, this.currentSession.expiresAt - Date.now())
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36)
    const randomPart = Math.random().toString(36).substr(2, 9)
    return `bb_${timestamp}_${randomPart}`
  }

  /**
   * Setup automatic session cleanup
   */
  private setupSessionCleanup(): void {
    // Check session validity every 5 minutes
    setInterval(() => {
      if (this.currentSession && !this.isSessionValid(this.currentSession)) {
        console.log('Session expired, clearing...')
        this.clearSession()
        
        // Trigger page reload to redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }, 5 * 60 * 1000) // 5 minutes

    // Update activity on user interaction
    const activityEvents = ['click', 'keypress', 'scroll', 'mousemove']
    let lastActivityUpdate = 0
    
    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        const now = Date.now()
        // Throttle activity updates to once per minute
        if (now - lastActivityUpdate > 60000) {
          this.updateLastActivity()
          lastActivityUpdate = now
        }
      }, { passive: true })
    })
  }

  /**
   * Get authentication headers for API requests
   */
  getAuthHeaders(): Record<string, string> {
    if (!this.currentSession || !this.isSessionValid(this.currentSession)) {
      return {}
    }

    return {
      'Authorization': `Bearer ${this.currentSession.id}`,
      'X-Session-Address': this.currentSession.address || '',
      'X-Session-Chain': this.currentSession.chainId?.toString() || '',
      'X-Login-Method': this.currentSession.loginMethod,
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getCurrentSession()
  }

  /**
   * Check if user is guest
   */
  isGuest(): boolean {
    return this.currentSession?.isGuest ?? false
  }

  /**
   * Check if user has Web3 wallet connected
   */
  hasWalletConnected(): boolean {
    return !!(this.currentSession?.address && this.currentSession.loginMethod === 'wallet')
  }
}
