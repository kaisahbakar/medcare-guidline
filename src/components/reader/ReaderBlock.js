function ReaderBlock({ block }) {
  const text = block?.content_json?.text ?? ''
  const style = {
    color: block?.text_color || undefined,
    backgroundColor: block?.background_color || undefined,
  }

  if (block?.block_type === 'heading_1') {
    return (
      <h1 className="text-3xl font-semibold text-slate-900" style={style}>
        {text}
      </h1>
    )
  }

  if (block?.block_type === 'heading_2') {
    return (
      <h2 className="text-2xl font-semibold text-slate-900" style={style}>
        {text}
      </h2>
    )
  }

  if (block?.block_type === 'heading_3') {
    return (
      <h3 className="text-xl font-semibold text-slate-900" style={style}>
        {text}
      </h3>
    )
  }

  if (block?.block_type === 'bulleted_list') {
    return (
      <ul className="list-disc space-y-2 pl-6 text-slate-700" style={style}>
        <li>{text}</li>
      </ul>
    )
  }

  if (block?.block_type === 'numbered_list') {
    return (
      <ol className="list-decimal space-y-2 pl-6 text-slate-700" style={style}>
        <li>{text}</li>
      </ol>
    )
  }

  if (block?.block_type === 'callout') {
    return (
      <div
        className="rounded-md border-l-4 border-slate-400 bg-slate-100 px-4 py-3 text-slate-700"
        style={style}
      >
        <p className="text-sm uppercase tracking-wide text-slate-500">
          {block?.content_json?.icon || 'Note'}
        </p>
        <p className="mt-1">{text}</p>
      </div>
    )
  }

  if (block?.block_type === 'divider') {
    return <hr className="border-slate-200" />
  }

  if (block?.block_type === 'media') {
    return (
      <img
        src={block?.file_url}
        alt={text || 'Manual media'}
        className="max-w-full rounded-lg"
        style={style}
      />
    )
  }

  return (
    <p className="leading-7 text-slate-700" style={style}>
      {text}
    </p>
  )
}

export default ReaderBlock
