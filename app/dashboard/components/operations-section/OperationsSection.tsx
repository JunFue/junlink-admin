import { QuickActions } from './QuickActions'
import { ActivityFeed } from './ActivityFeed'

export function OperationsSection() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <QuickActions />
      <div className="lg:col-span-2">
        <ActivityFeed />
      </div>
    </div>
  )
}
