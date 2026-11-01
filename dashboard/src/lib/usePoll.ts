import { useCallback, useEffect, useState } from 'react'

export interface Poll<T> {
  data: T | null
  error: Error | null
  updatedAt: Date | null
  loading: boolean
  refresh: () => void
}

/** Polls `load` on an interval. `load` must be stable across renders. */
export function usePoll<T>(load: () => Promise<T>, intervalMs: number): Poll<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const next = await load()
        if (!alive) return
        setData(next)
        setError(null)
        setUpdatedAt(new Date())
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? e : new Error(String(e)))
      }
    }
    void run()
    const id = setInterval(() => void run(), intervalMs)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [load, intervalMs, nonce])

  const refresh = useCallback(() => setNonce((n) => n + 1), [])
  return { data, error, updatedAt, loading: data === null && error === null, refresh }
}
