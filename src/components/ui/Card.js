import clsx from 'clsx'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-slate-200 bg-white p-6 shadow-sm',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
