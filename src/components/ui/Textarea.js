import clsx from 'clsx'

export function Textarea({ label, id, className, error, rows = 3, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={clsx(
          'w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400',
          'focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200',
          'disabled:bg-slate-50 disabled:text-slate-500',
          error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
