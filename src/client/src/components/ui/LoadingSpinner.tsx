import React from 'react'
import clsx from 'clsx'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  color?: 'white' | 'purple' | 'blue'
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  color = 'white',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  const colorClasses = {
    white: 'border-white/30 border-t-white',
    purple: 'border-purple-300 border-t-purple-600',
    blue: 'border-blue-300 border-t-blue-600',
  }

  const classes = clsx(
    'rounded-full animate-spin',
    sizeClasses[size],
    colorClasses[color],
    className
  )

  return <div className={classes} />
}
