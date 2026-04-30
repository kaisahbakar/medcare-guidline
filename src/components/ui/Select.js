import clsx from 'clsx'

export function Select({ label, id, className, error, children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={id}
        className={clsx(
          'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900',
          'focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200',
          'disabled:bg-slate-50 disabled:text-slate-500',
          error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
