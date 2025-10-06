import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import type { DashboardData } from '../types'
import { formatBytes, formatLatency } from '../lib/utils'
import { 
  Activity, 
  Globe, 
  Zap, 
  Shield, 
  Clock, 
  TrendingUp,
  Server,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react'

interface SystemOverviewProps {
  data: DashboardData
}

export function SystemOverview({ data }: SystemOverviewProps) {
  const { summary, torHosts } = data
  
  const healthyHosts = torHosts.filter(h => !h.error && h.circuits.length > 0)
  const errorHosts = torHosts.filter(h => h.error)
  const noCircuitHosts = torHosts.filter(h => !h.error && h.circuits.length === 0)

  return (
    <div className="space-y-6">
      {/* Key Metrics - Top Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {healthyHosts.length}/{torHosts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Healthy hosts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Circuits</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.activeCircuits}
            </div>
            <p className="text-xs text-muted-foreground">
              of {summary.totalCircuits} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatBytes(summary.totalBytesOut)}
            </div>
            <p className="text-xs text-muted-foreground">
              Data transferred
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatLatency(summary.averageLatency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Architecture Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            System Architecture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-8 overflow-x-auto py-6">
            {/* SOCKS5 Ingress */}
            <div className="flex flex-col items-center space-y-2 min-w-[140px]">
              <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-sm">SOCKS5 Ingress</h3>
                <p className="text-xs text-muted-foreground">Port 8080</p>
                <Badge variant="default" className="mt-1">Active</Badge>
              </div>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

            {/* HAProxy */}
            <div className="flex flex-col items-center space-y-2 min-w-[140px]">
              <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-sm">HAProxy</h3>
                <p className="text-xs text-muted-foreground">Load Balancer</p>
                <Badge variant="default" className="mt-1">Running</Badge>
              </div>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

            {/* Tor Hosts */}
            <div className="flex flex-col items-center space-y-2 min-w-[140px]">
              <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-lg border-2 border-green-200 dark:border-green-800">
                <Server className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-sm">Tor Hosts</h3>
                <p className="text-xs text-muted-foreground">{healthyHosts.length} healthy</p>
                <Badge variant={healthyHosts.length > 0 ? "default" : "destructive"} className="mt-1">
                  {healthyHosts.length > 0 ? "Active" : "Offline"}
                </Badge>
              </div>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

            {/* Circuits */}
            <div className="flex flex-col items-center space-y-2 min-w-[140px]">
              <div className="bg-purple-100 dark:bg-purple-900/20 p-4 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-sm">Circuits</h3>
                <p className="text-xs text-muted-foreground">{summary.activeCircuits} active</p>
                <Badge variant={summary.activeCircuits > 0 ? "default" : "secondary"} className="mt-1">
                  {summary.activeCircuits > 0 ? "Connected" : "Building"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Host Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Healthy Hosts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Healthy Hosts ({healthyHosts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthyHosts.slice(0, 3).map((host) => (
                <div key={host.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{host.hostname}</span>
                  <Badge variant="default" className="text-xs">
                    {host.circuits.length} circuits
                  </Badge>
                </div>
              ))}
              {healthyHosts.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{healthyHosts.length - 3} more hosts
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Hosts */}
        {errorHosts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Error Hosts ({errorHosts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {errorHosts.slice(0, 3).map((host) => (
                  <div key={host.id} className="text-sm">
                    <div className="font-medium">{host.hostname}</div>
                    <div className="text-xs text-red-600">{host.error}</div>
                  </div>
                ))}
                {errorHosts.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{errorHosts.length - 3} more errors
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Circuit Hosts */}
        {noCircuitHosts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="h-5 w-5" />
                No Circuits ({noCircuitHosts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {noCircuitHosts.slice(0, 3).map((host) => (
                  <div key={host.id} className="text-sm">
                    <div className="font-medium">{host.hostname}</div>
                    <div className="text-xs text-muted-foreground">Building circuits...</div>
                  </div>
                ))}
                {noCircuitHosts.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{noCircuitHosts.length - 3} more hosts
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
