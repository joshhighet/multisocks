import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import type { TorHostWithCircuits } from '../types'
import { MapPin, Globe, Shield, Clock, ArrowRight, Activity } from 'lucide-react'

interface CircuitVisualizationProps {
  torHosts: TorHostWithCircuits[]
}

export function CircuitVisualization({ torHosts }: CircuitVisualizationProps) {
  const allCircuits = torHosts.flatMap(host => 
    host.circuits.map(circuit => ({
      ...circuit,
      hostname: host.hostname,
      hostId: host.id,
      hostError: host.error
    }))
  )

  const activeCircuits = allCircuits.filter(circuit => 
    circuit.purpose !== 'CLOSED' && circuit.path.length > 0
  )

  const closedCircuits = allCircuits.filter(circuit => 
    circuit.purpose === 'CLOSED'
  )

  const circuitStats = {
    total: allCircuits.length,
    active: activeCircuits.length,
    closed: closedCircuits.length,
    byPurpose: allCircuits.reduce((acc, circuit) => {
      acc[circuit.purpose] = (acc[circuit.purpose] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  return (
    <div className="space-y-6">
      {/* Circuit Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Circuit Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{circuitStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Circuits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{circuitStats.active}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{circuitStats.closed}</div>
              <div className="text-sm text-muted-foreground">Closed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{torHosts.length}</div>
              <div className="text-sm text-muted-foreground">Hosts</div>
            </div>
          </div>
          
          {Object.keys(circuitStats.byPurpose).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">By Purpose:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(circuitStats.byPurpose).map(([purpose, count]) => (
                  <Badge key={purpose} variant="outline" className="text-xs">
                    {purpose}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCircuits.map((circuit, index) => (
                <div
                  key={`${circuit.hostId}-${circuit.circuit_id}`}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Circuit {circuit.circuit_id.slice(0, 8)}
                    </h4>
                    <Badge variant="default" className="text-xs">
                      {circuit.purpose}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Host: {circuit.hostname}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs font-medium">Path ({circuit.path.length} nodes):</div>
                    <div className="space-y-1">
                      {circuit.path.map((node, nodeIndex) => (
                        <div
                          key={node.fingerprint}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono">
                              {node.nickname || node.fingerprint.slice(0, 8)}
                            </span>
                          </div>
                          
                          {node.location.country !== 'unknown' && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>
                                {node.location.city}, {node.location.country}
                              </span>
                            </div>
                          )}
                          
                          {nodeIndex < circuit.path.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Purpose: {circuit.purpose}</span>
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
    </div>
  )
}