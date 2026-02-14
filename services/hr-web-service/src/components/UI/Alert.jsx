import { clsx } from 'clsx'

export default function Alert({ 
  children, 
  variant = 'info',
  className = '' 
}) {
  const variants = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }

  return (
    <div className={clsx('p-4 rounded-lg border', variants[variant], className)}>
      {children}
    </div>
  )
}


