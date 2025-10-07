export interface TorHost {
  id: string
  ip_address: string
  external_ip?: string
  hostname: string
  image: string
  state: string
}

export interface CircuitNode {
  fingerprint: string
  nickname: string
  address: string
  location: {
    country: string
    city: string
    latitude: number | null
    longitude: number | null
  }
}

export interface Circuit {
  circuit_id: string
  purpose: string
  path: CircuitNode[]
}

export interface TorHostWithCircuits extends TorHost {
  circuits: Circuit[]
  error?: string
}

export interface HAProxyStats {
  pxname: string
  svname: string
  status: string
  scur: number
  smax: number
  stot: number
  bin: number
  bout: number
  ereq: number
  econ: number
  eresp: number
  wretr: number
  wredis: number
  weight: number
  act: number
  bck: number
  chkfail: number
  chkdown: number
  downtime: number
  rate: number
  rate_max: number
  hrsp_2xx: number
  hrsp_3xx: number
  hrsp_4xx: number
  hrsp_5xx: number
  cli_abrt: number
  srv_abrt: number
  lastsess: number
  qtime: number
  ctime: number
  rtime: number
  ttime: number
  check_status: string
  check_code: number
  check_duration: number
  last_chk: string
  qtime_max: number
  ctime_max: number
  rtime_max: number
  ttime_max: number
}

export interface SystemSummary {
  totalCircuits: number
  activeCircuits: number
  totalSessions: number
  totalBytesIn: number
  totalBytesOut: number
  averageLatency: number
  healthyBackends: number
  totalBackends: number
  uptime: number
}

export interface DashboardData {
  torHosts: TorHostWithCircuits[]
  haproxyStats: HAProxyStats[]
  summary: SystemSummary
  lastUpdated: string
}
