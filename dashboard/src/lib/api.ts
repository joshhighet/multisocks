import type { TorHost, TorHostWithCircuits, HAProxyStats, SystemSummary, DashboardData } from '../types'

const API_BASE = 'http://localhost:8000'

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl
  }

  async getTorHosts(): Promise<TorHost[]> {
    const response = await fetch(`${this.baseUrl}/tor-hosts`)
    if (!response.ok) {
      throw new Error(`Failed to fetch Tor hosts: ${response.statusText}`)
    }
    return response.json()
  }

  async getTorHostCircuits(hostId: string): Promise<TorHostWithCircuits> {
    const response = await fetch(`${this.baseUrl}/tor-hosts/${hostId}/circuits`)
    if (!response.ok) {
      throw new Error(`Failed to fetch circuits for host ${hostId}: ${response.statusText}`)
    }
    return response.json()
  }

  async getHAProxyStats(): Promise<HAProxyStats[]> {
    const response = await fetch(`${this.baseUrl}/haproxy-stats`)
    if (!response.ok) {
      throw new Error(`Failed to fetch HAProxy stats: ${response.statusText}`)
    }
    const data = await response.json()
    return data.backends || []
  }

  async getDashboardData(): Promise<DashboardData> {
    const response = await fetch(`${this.baseUrl}/dashboard-data`)
    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard data: ${response.statusText}`)
    }
    return response.json()
  }

  async getAllCircuits(): Promise<TorHostWithCircuits[]> {
    const hosts = await this.getTorHosts()
    const circuitsPromises = hosts.map(host => this.getTorHostCircuits(host.id))
    return Promise.all(circuitsPromises)
  }

  calculateSummary(torHosts: TorHostWithCircuits[], haproxyStats: HAProxyStats[]): SystemSummary {
    const totalCircuits = torHosts.reduce((sum, host) => sum + host.circuits.length, 0)
    const activeCircuits = torHosts.reduce((sum, host) => 
      sum + host.circuits.filter(circuit => circuit.purpose !== 'CLOSED').length, 0
    )

    const backendStats = haproxyStats.filter(stat => stat.svname === 'BACKEND')
    const totalSessions = backendStats.reduce((sum, stat) => sum + (stat.stot || 0), 0)
    const totalBytesIn = backendStats.reduce((sum, stat) => sum + (stat.bin || 0), 0)
    const totalBytesOut = backendStats.reduce((sum, stat) => sum + (stat.bout || 0), 0)
    
    const serverStats = haproxyStats.filter(stat => 
      stat.svname !== 'FRONTEND' && stat.svname !== 'BACKEND' && stat.status === 'UP'
    )
    const averageLatency = serverStats.length > 0 
      ? serverStats.reduce((sum, stat) => sum + (stat.ttime || 0), 0) / serverStats.length
      : 0

    const healthyBackends = serverStats.length
    const totalBackends = haproxyStats.filter(stat => 
      stat.svname !== 'FRONTEND' && stat.svname !== 'BACKEND'
    ).length

    return {
      totalCircuits,
      activeCircuits,
      totalSessions,
      totalBytesIn,
      totalBytesOut,
      averageLatency,
      healthyBackends,
      totalBackends,
      uptime: 0 // This would need to be calculated from container start times
    }
  }
}

export const apiClient = new ApiClient()
