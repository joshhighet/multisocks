import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import type { DashboardData } from '../types'
import { 
  Shield, 
  MapPin, 
  Clock, 
  Activity,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react'

interface CircuitMonitorProps {
  data: DashboardData
}

export function CircuitMonitor({ data }: CircuitMonitorProps) {
  const { torHosts, summary } = data

  const allCircuits = torHosts.flatMap(host => 
    host.circuits.map(circuit => ({
      ...circuit,
      hostname: host.hostname,
      hostId: host.id,
      hostError: host.error
    }))
  )

  const activeCircuits = allCircuits.filter(c => c.purpose !== 'CLOSED' && c.path.length > 0)
  const closedCircuits = allCircuits.filter(c => c.purpose === 'CLOSED')
  const buildingCircuits = allCircuits.filter(c => c.purpose === 'BUILDING')

  const circuitStats = {
    total: allCircuits.length,
    active: activeCircuits.length,
    closed: closedCircuits.length,
    building: buildingCircuits.length,
    byPurpose: allCircuits.reduce((acc, circuit) => {
      acc[circuit.purpose] = (acc[circuit.purpose] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  const getCircuitStatusIcon = (purpose: string) => {
    switch (purpose) {
      case 'CLOSED': return <XCircle className="h-4 w-4 text-red-500" />
      case 'BUILDING': return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
      default: return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getCircuitStatusColor = (purpose: string) => {
    switch (purpose) {
      case 'CLOSED': return 'destructive'
      case 'BUILDING': return 'secondary'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-6">
      {/* Circuit Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Circuits</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{circuitStats.total}</div>
            <p className="text-xs text-muted-foreground">All circuits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{circuitStats.active}</div>
            <p className="text-xs text-muted-foreground">Ready for traffic</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Building</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{circuitStats.building}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{circuitStats.closed}</div>
            <p className="text-xs text-muted-foreground">Terminated</p>
          </CardContent>
        </Card>
      </div>

      {/* Circuit Purpose Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Circuit Purpose Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(circuitStats.byPurpose).map(([purpose, count]) => (
              <Badge key={purpose} variant={getCircuitStatusColor(purpose)} className="text-sm">
                {purpose}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Circuits Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Active Circuit Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeCircuits.length > 0 ? (
            <div className="space-y-4">
              {activeCircuits.map((circuit) => (
                <div
                  key={`${circuit.hostId}-${circuit.circuit_id}`}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getCircuitStatusIcon(circuit.purpose)}
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          Circuit {circuit.circuit_id.slice(0, 8)}
                          <Badge variant={getCircuitStatusColor(circuit.purpose)} className="text-xs">
                            {circuit.purpose}
                          </Badge>
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Host: {circuit.hostname}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {circuit.path.length} nodes
                    </div>
                  </div>
                  
                  {/* Circuit Path Visualization */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Circuit Path:</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {circuit.path.map((node, nodeIndex) => (
                        <div key={node.fingerprint} className="flex items-center gap-1">
                          <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded text-xs">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono">
                              {node.nickname || node.fingerprint.slice(0, 6)}
                            </span>
                          </div>
                          
                          {node.location.country !== 'unknown' && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{node.location.country}</span>
                            </div>
                          )}
                          
                          {nodeIndex < circuit.path.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active circuits found</p>
              <p className="text-sm">Circuits may be building or all hosts are offline</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Circuit Health by Host */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Circuit Health by Host
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {torHosts.map((host) => {
              const hostCircuits = host.circuits
              const activeHostCircuits = hostCircuits.filter(c => c.purpose !== 'CLOSED')
              const closedHostCircuits = hostCircuits.filter(c => c.purpose === 'CLOSED')
              
              return (
                <div key={host.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        host.error ? 'bg-red-500' : 
                        activeHostCircuits.length > 0 ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <span className="font-medium">{host.hostname}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{activeHostCircuits.length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span>{closedHostCircuits.length}</span>
                      </div>
                    </div>
                  </div>
                  
                  {host.error ? (
                    <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      {host.error}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {hostCircuits.slice(0, 6).map((circuit) => (
                        <div
                          key={circuit.circuit_id}
                          className="flex items-center justify-between bg-muted/50 p-2 rounded text-xs"
                        >
                          <div className="flex items-center gap-1">
                            {getCircuitStatusIcon(circuit.purpose)}
                            <span className="font-mono">{circuit.circuit_id.slice(0, 6)}</span>
                          </div>
                          <Badge variant={getCircuitStatusColor(circuit.purpose)} className="text-xs">
                            {circuit.purpose}
                          </Badge>
                        </div>
                      ))}
                      {hostCircuits.length > 6 && (
                        <div className="flex items-center justify-center bg-muted/50 p-2 rounded text-xs text-muted-foreground">
                          +{hostCircuits.length - 6} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
