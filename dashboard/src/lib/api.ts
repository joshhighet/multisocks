import type { DashboardData, TorHostWithCircuits } from '../types'

interface Ack {
  success: boolean
  message?: string
}

class ApiClient {
  readonly baseUrl: string

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl
    } else {
      const protocol = window.location.protocol === 'https:' ? 'https' : 'http'
      this.baseUrl = `${protocol}://${window.location.hostname}:8000`
    }
  }

  private async request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
    if (!response.ok) {
      throw new Error(`${response.status} ${await response.text()}`)
    }
    return response.json() as Promise<T>
  }

  getDashboardData(): Promise<DashboardData> {
    return this.request<DashboardData>('/dashboard-data')
  }

  getHostCircuits(hostId: string): Promise<TorHostWithCircuits> {
    return this.request<TorHostWithCircuits>(`/tor-hosts/${hostId}/circuits`)
  }

  rebuildHostCircuits(hostId: string): Promise<Ack> {
    return this.request<Ack>(`/tor-hosts/${hostId}/rebuild-circuits`, { method: 'POST' })
  }

  rebuildAllCircuits(): Promise<Ack> {
    return this.request<Ack>('/circuits/rebuild-all', { method: 'POST' })
  }

  requestNewIdentity(hostId: string): Promise<Ack> {
    return this.request<Ack>(`/tor-hosts/${hostId}/new-identity`, { method: 'POST' })
  }

  closeCircuit(circuitId: string, hostId: string): Promise<Ack> {
    return this.request<Ack>(`/circuits/${circuitId}/close?host_id=${hostId}`, { method: 'POST' })
  }
}

export const apiClient = new ApiClient()
