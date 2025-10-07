import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { ToastProvider } from './components/ui/toast'
import { SystemOverview } from './components/SystemOverview'
import { NetworkTraffic } from './components/NetworkTraffic'
import { CircuitMonitor } from './components/CircuitMonitor'
import { Diagnostics } from './components/Diagnostics'
import { apiClient } from './lib/api'
import type { DashboardData } from './types'
import { RefreshCw, Activity, Globe, Shield, Moon, Sun, AlertTriangle } from 'lucide-react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 2000, // More frequent updates for real-time feel
      staleTime: 1000,
    },
  },
})

function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [darkMode, setDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const { data: dashboardData, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const data = await apiClient.getDashboardData()
      setLastUpdated(new Date())
      return data
    },
  })

  const handleRefresh = () => {
    refetch()
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // Calculate system health status
  const getSystemHealth = () => {
    if (!dashboardData) return { status: 'unknown', message: 'No data' }
    
    const healthyHosts = dashboardData.torHosts.filter(h => !h.error && h.circuits.length > 0).length
    const totalHosts = dashboardData.torHosts.length
    const activeCircuits = dashboardData.summary.activeCircuits
    
    if (healthyHosts === 0) return { status: 'critical', message: 'All hosts offline' }
    if (healthyHosts < totalHosts / 2) return { status: 'warning', message: `${healthyHosts}/${totalHosts} hosts healthy` }
    if (activeCircuits === 0) return { status: 'warning', message: 'No active circuits' }
    return { status: 'healthy', message: `${healthyHosts}/${totalHosts} hosts, ${activeCircuits} circuits` }
  }

  const systemHealth = getSystemHealth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Activity className="h-12 w-12 mx-auto animate-spin text-primary" />
          <h2 className="text-xl font-semibold">Loading multisocks dashboard...</h2>
          <p className="text-muted-foreground">Connecting to Tor circuits</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Failed to connect to the multisocks metrics service.
            </p>
            <p className="text-sm text-muted-foreground">
              Make sure the metrics service is running on port 8000.
            </p>
            <Button onClick={handleRefresh} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold">No Data Available</h2>
          <p className="text-muted-foreground">No dashboard data received</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with System Status */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Globe className="h-8 w-8" />
              multisocks Dashboard
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                systemHealth.status === 'healthy' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : systemHealth.status === 'warning'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  systemHealth.status === 'healthy' ? 'bg-green-500' :
                  systemHealth.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                {systemHealth.message}
              </div>
              <div className="text-sm text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={toggleDarkMode} variant="outline" size="sm">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="traffic">Network Traffic</TabsTrigger>
            <TabsTrigger value="circuits">Circuit Monitor</TabsTrigger>
            <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <SystemOverview data={dashboardData} />
          </TabsContent>

          <TabsContent value="traffic" className="space-y-6">
            <NetworkTraffic data={dashboardData} />
          </TabsContent>

          <TabsContent value="circuits" className="space-y-6">
            <CircuitMonitor data={dashboardData} />
          </TabsContent>

          <TabsContent value="diagnostics" className="space-y-6">
            <Diagnostics data={dashboardData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Dashboard />
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App