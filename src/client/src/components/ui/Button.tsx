import React from 'react'
import clsx from 'clsx'
import type { ButtonProps } from '../../types'

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl focus:ring-purple-500',
    secondary: 'bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 focus:ring-white/50',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl focus:ring-red-500',
    ghost: 'bg-transparent hover:bg-white/10 text-white border border-transparent hover:border-white/20 focus:ring-white/50',
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    {
      'transform hover:scale-105': !disabled && !loading,
      'cursor-wait': loading,
    },
    className
  )

  return (
    <button
      type={type}
      className={classes}
      style={{ cursor: 'pointer'}}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>加载中...</span>
        </div>
      ) : (
        children
      )}
    </button>
  )
}
