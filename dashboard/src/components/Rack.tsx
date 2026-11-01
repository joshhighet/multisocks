import type { CSSProperties } from 'react'
import type { HAProxyStats, TorHostWithCircuits } from '../types'
import { formatBytes, nodeLabel, statsKey } from '../lib/format'

interface Props {
  hosts: TorHostWithCircuits[]
  stats: HAProxyStats[]
  busy: Record<string, boolean>
  onRebuild: (host: TorHostWithCircuits) => void
  onIdentity: (host: TorHostWithCircuits) => void
}

export function Rack({ hosts, stats, busy, onRebuild, onIdentity }: Props) {
  const peak = Math.max(1, ...hosts.map((h) => h.circuits.length))
  const byName = new Map(
    stats
      .filter((s) => s.svname !== 'BACKEND' && s.svname !== 'FRONTEND')
      .map((s) => [statsKey(s.svname), s]),
  )

  return (
    <div className="rack" style={{ '--channels': hosts.length } as CSSProperties}>
      {hosts.map((host) => {
        const label = nodeLabel(host.hostname)
        const stat = byName.get(statsKey(label))
        const live = stat ? stat.status === 'UP' : !host.error
        const count = host.circuits.length
        return (
          <div className="channel" key={host.id}>
            <div className="channel-name">{label}</div>

            <div className="lamp-row">
              <span className={live ? 'lamp lamp-live' : 'lamp lamp-fault'} aria-hidden="true" />
              {live ? 'live' : 'down'}
            </div>

            <div className="meter" title={`${count} of ${peak} circuits on this node`}>
              <div className="meter-fill" style={{ width: `${(count / peak) * 100}%` }} />
            </div>
            <div className="count">
              {count} <span>{count === 1 ? 'circuit' : 'circuits'}</span>
            </div>

            <div className="field">
              <span>exit</span>
              <data>{host.external_ip ?? '—'}</data>
            </div>
            <div className="field">
              <span>sessions</span>
              <data>{stat?.stot ?? 0}</data>
            </div>
            <div className="field">
              <span>out</span>
              <data>{formatBytes(stat?.bout ?? 0)}</data>
            </div>

            <div className="channel-actions">
              <button className="link" disabled={busy[host.id]} onClick={() => onRebuild(host)}>
                rebuild
              </button>
              <button className="link" disabled={busy[host.id]} onClick={() => onIdentity(host)}>
                new identity
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
