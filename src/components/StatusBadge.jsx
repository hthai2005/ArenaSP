import { STATUS_META } from '../data/mock'

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, tone: 'muted' }
  return <span className={`badge badge-${meta.tone}`}>{meta.label}</span>
}
