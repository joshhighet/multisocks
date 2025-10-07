import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import type { DashboardData } from '../types'
import { apiClient } from '../lib/api'
import { useToast } from './ui/toast'
import { 
  Shield, 
  MapPin, 
  Clock, 
  Activity,
  Globe,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'

interface CircuitMonitorProps {
  data: DashboardData
}

export function CircuitMonitor({ data }: CircuitMonitorProps) {
  const { torHosts } = data
  const [expandedCircuits, setExpandedCircuits] = useState<Set<string>>(new Set())
  const [showClosedCircuits, setShowClosedCircuits] = useState(false)
  const [selectedHost, setSelectedHost] = useState<string | null>(null)
  const { addToast } = useToast()

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

  const filteredCircuits = selectedHost 
    ? allCircuits.filter(c => c.hostId === selectedHost)
    : showClosedCircuits 
      ? allCircuits 
      : activeCircuits

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

  const toggleCircuitExpansion = (circuitId: string) => {
    const newExpanded = new Set(expandedCircuits)
    if (newExpanded.has(circuitId)) {
      newExpanded.delete(circuitId)
    } else {
      newExpanded.add(circuitId)
    }
    setExpandedCircuits(newExpanded)
  }

  const handleRebuildCircuit = async (_circuitId: string, hostId: string) => {
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

  const handleCloseCircuit = async (circuitId: string, hostId: string) => {
    try {
      const result = await apiClient.closeCircuit(circuitId, hostId)
      addToast({
        type: 'success',
        title: 'Circuit Closed',
        description: result.message
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Close Failed',
        description: error instanceof Error ? error.message : 'Failed to close circuit'
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
      {/* Circuit Statistics with Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedHost(null)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Circuits</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{circuitStats.total}</div>
            <p className="text-xs text-muted-foreground">All circuits</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedHost(null)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{circuitStats.active}</div>
            <p className="text-xs text-muted-foreground">Ready for traffic</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedHost(null)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Building</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{circuitStats.building}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedHost(null)}>
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

      {/* Circuit Purpose Breakdown with Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Circuit Purpose Breakdown
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClosedCircuits(!showClosedCircuits)}
              >
                {showClosedCircuits ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {showClosedCircuits ? 'Hide' : 'Show'} Closed
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRebuildAllCircuits}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Rebuild All
              </Button>
            </div>
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

      {/* Host Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Filter by Host
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedHost === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedHost(null)}
            >
              All Hosts
            </Button>
            {torHosts.map((host) => (
              <Button
                key={host.id}
                variant={selectedHost === host.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedHost(host.id)}
              >
                {host.hostname} ({host.circuits.length})
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Circuit Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Circuit Details
            {selectedHost && (
              <Badge variant="outline">
                {torHosts.find(h => h.id === selectedHost)?.hostname}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCircuits.length > 0 ? (
            <div className="space-y-4">
              {filteredCircuits.map((circuit) => (
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
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm text-muted-foreground">
                        {circuit.path.length} nodes
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCircuitExpansion(circuit.circuit_id)}
                      >
                        {expandedCircuits.has(circuit.circuit_id) ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                      </Button>
                    </div>
                  </div>
                  
                  {/* Circuit Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRebuildCircuit(circuit.circuit_id, circuit.hostId)}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Rebuild
                    </Button>
                    {circuit.purpose !== 'CLOSED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCloseCircuit(circuit.circuit_id, circuit.hostId)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Close
                      </Button>
                    )}
                  </div>
                  
                  {/* Expanded Circuit Path Visualization */}
                  {expandedCircuits.has(circuit.circuit_id) && (
                    <div className="space-y-2 pt-2 border-t">
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
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No circuits found</p>
              <p className="text-sm">
                {selectedHost ? 'Try selecting a different host' : 'Circuits may be building or all hosts are offline'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}