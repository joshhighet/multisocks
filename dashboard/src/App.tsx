import { useCallback, useMemo, useState } from 'react'
import { Rack } from './components/Rack'
import { Ledger } from './components/Ledger'
import { apiClient } from './lib/api'
import { usePoll } from './lib/usePoll'
import { formatBytes, formatDuration, nodeLabel, statsKey } from './lib/format'
import type { DashboardData, TorHostWithCircuits } from './types'

const loadDashboard = () => apiClient.getDashboardData()

export default function App() {
  const { data, error, updatedAt, loading, refresh } = usePoll<DashboardData>(loadDashboard, 2000)
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [note, setNote] = useState<string | null>(null)

  const act = useCallback(
    async (key: string, pending: string, run: () => Promise<unknown>) => {
      setBusy((b) => ({ ...b, [key]: true }))
      setNote(pending)
      try {
        await run()
      } catch (e) {
        setNote(`${pending.replace(/…$/, '')} failed: ${e instanceof Error ? e.message : e}`)
        setBusy((b) => ({ ...b, [key]: false }))
        return
      }
      setBusy((b) => ({ ...b, [key]: false }))
      refresh()
    },
    [refresh],
  )

  const rebuild = useCallback(
    (host: TorHostWithCircuits) =>
      void act(host.id, `Rebuilding circuits on ${nodeLabel(host.hostname)}…`, () =>
        apiClient.rebuildHostCircuits(host.id),
      ),
    [act],
  )

  const identity = useCallback(
    (host: TorHostWithCircuits) =>
      void act(host.id, `Requesting a new identity for ${nodeLabel(host.hostname)}…`, () =>
        apiClient.requestNewIdentity(host.id),
      ),
    [act],
  )

  const rebuildAll = useCallback(
    () => void act('all', 'Rebuilding circuits across the pool…', () => apiClient.rebuildAllCircuits()),
    [act],
  )

  const faults = useMemo(() => {
    if (!data) return []
    const byName = new Map(
      data.haproxyStats
        .filter((s) => s.svname !== 'BACKEND' && s.svname !== 'FRONTEND')
        .map((s) => [statsKey(s.svname), s]),
    )
    const lines: { node: string; detail: string }[] = []
    for (const host of data.torHosts) {
      const label = nodeLabel(host.hostname)
      const stat = byName.get(statsKey(label))
      if (host.error) lines.push({ node: label, detail: `control port unreachable — ${host.error}` })
      if (stat && stat.status !== 'UP') {
        const since = stat.downtime > 0 ? `, down ${formatDuration(stat.downtime)} so far` : ''
        lines.push({
          node: label,
          detail: `taken out of rotation after ${stat.chkfail} failed health ${stat.chkfail === 1 ? 'check' : 'checks'}${since}`,
        })
      }
      if (stat && stat.econ > 0) {
        lines.push({ node: label, detail: `${stat.econ} connection ${stat.econ === 1 ? 'error' : 'errors'}` })
      }
    }
    return lines
  }, [data])

  if (loading) {
    return (
      <main className="notice">
        <h1>Reading pool state</h1>
        <p>Connecting to the metrics service.</p>
      </main>
    )
  }

  if (error && !data) {
    return (
      <main className="notice">
        <h1>Can&rsquo;t reach the metrics service</h1>
        <p>
          Nothing answered at <code>{apiClient.baseUrl}</code>. Start it with{' '}
          <code>docker compose up -d metrics</code>, then retry.
        </p>
        <button className="action" onClick={refresh}>
          Retry
        </button>
      </main>
    )
  }

  if (!data) return null

  if (data.torHosts.length === 0) {
    return (
      <main className="notice">
        <h1>No tor nodes running</h1>
        <p>
          haproxy has nothing to balance. Bring the pool up with <code>docker compose up -d</code>{' '}
          and nodes appear here as they register.
        </p>
      </main>
    )
  }

  const s = data.summary

  return (
    <main className="page">
      <header className="masthead">
        <div>
          <h1 className="wordmark">multisocks</h1>
          <p className="state">
            <span>
              <b>{s.healthyBackends}</b> of {s.totalBackends} nodes live
            </span>
            <span>
              <b>{s.totalCircuits}</b> circuits
            </span>
            <span>
              <b>{s.totalSessions}</b> sessions
            </span>
            <span>
              <b>{formatBytes(s.totalBytesOut)}</b> out
            </span>
            <span>up {formatDuration(s.uptime)}</span>
            {updatedAt ? <span>updated {updatedAt.toLocaleTimeString()}</span> : null}
          </p>
          {note ? <p className="note">{note}</p> : null}
          {error ? (
            <p className="note">
              Lost contact with the metrics service. Showing the last good reading.
            </p>
          ) : null}
        </div>
        <div className="masthead-actions">
          <button className="action" disabled={busy.all} onClick={rebuildAll}>
            Rebuild all circuits
          </button>
        </div>
      </header>

      <Rack
        hosts={data.torHosts}
        stats={data.haproxyStats}
        busy={busy}
        onRebuild={rebuild}
        onIdentity={identity}
      />

      {faults.length > 0 ? (
        <div className="faults">
          {faults.map((fault, i) => (
            <div className="fault-line" key={`${fault.node}-${i}`}>
              <b>{fault.node}</b> {fault.detail}
            </div>
          ))}
        </div>
      ) : null}

      <Ledger hosts={data.torHosts} />
    </main>
  )
}
