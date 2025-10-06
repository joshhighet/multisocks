import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import type { TorHostWithCircuits } from '../types'
import { formatBytes } from '../lib/utils'
import { 
  Server, 
  Activity, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Globe,
  Clock,
  Zap,
  Shield,
  ArrowRight
} from 'lucide-react'

interface TorHostsTableProps {
  torHosts: TorHostWithCircuits[]
}

export function TorHostsTable({ torHosts }: TorHostsTableProps) {
  const getStatusIcon = (host: TorHostWithCircuits) => {
    if (host.error) return <XCircle className="h-4 w-4 text-red-500" />
    if (host.circuits.length === 0) return <AlertCircle className="h-4 w-4 text-yellow-500" />
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  const getStatusText = (host: TorHostWithCircuits) => {
    if (host.error) return 'Error'
    if (host.circuits.length === 0) return 'No Circuits'
    return 'Active'
  }

  const getStatusVariant = (host: TorHostWithCircuits) => {
    if (host.error) return 'destructive'
    if (host.circuits.length === 0) return 'secondary'
    return 'default'
  }

  const getActiveCircuits = (host: TorHostWithCircuits) => {
    return host.circuits.filter(c => c.purpose !== 'CLOSED').length
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Tor Hosts ({torHosts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {torHosts.map((host) => {
            const activeCircuits = getActiveCircuits(host)
            const lastCircuit = host.circuits[0]
            const lastLocation = lastCircuit?.path[lastCircuit.path.length - 1]?.location
            
            return (
              <div
                key={host.id}
                className="border rounded-lg p-4 space-y-4 hover:bg-muted/50 transition-colors"
              >
                {/* Host Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(host)}
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        {host.hostname}
                        <Badge variant={getStatusVariant(host)} className="text-xs">
                          {getStatusText(host)}
                        </Badge>
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {host.ip_address} • {host.state}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {activeCircuits} / {host.circuits.length} circuits
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Active / Total
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {host.error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                    <p className="text-sm text-red-600 dark:text-red-400">{host.error}</p>
                  </div>
                )}

                {/* Circuit Details */}
                {host.circuits.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Active Circuits:</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {host.circuits.slice(0, 6).map((circuit) => (
                        <div
                          key={circuit.circuit_id}
                          className="bg-muted/50 rounded-lg p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm font-medium">
                              {circuit.circuit_id.slice(0, 8)}
                            </span>
                            <Badge 
                              variant={circuit.purpose === 'CLOSED' ? 'secondary' : 'default'}
                              className="text-xs"
                            >
                              {circuit.purpose}
                            </Badge>
                          </div>
                          
                          {circuit.path.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">
                                Path ({circuit.path.length} nodes):
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                {circuit.path.slice(0, 3).map((node, idx) => (
                                  <div key={node.fingerprint} className="flex items-center gap-1">
                                    <Shield className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-mono">
                                      {node.nickname || node.fingerprint.slice(0, 4)}
                                    </span>
                                    {idx < Math.min(circuit.path.length, 3) - 1 && (
                                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </div>
                                ))}
                                {circuit.path.length > 3 && (
                                  <span className="text-muted-foreground">...</span>
                                )}
                              </div>
                              
                              {lastLocation && lastLocation.country !== 'unknown' && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>
                                    {lastLocation.city}, {lastLocation.country}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {host.circuits.length > 6 && (
                      <div className="text-center">
                        <Badge variant="outline" className="text-xs">
                          +{host.circuits.length - 6} more circuits
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* No Circuits State */}
                {host.circuits.length === 0 && !host.error && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No circuits established</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}