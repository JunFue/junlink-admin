import { CashPositionCard } from './CashPositionCard'
import { PaymentMixChart } from './PaymentMixChart'

export function LiquiditySection() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <CashPositionCard />
      <PaymentMixChart />
    </div>
  )
}
