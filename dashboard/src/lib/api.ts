import type { 
  TorHost, 
  TorHostWithCircuits, 
  DashboardData 
} from '../types'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API request failed: ${response.status} ${error}`)
    }

    return response.json()
  }

  async getDashboardData(): Promise<DashboardData> {
    return this.request<DashboardData>('/dashboard-data')
  }

  async getTorHosts(): Promise<TorHost[]> {
    return this.request<TorHost[]>('/tor-hosts')
  }

  async getTorHostCircuits(hostId: string): Promise<TorHostWithCircuits> {
    return this.request<TorHostWithCircuits>(`/tor-hosts/${hostId}/circuits`)
  }


  // NEW MANAGEMENT METHODS

  async rebuildHostCircuits(hostId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/tor-hosts/${hostId}/rebuild-circuits`, {
      method: 'POST',
    })
  }

  async closeCircuit(circuitId: string, hostId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/circuits/${circuitId}/close?host_id=${hostId}`, {
      method: 'POST',
    })
  }

  async rebuildAllCircuits(): Promise<{ success: boolean; results: Array<{ host_id: string; hostname: string; result: any }> }> {
    return this.request<{ success: boolean; results: Array<{ host_id: string; hostname: string; result: any }> }>('/circuits/rebuild-all', {
      method: 'POST',
    })
  }

  async requestNewIdentity(hostId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/tor-hosts/${hostId}/new-identity`, {
      method: 'POST',
    })
  }

  // WebSocket connection for real-time updates
  connectWebSocket(onMessage: (data: any) => void): WebSocket {
    const wsUrl = this.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://')
    const ws = new WebSocket(`${wsUrl}/ws`)
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket connection closed')
    }

    return ws
  }
}

export const apiClient = new ApiClient()