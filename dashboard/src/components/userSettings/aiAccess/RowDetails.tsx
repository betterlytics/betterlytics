import { Fragment, type ReactNode } from 'react';

interface RowDetailsProps {
  rows: { label: string; value: ReactNode }[];
}

/** A row's facts as labeled lines, for narrow screens where the table's column headers are hidden. */
export default function RowDetails({ rows }: RowDetailsProps) {
  return (
    <dl className='mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-xs lg:hidden'>
      {rows.map(({ label, value }) => (
        <Fragment key={label}>
          <dt className='text-muted-foreground'>{label}</dt>
          <dd className='min-w-0 truncate'>{value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
