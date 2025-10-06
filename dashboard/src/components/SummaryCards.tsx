import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import type { SystemSummary } from '../types'
import { formatBytes, formatLatency } from '../lib/utils'
import { 
  Activity, 
  Globe, 
  Zap, 
  Shield, 
  Clock, 
  TrendingUp 
} from 'lucide-react'

interface SummaryCardsProps {
  summary: SystemSummary
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      title: 'Active Circuits',
      value: summary.activeCircuits,
      total: summary.totalCircuits,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Sessions',
      value: summary.totalSessions.toLocaleString(),
      icon: Globe,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Data Transferred',
      value: formatBytes(summary.totalBytesOut),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Avg Latency',
      value: formatLatency(summary.averageLatency),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Healthy Backends',
      value: `${summary.healthyBackends}/${summary.totalBackends}`,
      icon: Shield,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Throughput',
      value: formatBytes(summary.totalBytesIn),
      icon: Zap,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.total && (
                <p className="text-xs text-muted-foreground">
                  of {card.total} total circuits
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}