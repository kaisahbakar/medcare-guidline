import { Badge } from './Badge'

const statusConfig = {
  draft: { variant: 'gray', label: 'Draft' },
  published: { variant: 'green', label: 'Published' },
  archived: { variant: 'slate', label: 'Archived' },
}

export function StatusBadge({ status }) {
  const config = statusConfig[status] ?? { variant: 'gray', label: status }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
