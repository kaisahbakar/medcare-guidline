function EmptyState({ icon: Icon, title, message, children }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
      {Icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-slate-100">
          <Icon className="size-6 text-slate-400" />
        </div>
      )}
      <div className="space-y-1">
        {title && <p className="text-sm font-medium text-slate-700">{title}</p>}
        {message && <p className="text-sm text-slate-400">{message}</p>}
      </div>
      {children}
    </div>
  )
}

export default EmptyState
