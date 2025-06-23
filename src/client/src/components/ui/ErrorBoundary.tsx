import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center border border-white/20">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              哎呀，出错了！
            </h2>
            <p className="text-white/90 mb-6">
              应用程序遇到了意外错误。请刷新页面重试。
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-6">
                <summary className="text-white/80 cursor-pointer mb-2">
                  错误详情
                </summary>
                <pre className="text-xs text-red-300 bg-black/20 p-3 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
              >
                🔄 刷新页面
              </button>
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-xl border border-white/30 hover:border-white/50 transition-all duration-300"
              >
                🏠 返回首页
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
