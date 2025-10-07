import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import type { DashboardData } from '../types'
import { formatBytes } from '../lib/utils'
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  Globe,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface NetworkTrafficProps {
  data: DashboardData
}

interface TrafficDataPoint {
  timestamp: number
  bytesIn: number
  bytesOut: number
  sessions: number
  latency: number
}

export function NetworkTraffic({ data }: NetworkTrafficProps) {
  const [trafficHistory, setTrafficHistory] = useState<TrafficDataPoint[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set())
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1m' | '5m' | '15m' | '1h'>('5m')

  // Simulate real-time traffic updates
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      const now = Date.now()
      const newPoint: TrafficDataPoint = {
        timestamp: now,
        bytesIn: data.summary.totalBytesIn + Math.random() * 1000000,
        bytesOut: data.summary.totalBytesOut + Math.random() * 1000000,
        sessions: data.summary.totalSessions + Math.floor(Math.random() * 10),
        latency: data.summary.averageLatency + (Math.random() - 0.5) * 50
      }
      
      setTrafficHistory(prev => {
        const updated = [...prev, newPoint].slice(-20) // Keep last 20 points
        setIsAnimating(true)
        setTimeout(() => setIsAnimating(false), 500)
        return updated
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [data.summary, isPaused])

  const currentTraffic = trafficHistory[trafficHistory.length - 1] || {
    bytesIn: data.summary.totalBytesIn,
    bytesOut: data.summary.totalBytesOut,
    sessions: data.summary.totalSessions,
    latency: data.summary.averageLatency
  }

  const previousTraffic = trafficHistory[trafficHistory.length - 2] || currentTraffic

  const bytesInRate = currentTraffic.bytesIn - previousTraffic.bytesIn
  const bytesOutRate = currentTraffic.bytesOut - previousTraffic.bytesOut
  const sessionsRate = currentTraffic.sessions - previousTraffic.sessions
  const latencyChange = currentTraffic.latency - previousTraffic.latency

  const toggleMetricExpansion = (metric: string) => {
    const newExpanded = new Set(expandedMetrics)
    if (newExpanded.has(metric)) {
      newExpanded.delete(metric)
    } else {
      newExpanded.add(metric)
    }
    setExpandedMetrics(newExpanded)
  }

  const resetTrafficData = () => {
    setTrafficHistory([])
  }

  return (
    <div className="space-y-6">
      {/* Real-time Traffic Metrics with Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`hover:shadow-md transition-all cursor-pointer ${isAnimating ? 'animate-pulse' : ''}`} onClick={() => toggleMetricExpansion('bytesIn')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data In</CardTitle>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              {expandedMetrics.has('bytesIn') ? 
                <ChevronDown className="h-3 w-3" /> : 
                <ChevronRight className="h-3 w-3" />
              }
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatBytes(currentTraffic.bytesIn)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              {formatBytes(bytesInRate)}/s
            </div>
            {expandedMetrics.has('bytesIn') && (
              <div className="mt-2 text-xs text-muted-foreground">
                <div>Peak: {formatBytes(Math.max(...trafficHistory.map(t => t.bytesIn), data.summary.totalBytesIn))}</div>
                <div>Avg: {formatBytes(trafficHistory.reduce((sum, t) => sum + t.bytesIn, 0) / Math.max(trafficHistory.length, 1))}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`hover:shadow-md transition-all cursor-pointer ${isAnimating ? 'animate-pulse' : ''}`} onClick={() => toggleMetricExpansion('bytesOut')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Out</CardTitle>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              {expandedMetrics.has('bytesOut') ? 
                <ChevronDown className="h-3 w-3" /> : 
                <ChevronRight className="h-3 w-3" />
              }
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatBytes(currentTraffic.bytesOut)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              {formatBytes(bytesOutRate)}/s
            </div>
            {expandedMetrics.has('bytesOut') && (
              <div className="mt-2 text-xs text-muted-foreground">
                <div>Peak: {formatBytes(Math.max(...trafficHistory.map(t => t.bytesOut), data.summary.totalBytesOut))}</div>
                <div>Avg: {formatBytes(trafficHistory.reduce((sum, t) => sum + t.bytesOut, 0) / Math.max(trafficHistory.length, 1))}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`hover:shadow-md transition-all cursor-pointer ${isAnimating ? 'animate-pulse' : ''}`} onClick={() => toggleMetricExpansion('sessions')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              {expandedMetrics.has('sessions') ? 
                <ChevronDown className="h-3 w-3" /> : 
                <ChevronRight className="h-3 w-3" />
              }
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {currentTraffic.sessions.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {sessionsRate > 0 ? '+' : ''}{sessionsRate} new
            </div>
            {expandedMetrics.has('sessions') && (
              <div className="mt-2 text-xs text-muted-foreground">
                <div>Peak: {Math.max(...trafficHistory.map(t => t.sessions), data.summary.totalSessions).toLocaleString()}</div>
                <div>Avg: {Math.round(trafficHistory.reduce((sum, t) => sum + t.sessions, 0) / Math.max(trafficHistory.length, 1)).toLocaleString()}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`hover:shadow-md transition-all cursor-pointer ${isAnimating ? 'animate-pulse' : ''}`} onClick={() => toggleMetricExpansion('latency')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latency</CardTitle>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {expandedMetrics.has('latency') ? 
                <ChevronDown className="h-3 w-3" /> : 
                <ChevronRight className="h-3 w-3" />
              }
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {currentTraffic.latency.toFixed(0)}ms
            </div>
            <div className={`flex items-center text-xs ${
              latencyChange > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {latencyChange > 0 ? '+' : ''}{latencyChange.toFixed(0)}ms
            </div>
            {expandedMetrics.has('latency') && (
              <div className="mt-2 text-xs text-muted-foreground">
                <div>Peak: {Math.max(...trafficHistory.map(t => t.latency), data.summary.averageLatency).toFixed(0)}ms</div>
                <div>Avg: {(trafficHistory.reduce((sum, t) => sum + t.latency, 0) / Math.max(trafficHistory.length, 1)).toFixed(0)}ms</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Traffic Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Traffic Monitoring Controls
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetTrafficData}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset Data
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Time Range:</span>
              <div className="flex gap-1">
                {(['1m', '5m', '15m', '1h'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={selectedTimeRange === range ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
              <span className="text-sm text-muted-foreground">
                {isPaused ? 'Paused' : 'Live Updates'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traffic Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Traffic Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Ingress Flow */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                <span className="font-medium">SOCKS5 Ingress</span>
                <Badge variant="outline">Port 8080</Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-8 h-8 border-2 border-dashed border-muted-foreground rounded-full flex items-center justify-center">
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* HAProxy Distribution */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium">HAProxy Load Balancer</span>
                <Badge variant="outline">{data.summary.healthyBackends}/{data.summary.totalBackends} backends</Badge>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: data.summary.healthyBackends }).map((_, i) => (
                  <div 
                    key={i} 
                    className="w-2 h-2 bg-green-500 rounded-full animate-ping" 
                    style={{ animationDelay: `${i * 0.1}s` }} 
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-8 h-8 border-2 border-dashed border-muted-foreground rounded-full flex items-center justify-center">
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Tor Hosts Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.torHosts.map((host) => (
                <div key={host.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      host.error ? 'bg-red-500' : 
                      host.circuits.length > 0 ? 'bg-green-500' : 'bg-yellow-500'
                    } ${host.circuits.length > 0 ? 'animate-pulse' : ''}`} />
                    <span className="font-medium text-sm">{host.hostname}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      {host.circuits.length} circuits
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(host.circuits.length, 5) }).map((_, i) => (
                        <div 
                          key={i} 
                          className="w-1 h-1 bg-green-500 rounded-full animate-ping" 
                          style={{ animationDelay: `${i * 0.2}s` }} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Real-time performance metrics (last 20 data points)
            </div>
            
            {/* Simple ASCII-style chart */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Throughput (bytes/s)</span>
                <span className="text-muted-foreground">
                  {trafficHistory.length > 0 ? 'Live' : 'No data'}
                </span>
              </div>
              <div className="h-20 bg-muted/20 rounded p-2 flex items-end gap-1">
                {trafficHistory.slice(-10).map((point, index) => {
                  const height = Math.min(100, (point.bytesOut / 1000000) * 10) // Scale to 0-100
                  return (
                    <div
                      key={index}
                      className="bg-blue-500 rounded-sm flex-1 animate-pulse"
                      style={{ height: `${height}%` }}
                    />
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Peak Throughput</div>
                <div className="font-medium">
                  {formatBytes(Math.max(...trafficHistory.map(t => t.bytesOut), data.summary.totalBytesOut))}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Current Load</div>
                <div className="font-medium">
                  {data.summary.healthyBackends > 0 
                    ? `${Math.round((data.summary.totalSessions / data.summary.healthyBackends) * 100)}%`
                    : '0%'
                  }
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}