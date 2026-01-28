import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantClasses = {
    default: 'bg-blue-600 text-white',
    secondary: 'bg-gray-100 text-gray-900',
    outline: 'border border-gray-300 bg-white',
    destructive: 'bg-red-600 text-white',
  }

  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variantClasses[variant]} ${className || ''}`}
      {...props}
    />
  )
}

export { Badge }
