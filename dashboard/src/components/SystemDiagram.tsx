import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import type { TorHostWithCircuits } from '../types'
import { 
  ArrowRight, 
  Server, 
  Globe, 
  Shield, 
  MapPin,
  Activity,
  Zap
} from 'lucide-react'

interface SystemDiagramProps {
  torHosts: TorHostWithCircuits[]
}

export function SystemDiagram({ torHosts }: SystemDiagramProps) {
  const totalCircuits = torHosts.reduce((sum, host) => sum + host.circuits.length, 0)
  const activeCircuits = torHosts.reduce((sum, host) => 
    sum + host.circuits.filter(c => c.purpose !== 'CLOSED').length, 0
  )
  const healthyHosts = torHosts.filter(host => !host.error && host.circuits.length > 0).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Architecture
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Flow Diagram */}
          <div className="flex items-center justify-center space-x-4 overflow-x-auto py-4">
            {/* Ingress */}
            <div className="flex flex-col items-center space-y-2 min-w-[120px]">
              <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-sm">SOCKS5 Ingress</h3>
                <p className="text-xs text-muted-foreground">Port 8080</p>
              </div>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

            {/* HAProxy Load Balancer */}
            <div className="flex flex-col items-center space-y-2 min-w-[120px]">
              <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-sm">HAProxy</h3>
                <p className="text-xs text-muted-foreground">Load Balancer</p>
              </div>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

            {/* Tor Hosts */}
            <div className="flex flex-col items-center space-y-2 min-w-[120px]">
              <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-lg border-2 border-green-200 dark:border-green-800">
                <Server className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-sm">{torHosts.length} Tor Hosts</h3>
                <p className="text-xs text-muted-foreground">{healthyHosts} healthy</p>
              </div>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

            {/* Circuits */}
            <div className="flex flex-col items-center space-y-2 min-w-[120px]">
              <div className="bg-purple-100 dark:bg-purple-900/20 p-4 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-sm">{totalCircuits} Circuits</h3>
                <p className="text-xs text-muted-foreground">{activeCircuits} active</p>
              </div>
            </div>
          </div>

          {/* Host Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {torHosts.map((host, index) => (
              <div
                key={host.id}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{host.hostname}</span>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    host.error 
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      : host.circuits.length > 0
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {host.error ? 'Error' : host.circuits.length > 0 ? 'Active' : 'No Circuits'}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {host.ip_address}
                </div>
                
                {host.circuits.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium">Circuits:</div>
                    <div className="flex flex-wrap gap-1">
                      {host.circuits.slice(0, 3).map((circuit) => (
                        <div
                          key={circuit.circuit_id}
                          className="bg-muted/50 px-2 py-1 rounded text-xs font-mono"
                        >
                          {circuit.circuit_id.slice(0, 6)}
                        </div>
                      ))}
                      {host.circuits.length > 3 && (
                        <div className="bg-muted/50 px-2 py-1 rounded text-xs">
                          +{host.circuits.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {host.circuits.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {host.circuits[0]?.path[host.circuits[0].path.length - 1]?.location.country || 'Unknown'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
