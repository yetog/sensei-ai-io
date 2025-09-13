import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'purple';
}

export function LoadingSpinner({ 
  className, 
  size = 'md', 
  variant = 'default' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const variantClasses = {
    default: 'text-primary',
    purple: 'text-primary animate-pulse-purple'
  };

  return (
    <div className={cn(
      'animate-spin rounded-full border-2 border-current border-t-transparent',
      sizeClasses[size],
      variantClasses[variant],
      className
    )} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px] animate-fade-in">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" variant="purple" />
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

export function ButtonLoader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <LoadingSpinner size="sm" />
      {children}
    </div>
  );
}