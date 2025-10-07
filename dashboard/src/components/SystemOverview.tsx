import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import type { DashboardData } from '../types'
import { formatBytes, formatLatency } from '../lib/utils'
import { apiClient } from '../lib/api'
import { useToast } from './ui/toast'
import { 
  Activity, 
  Globe, 
  Zap, 
  Shield, 
  Clock, 
  TrendingUp,
  Server,
  ArrowRight,
  ChevronDown,
  RefreshCw
} from 'lucide-react'
import { useState } from 'react'

interface SystemOverviewProps {
  data: DashboardData
}

export function SystemOverview({ data }: SystemOverviewProps) {
  const { summary, torHosts } = data
  const [expandedHosts, setExpandedHosts] = useState<Set<string>>(new Set())
  const [showAllHosts, setShowAllHosts] = useState(true) // Show all hosts by default
  const { addToast } = useToast()
  
  const healthyHosts = torHosts.filter(h => !h.error && h.circuits.length > 0)

  const toggleHostExpansion = (hostId: string) => {
    const newExpanded = new Set(expandedHosts)
    if (newExpanded.has(hostId)) {
      newExpanded.delete(hostId)
    } else {
      newExpanded.add(hostId)
    }
    setExpandedHosts(newExpanded)
  }

  const handleRebuildCircuits = async (hostId: string) => {
    try {
      const result = await apiClient.rebuildHostCircuits(hostId)
      addToast({
        type: 'success',
        title: 'Circuits Rebuilt',
        description: result.message
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Rebuild Failed',
        description: error instanceof Error ? error.message : 'Failed to rebuild circuits'
      })
    }
  }

  const handleRebuildAllCircuits = async () => {
    try {
      const result = await apiClient.rebuildAllCircuits()
      addToast({
        type: 'success',
        title: 'All Circuits Rebuilt',
        description: `Rebuilt circuits for ${result.results.length} hosts`
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Rebuild Failed',
        description: error instanceof Error ? error.message : 'Failed to rebuild all circuits'
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics - Top Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowAllHosts(!showAllHosts)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {healthyHosts.length}/{torHosts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Healthy hosts • Click to view all
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
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

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
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

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
            <div className="flex flex-col items-center space-y-2 min-w-[140px] hover:scale-105 transition-transform cursor-pointer">
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
            <div className="flex flex-col items-center space-y-2 min-w-[140px] hover:scale-105 transition-transform cursor-pointer">
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
            <div className="flex flex-col items-center space-y-2 min-w-[140px] hover:scale-105 transition-transform cursor-pointer" onClick={() => setShowAllHosts(!showAllHosts)}>
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
            <div className="flex flex-col items-center space-y-2 min-w-[140px] hover:scale-105 transition-transform cursor-pointer">
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

      {/* Host Status Summary - Improved Layout */}
      <div className="space-y-4">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Tor Hosts ({torHosts.length})</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllHosts(!showAllHosts)}
            >
              {showAllHosts ? "Show Less" : "Show All"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRebuildAllCircuits}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Rebuild All
            </Button>
          </div>
        </div>

        {/* Hosts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(showAllHosts ? torHosts : torHosts.slice(0, 6)).map((host) => {
    const isHealthy = !host.error && host.circuits.length > 0
    const isError = !!host.error
            
            return (
              <Card 
                key={host.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isHealthy ? 'border-green-200 dark:border-green-800' :
                  isError ? 'border-red-200 dark:border-red-800' :
                  'border-yellow-200 dark:border-yellow-800'
                }`}
                onClick={() => toggleHostExpansion(host.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        isHealthy ? 'bg-green-500' :
                        isError ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`}></div>
                      <CardTitle className="text-sm">{host.hostname}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRebuildCircuits(host.id)
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Circuits</span>
                      <Badge variant={isHealthy ? "default" : "secondary"} className="text-xs">
                        {host.circuits.length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Status</span>
                      <span className={`text-xs font-medium ${
                        isHealthy ? 'text-green-600' :
                        isError ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {isHealthy ? 'Healthy' : isError ? 'Error' : 'No Circuits'}
                      </span>
                    </div>
                    {host.external_ip && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>External IP</span>
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {host.external_ip}
                        </span>
                      </div>
                    )}
                    {host.error && (
                      <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        {host.error}
                      </div>
                    )}
                    {expandedHosts.has(host.id) && (
                      <div className="mt-2 pt-2 border-t space-y-1">
                        <div className="text-xs text-muted-foreground">
                          <div>Internal IP: {host.ip_address}</div>
                          <div>Image: {host.image}</div>
                          <div>State: {host.state}</div>
                        </div>
                        {host.circuits.length > 0 && (
                          <div className="text-xs">
                            <div className="font-medium mb-1">Recent Circuits:</div>
                            {host.circuits.slice(0, 2).map((circuit) => (
                              <div key={circuit.circuit_id} className="text-muted-foreground">
                                Circuit {circuit.circuit_id} - {circuit.purpose}
                              </div>
                            ))}
                            {host.circuits.length > 2 && (
                              <button
                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Toggle showing all circuits for this host
                                  const newExpanded = new Set(expandedHosts)
                                  if (newExpanded.has(host.id + '_circuits')) {
                                    newExpanded.delete(host.id + '_circuits')
                                  } else {
                                    newExpanded.add(host.id + '_circuits')
                                  }
                                  setExpandedHosts(newExpanded)
                                }}
                              >
                                +{host.circuits.length - 2} more...
                              </button>
                            )}
                            {expandedHosts.has(host.id + '_circuits') && (
                              <div className="mt-1 space-y-1">
                                {host.circuits.slice(2).map((circuit) => (
                                  <div key={circuit.circuit_id} className="text-muted-foreground">
                                    Circuit {circuit.circuit_id} - {circuit.purpose}
                                  </div>
                                ))}
                                <button
                                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const newExpanded = new Set(expandedHosts)
                                    newExpanded.delete(host.id + '_circuits')
                                    setExpandedHosts(newExpanded)
                                  }}
                                >
                                  Show less
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {!expandedHosts.has(host.id) && (
                      <div className="flex items-center justify-center text-xs text-muted-foreground">
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {!showAllHosts && torHosts.length > 6 && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setShowAllHosts(true)}
              className="text-sm"
            >
              +{torHosts.length - 6} more hosts
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}