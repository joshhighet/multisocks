import { useState } from 'react'
import type { CircuitNode, TorHostWithCircuits } from '../types'
import { nodeLabel, place } from '../lib/format'

interface Row {
  key: string
  node: string
  circuitId: string
  guard?: CircuitNode
  middle?: CircuitNode
  exit?: CircuitNode
}

interface Props {
  hosts: TorHostWithCircuits[]
}

const PAGE = 20

function Hop({ node }: { node?: CircuitNode }) {
  if (!node) return <td className="cell-hop">—</td>
  return (
    <td className="cell-hop">
      {place(node.location?.country)}
      {node.nickname ? <small>{node.nickname}</small> : null}
    </td>
  )
}

export function Ledger({ hosts }: Props) {
  const [node, setNode] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const rows: Row[] = hosts
    .filter((host) => node === null || host.id === node)
    .flatMap((host) =>
      host.circuits.map((circuit) => ({
        key: `${host.id}-${circuit.circuit_id}`,
        node: nodeLabel(host.hostname),
        circuitId: circuit.circuit_id,
        guard: circuit.path[0],
        middle: circuit.path.length > 2 ? circuit.path[1] : undefined,
        exit: circuit.path.length > 1 ? circuit.path[circuit.path.length - 1] : undefined,
      })),
    )

  const shown = expanded ? rows : rows.slice(0, PAGE)
  const hidden = rows.length - shown.length

  return (
    <section className="ledger">
      <div className="ledger-head">
        <h2 className="ledger-title">
          Circuits<span>{rows.length}</span>
        </h2>
        <div className="filters">
          <button className="chip" aria-pressed={node === null} onClick={() => setNode(null)}>
            all nodes
          </button>
          {hosts.map((host) => (
            <button
              key={host.id}
              className="chip"
              aria-pressed={node === host.id}
              onClick={() => setNode(node === host.id ? null : host.id)}
            >
              {nodeLabel(host.hostname)}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="more">
          No circuits built yet. Tor opens them on demand, so send traffic through the pool or
          rebuild a node above.
        </p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
            <thead>
              <tr>
                <th>Node</th>
                <th>Circuit</th>
                <th>Guard</th>
                <th className="col-mid">Middle</th>
                <th>Exit</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.key}>
                  <td className="cell-node">{row.node}</td>
                  <td className="cell-id">{row.circuitId}</td>
                  <Hop node={row.guard} />
                  <td className="cell-hop col-mid">
                    {row.middle ? place(row.middle.location?.country) : '—'}
                    {row.middle?.nickname ? <small>{row.middle.nickname}</small> : null}
                  </td>
                  <Hop node={row.exit} />
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          {hidden > 0 ? (
            <button className="more link" onClick={() => setExpanded(true)}>
              Show {hidden} more
            </button>
          ) : null}
        </>
      )}
    </section>
  )
}
