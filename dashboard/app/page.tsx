'use client';
import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface StatRow {
  pxname: string;
  svname: string;
  status: string;
  scur: number;
  smax: number;
  stot: number;
  bin: number;
  bout: number;
  ereq: number;
  econ: number;
  eresp: number;
  wretr: number;
  wredis: number;
  weight: number;
  act: number;
  bck: number;
  chkfail: number;
  chkdown: number;
  downtime: number;
  rate: number;
  rate_max: number;
  hrsp_2xx: number;
  hrsp_3xx: number;
  hrsp_4xx: number;
  hrsp_5xx: number;
  cli_abrt: number;
  srv_abrt: number;
  lastsess: number;
  qtime: number;
  ctime: number;
  rtime: number;
  ttime: number;
  check_status: string;
  check_code: number;
  check_duration: number;
  last_chk: string;
  qtime_max: number;
  ctime_max: number;
  rtime_max: number;
  ttime_max: number;
  // Add more if needed; using numbers for calcs
}

interface Summary {
  totalStot: number;
  totalBin: number;
  totalBout: number;
  totalErrors: number;
  avgTtime: number;
  upBackends: number;
  totalBackends: number;
}

export default function Home() {
  const [data, setData] = useState<Record<string, StatRow[]>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const { csv } = await res.json();
      const cleanedCsv = csv.replace(/^# /, '');
      const parsed = Papa.parse<StatRow>(cleanedCsv, { header: true, skipEmptyLines: true, dynamicTyping: true });
      const grouped: Record<string, StatRow[]> = {};
      parsed.data.forEach((row) => {
        if (!grouped[row.pxname]) grouped[row.pxname] = [];
        grouped[row.pxname].push(row);
      });

      // Calculate summary
      let totalStot = 0, totalBin = 0, totalBout = 0, totalErrors = 0, totalTtime = 0, ttimeCount = 0;
      let upBackends = 0, totalBackends = 0;
      Object.values(grouped).flat().forEach((row) => {
        totalStot += row.stot || 0;
        totalBin += row.bin || 0;
        totalBout += row.bout || 0;
        totalErrors += (row.ereq || 0) + (row.econ || 0) + (row.eresp || 0) + (row.wretr || 0) + (row.wredis || 0);
        if (row.ttime > 0) {
          totalTtime += row.ttime;
          ttimeCount++;
        }
        if (row.svname === 'BACKEND') {
          totalBackends++;
          if (row.status === 'UP') upBackends++;
        }
      });
      const avgTtime = ttimeCount > 0 ? totalTtime / ttimeCount : 0;

      setData(grouped);
      setSummary({ totalStot, totalBin, totalBout, totalErrors, avgTtime, upBackends, totalBackends });
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch stats');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p className="text-center p-4">Loading stats...</p>;
  if (error) return <p className="text-red-500 text-center p-4">Error: {error}</p>;

  const columns: ColumnDef<StatRow>[] = [
    { accessorKey: 'svname', header: 'Server' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'scur', header: 'Cur Sess' },
    { accessorKey: 'smax', header: 'Max Sess' },
    { accessorKey: 'stot', header: 'Total Sess' },
    { accessorKey: 'bin', header: 'Bytes In' },
    { accessorKey: 'bout', header: 'Bytes Out' },
    { accessorKey: 'ereq', header: 'Req Err' },
    { accessorKey: 'econ', header: 'Conn Err' },
    { accessorKey: 'eresp', header: 'Resp Err' },
    { accessorKey: 'wretr', header: 'Retry Warn' },
    { accessorKey: 'wredis', header: 'Redisp Warn' },
    { accessorKey: 'weight', header: 'Weight' },
    { accessorKey: 'act', header: 'Active' },
    { accessorKey: 'bck', header: 'Backup' },
    { accessorKey: 'chkfail', header: 'Chk Fail' },
    { accessorKey: 'chkdown', header: 'Chk Down' },
    { accessorKey: 'downtime', header: 'Downtime' },
    { accessorKey: 'rate', header: 'Rate' },
    { accessorKey: 'rate_max', header: 'Max Rate' },
    { accessorKey: 'hrsp_2xx', header: '2xx' },
    { accessorKey: 'hrsp_3xx', header: '3xx' },
    { accessorKey: 'hrsp_4xx', header: '4xx' },
    { accessorKey: 'hrsp_5xx', header: '5xx' },
    { accessorKey: 'cli_abrt', header: 'Cli Abrt' },
    { accessorKey: 'srv_abrt', header: 'Srv Abrt' },
    { accessorKey: 'lastsess', header: 'Last Sess' },
    { accessorKey: 'qtime', header: 'Q Time' },
    { accessorKey: 'ctime', header: 'C Time' },
    { accessorKey: 'rtime', header: 'R Time' },
    { accessorKey: 'ttime', header: 'T Time' },
    { accessorKey: 'check_status', header: 'Chk Status' },
    { accessorKey: 'check_code', header: 'Chk Code' },
    { accessorKey: 'check_duration', header: 'Chk Dur' },
    { accessorKey: 'last_chk', header: 'Last Chk' },
    { accessorKey: 'qtime_max', header: 'Max Q Time' },
    { accessorKey: 'ctime_max', header: 'Max C Time' },
    { accessorKey: 'rtime_max', header: 'Max R Time' },
    { accessorKey: 'ttime_max', header: 'Max T Time' },
    // Add more columns as needed
  ];

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">HAProxy Dashboard</h1>
        <Button onClick={fetchStats}>Refresh</Button>
      </div>

      {/* Summary Overview */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader><CardTitle>Total Sessions</CardTitle></CardHeader>
            <CardContent><p className="text-2xl">{summary.totalStot.toLocaleString()}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Bytes In</CardTitle></CardHeader>
            <CardContent><p className="text-2xl">{(summary.totalBin / 1e6).toFixed(2)} MB</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Bytes Out</CardTitle></CardHeader>
            <CardContent><p className="text-2xl">{(summary.totalBout / 1e6).toFixed(2)} MB</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Total Errors</CardTitle></CardHeader>
            <CardContent><p className="text-2xl">{summary.totalErrors.toLocaleString()}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Avg Resp Time</CardTitle></CardHeader>
            <CardContent><p className="text-2xl">{summary.avgTtime.toFixed(2)} ms</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Backend Health</CardTitle></CardHeader>
            <CardContent><p className="text-2xl">{summary.upBackends}/{summary.totalBackends} UP</p></CardContent>
          </Card>
        </div>
      )}

      {/* Proxy Sections */}
      {Object.entries(data).map(([pxname, rows]) => {
        const frontendRow = rows.find((r) => r.svname === 'FRONTEND');
        const backendRow = rows.find((r) => r.svname === 'BACKEND');
        const serverRows = rows.filter((r) => r.svname !== 'FRONTEND' && r.svname !== 'BACKEND');

        const chartData = serverRows.map((row) => ({
          name: row.svname,
          bout: row.bout || 0,
          fill: row.status === 'UP' ? '#22c55e' : '#ef4444',
        }));

        const respChartData = [
          { name: '2xx', value: backendRow?.hrsp_2xx || 0 },
          { name: '3xx', value: backendRow?.hrsp_3xx || 0 },
          { name: '4xx', value: backendRow?.hrsp_4xx || 0 },
          { name: '5xx', value: backendRow?.hrsp_5xx || 0 },
        ];

        return (
          <Card key={pxname}>
            <CardHeader>
              <CardTitle>{pxname}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Frontend/Backend Summaries */}
              {(frontendRow || backendRow) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {frontendRow && (
                    <Card>
                      <CardHeader><CardTitle>Frontend</CardTitle></CardHeader>
                      <CardContent>
                        <p>Status: {frontendRow.status}</p>
                        <p>Sessions: {frontendRow.stot}</p>
                        <p>Rate: {frontendRow.rate}/{frontendRow.rate_max}</p>
                        {/* Add more */}
                      </CardContent>
                    </Card>
                  )}
                  {backendRow && (
                    <Card>
                      <CardHeader><CardTitle>Backend</CardTitle></CardHeader>
                      <CardContent>
                        <p>Status: {backendRow.status}</p>
                        <p>Sessions: {backendRow.stot}</p>
                        <p>Rate: {backendRow.rate}/{backendRow.rate_max}</p>
                        {/* Add more */}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Charts */}
              {serverRows.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Traffic Out per Server</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="bout" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {backendRow && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Response Codes</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={respChartData}>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* Server Table */}
              {serverRows.length > 0 && (
                <div className="overflow-x-auto">
                  <h3 className="text-lg font-semibold mb-2">Servers</h3>
                  <DataTable columns={columns} data={serverRows} />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Reusable DataTable component
function DataTable<TData>({ columns, data }: { columns: ColumnDef<TData>[]; data: TData[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={(row.original as StatRow).status === 'UP' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}