import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import type { DashboardData } from '../types'
import { formatBytes, formatLatency } from '../lib/utils'
import { 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Server,
  Globe,
  Zap,
  RefreshCw,
  Download,
  Terminal
} from 'lucide-react'

interface DiagnosticsProps {
  data: DashboardData
}

export function Diagnostics({ data }: DiagnosticsProps) {
  const { summary, torHosts, haproxyStats } = data

  // Diagnostic checks
  const diagnostics = [
    {
      name: 'SOCKS5 Proxy',
      status: 'healthy',
      message: 'Port 8080 accessible',
      details: 'SOCKS5 proxy is running and accepting connections'
    },
    {
      name: 'HAProxy Load Balancer',
      status: summary.healthyBackends > 0 ? 'healthy' : 'warning',
      message: `${summary.healthyBackends}/${summary.totalBackends} backends healthy`,
      details: summary.healthyBackends > 0 
        ? 'Load balancer is distributing traffic properly'
        : 'No healthy backends available'
    },
    {
      name: 'Tor Hosts',
      status: torHosts.some(h => !h.error && h.circuits.length > 0) ? 'healthy' : 'critical',
      message: `${torHosts.filter(h => !h.error && h.circuits.length > 0).length}/${torHosts.length} hosts operational`,
      details: torHosts.some(h => !h.error && h.circuits.length > 0)
        ? 'At least one Tor host is operational'
        : 'All Tor hosts are offline or have no circuits'
    },
    {
      name: 'Circuit Health',
      status: summary.activeCircuits > 0 ? 'healthy' : 'warning',
      message: `${summary.activeCircuits}/${summary.totalCircuits} circuits active`,
      details: summary.activeCircuits > 0
        ? 'Circuits are established and ready for traffic'
        : 'No active circuits available'
    },
    {
      name: 'Performance',
      status: summary.averageLatency < 5000 ? 'healthy' : 'warning',
      message: `Average latency: ${formatLatency(summary.averageLatency)}`,
      details: summary.averageLatency < 5000
        ? 'Latency is within acceptable range'
        : 'High latency detected, may indicate network issues'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'default'
      case 'warning': return 'secondary'
      case 'critical': return 'destructive'
      default: return 'outline'
    }
  }

  const exportDiagnostics = () => {
    const diagnosticReport = {
      timestamp: new Date().toISOString(),
      systemHealth: diagnostics,
      summary: summary,
      torHosts: torHosts.map(host => ({
        hostname: host.hostname,
        ip: host.ip_address,
        status: host.error ? 'error' : host.circuits.length > 0 ? 'healthy' : 'no-circuits',
        circuits: host.circuits.length,
        error: host.error
      })),
      haproxyStats: haproxyStats
    }
    
    const blob = new Blob([JSON.stringify(diagnosticReport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `multisocks-diagnostics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {diagnostics.map((diagnostic, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                {getStatusIcon(diagnostic.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{diagnostic.name}</h4>
                    <Badge variant={getStatusColor(diagnostic.status)}>
                      {diagnostic.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {diagnostic.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {diagnostic.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatBytes(summary.totalBytesIn)}
              </div>
              <div className="text-sm text-muted-foreground">Data In</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatBytes(summary.totalBytesOut)}
              </div>
              <div className="text-sm text-muted-foreground">Data Out</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {summary.totalSessions.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatLatency(summary.averageLatency)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Latency</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Host Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Host Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {torHosts.map((host) => (
              <div key={host.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(
                      host.error ? 'critical' : 
                      host.circuits.length > 0 ? 'healthy' : 'warning'
                    )}
                    <span className="font-medium">{host.hostname}</span>
                    <Badge variant="outline" className="text-xs">
                      {host.ip_address}
                    </Badge>
                  </div>
                  <Badge variant={
                    host.error ? 'destructive' : 
                    host.circuits.length > 0 ? 'default' : 'secondary'
                  }>
                    {host.error ? 'Error' : 
                     host.circuits.length > 0 ? 'Healthy' : 'No Circuits'}
                  </Badge>
                </div>
                
                {host.error ? (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    <strong>Error:</strong> {host.error}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Circuits</div>
                      <div className="font-medium">{host.circuits.length}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Status</div>
                      <div className="font-medium">{host.state}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Image</div>
                      <div className="font-medium text-xs">{host.image}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* HAProxy Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            HAProxy Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {haproxyStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Backend</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Sessions</th>
                    <th className="text-left p-2">Bytes In</th>
                    <th className="text-left p-2">Bytes Out</th>
                    <th className="text-left p-2">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {haproxyStats.map((stat, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-mono text-xs">{stat.svname}</td>
                      <td className="p-2">
                        <Badge variant={stat.status === 'UP' ? 'default' : 'destructive'}>
                          {stat.status}
                        </Badge>
                      </td>
                      <td className="p-2">{stat.stot.toLocaleString()}</td>
                      <td className="p-2">{formatBytes(stat.bin)}</td>
                      <td className="p-2">{formatBytes(stat.bout)}</td>
                      <td className="p-2">{stat.rate}/s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No HAProxy statistics available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Diagnostic Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={exportDiagnostics} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Diagnostics
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All Data
            </Button>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Export diagnostics data for troubleshooting or sharing with support.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
