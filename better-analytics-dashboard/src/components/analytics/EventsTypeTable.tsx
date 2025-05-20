'use client';

import { EventTypeRow } from "@/entities/events";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface EventsTableProps {
  data: EventTypeRow[];
}

export default function EventsTable({ data }: EventsTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card shadow">
      <div className="p-6">
        <h2 className="text-lg font-bold text-foreground mb-1">Event Types</h2>
        <p className="text-sm text-muted-foreground mb-4">Custom events recorded in your site</p>
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="py-3 text-foreground font-medium">Event</TableHead>
                <TableHead className="py-3 text-foreground font-medium text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                    No events recorded in this time period
                  </TableCell>
                </TableRow>
              ) : (
                data.map((eventStat) => (
                  <TableRow key={eventStat.event_name} className="border-b border-border last:border-b-0">
                    <TableCell className="py-4 font-medium text-foreground">
                      {eventStat.event_name}
                    </TableCell>
                    <TableCell className="py-4 text-foreground text-right">
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