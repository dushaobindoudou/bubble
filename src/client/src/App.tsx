import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

// Page components
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import BubbleDemo from './pages/BubbleDemo'
import { ManagerPage } from './pages/ManagerPage'
import { Store } from './components/pages/Store'

// Utility functions
// import { initializeLegacyGame } from './utils/gameIntegration'

const App: React.FC = () => {
  const { isAuthenticated, isLoading, session } = useAuth()
  const location = useLocation()

  // Initialize legacy game integration when needed
  useEffect(() => {
    if (location.pathname === '/game' && isAuthenticated) {
      // Initialize the legacy game integration
    //   initializeLegacyGame(session)
    }
  }, [location.pathname, isAuthenticated, session])

  // Show loading spinner during authentication check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <Routes>
          {/* Login route - accessible when not authenticated */}
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <LoginPage />
              ) : (
                <Navigate to="/home" replace />
              )
            }
          />

          {/* Home route - requires authentication */}
          <Route
            path="/home"
            element={
              isAuthenticated ? (
                <HomePage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Game route - requires authentication */}
          <Route
            path="/game"
            element={
              isAuthenticated ? (
                <GamePage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Store route - requires authentication */}
          <Route
            path="/store"
            element={
              isAuthenticated ? (
                <Store />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Manager route - requires authentication and admin permissions */}
          <Route
            path="/manager"
            element={
              isAuthenticated ? (
                <ManagerPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Demo route - public access */}
          <Route
            path="/demo"
            element={<BubbleDemo />}
          />



          {/* Root redirect */}
          <Route
            path="/"
            element={
              <Navigate
                to={isAuthenticated ? "/home" : "/login"}
                replace
              />
            }
          />

          {/* Catch all - redirect to appropriate page */}
          <Route
            path="*"
            element={
              <Navigate
                to={isAuthenticated ? "/home" : "/login"}
                replace
              />
            }
          />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

export default App
