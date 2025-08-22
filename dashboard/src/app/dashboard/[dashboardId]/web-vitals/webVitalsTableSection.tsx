'use client';

import { use } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import TabbedTable, { type TabDefinition } from '@/components/TabbedTable';
import { formatCWV, getCwvStatusColor } from '@/utils/formatters';
import type { CoreWebVitalName } from '@/entities/webVitals';
import type { fetchCoreWebVitalsByDimensionAction } from '@/app/actions/webVitals';

type Row = Awaited<ReturnType<typeof fetchCoreWebVitalsByDimensionAction>>[number];
type DimRow = Awaited<ReturnType<typeof fetchCoreWebVitalsByDimensionAction>>[number];
type Props = {
  perPagePromise: Promise<Row[]>;
  perDevicePromise: Promise<DimRow[]>;
  perCountryPromise: Promise<DimRow[]>;
};

export default function WebVitalsTableSection({ perPagePromise, perDevicePromise, perCountryPromise }: Props) {
  const data = use(perPagePromise);
  const devices = use(perDevicePromise);
  const countries = use(perCountryPromise);

  const makeColumns = (label: string): ColumnDef<Row>[] => {
    type CurrentKeys = keyof Row['current'];
    const valueCell =
      (metric: CoreWebVitalName) =>
      ({ row }: { row: { original: Row } }) => (
        <div className='flex flex-col items-start'>
          <span
            style={{
              color: getCwvStatusColor(metric, row.original.current[metric as CurrentKeys] as number | null),
            }}
          >
            {formatCWV(metric, row.original.current[metric as CurrentKeys] as number | null)}
          </span>
        </div>
      );

    return [
      {
        accessorKey: 'key',
        header: label,
        cell: ({ row }) => <span className='max-w-[480px] truncate'>{row.original.key}</span>,
      },
      { accessorKey: 'CLS', header: 'CLS', cell: valueCell('CLS'), accessorFn: (r) => r.current.key },
      { accessorKey: 'LCP', header: 'LCP', cell: valueCell('LCP'), accessorFn: (r) => r.current.key },
      { accessorKey: 'INP', header: 'INP', cell: valueCell('INP'), accessorFn: (r) => r.current.key },
      { accessorKey: 'FCP', header: 'FCP', cell: valueCell('FCP'), accessorFn: (r) => r.current.key },
      { accessorKey: 'TTFB', header: 'TTFB', cell: valueCell('TTFB'), accessorFn: (r) => r.current.key },
      {
        accessorKey: 'samples',
        header: 'Events',
        cell: ({ row }) => <span className='tabular-nums'>{row.original.current.samples}</span>,
        accessorFn: (r) => r.current.samples,
      },
    ];
  };

  const pageColumns: ColumnDef<Row>[] = makeColumns('Page');
  const deviceColumns: ColumnDef<Row>[] = makeColumns('Device Type');
  const countryColumns: ColumnDef<Row>[] = makeColumns('Country');

  const defaultSorting = [{ id: 'LCP', desc: true }];

  const tabs: TabDefinition<Row>[] = [
    { key: 'pages', label: 'Pages', data, columns: pageColumns, defaultSorting },
    {
      key: 'devices',
      label: 'Devices',
      data: devices,
      columns: deviceColumns,
      defaultSorting,
    },
    {
      key: 'countries',
      label: 'Countries',
      data: countries,
      columns: countryColumns,
      defaultSorting,
    },
  ];

  return <TabbedTable title='Performance breakdown (p75)' tabs={tabs} defaultTab='pages' />;
}
