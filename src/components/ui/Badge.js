import clsx from 'clsx'

const variants = {
  gray: 'bg-slate-100 text-slate-600',
  green: 'bg-green-100 text-green-700',
  slate: 'bg-slate-200 text-slate-500',
  blue: 'bg-blue-100 text-blue-700',
  red: 'bg-red-100 text-red-600',
  yellow: 'bg-yellow-100 text-yellow-700',
}

export function Badge({ variant = 'gray', className, children }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
