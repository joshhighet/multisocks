export function formatBytes(n: number): string {
  if (!n || n < 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1)
  const v = n / Math.pow(1024, i)
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ${m % 60}m`
  return `${Math.floor(h / 24)}d ${h % 24}h`
}

/** "multisocks-tor-1" -> "tor-1" */
export function nodeLabel(hostname: string): string {
  return hostname.replace(/^multisocks[-_]/, '')
}

/** haproxy names servers "tor1" while docker names them "tor-1" */
export function statsKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function place(country: string | null | undefined): string {
  if (!country || country.toLowerCase() === 'unknown') return '—'
  return country
}
