'use client';

import { EventTypeRow } from '@/entities/analytics/events';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface EventsTableProps {
  data: EventTypeRow[];
}

export default function EventsTable({ data }: EventsTableProps) {
  return (
    <div className='border-border bg-card rounded-lg border shadow'>
      <div className='p-6'>
        <h2 className='text-foreground mb-1 text-lg font-bold'>Event Types</h2>
        <p className='text-muted-foreground mb-4 text-sm'>Custom events recorded in your site</p>
        <div className='overflow-x-auto'>
          <Table className='w-full'>
            <TableHeader>
              <TableRow className='border-border border-b'>
                <TableHead className='text-foreground py-3 font-medium'>Event</TableHead>
                <TableHead className='text-foreground py-3 text-right font-medium'>Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className='text-muted-foreground h-24 text-center'>
                    No events recorded in this time period
                  </TableCell>
                </TableRow>
              ) : (
                data.map((eventStat) => (
                  <TableRow key={eventStat.event_name} className='border-border border-b last:border-b-0'>
                    <TableCell className='text-foreground py-4 font-medium'>{eventStat.event_name}</TableCell>
                    <TableCell className='text-foreground py-4 text-right'>
                      {eventStat.count.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
