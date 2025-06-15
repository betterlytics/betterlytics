'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { CreditCard } from 'lucide-react';
import { formatPrice } from '@/utils/pricing';
import { format } from 'date-fns';
import { useBillingHistory } from '@/hooks/useBillingData';

export default function UserBillingHistory() {
  const { billingHistory, isLoading, error } = useBillingHistory();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'past-due':
        return 'destructive';
      case 'refunded':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      case 'past-due':
        return 'text-red-600';
      case 'refunded':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className='py-8 text-center'>
        <p className='text-muted-foreground'>Unable to load usage data</p>
      </div>
    );
  }

  if (billingHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View your past billing records and payment history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <CreditCard className='text-muted-foreground mb-4 h-12 w-12' />
            <h3 className='mb-2 text-lg font-medium'>No billing history yet</h3>
            <p className='text-muted-foreground text-sm'>
              Your billing history will appear here once you start using paid plans.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing History</CardTitle>
        <CardDescription>View your past billing records and payment history</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='max-h-96 space-y-4 overflow-y-auto'>
          {billingHistory.map((record) => (
            <div
              key={record.id}
              className='hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors'
            >
              <div className='flex items-start gap-4'>
                <div className='flex-shrink-0'>
                  <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full'>
                    <CreditCard className='text-primary h-5 w-5' />
                  </div>
                </div>

                <div className='min-w-0 flex-1'>
                  <div className='mb-1 flex items-center gap-2'>
                    <p className='text-sm font-medium'>
                      {format(record.periodStart, 'MMM d')} - {format(record.periodEnd, 'MMM d, yyyy')}
                    </p>
                    <Badge variant={getStatusBadgeVariant(record.status)} className='text-xs'>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Badge>
                  </div>

                  <div className='text-muted-foreground flex items-center gap-1 text-sm'>
                    <span>{record.eventLimit.toLocaleString()} events</span>
                  </div>

                  {record.paymentInvoiceId && (
                    <p className='text-muted-foreground mt-1 text-xs'>Invoice: {record.paymentInvoiceId}</p>
                  )}
                </div>
              </div>

              <div className='text-right'>
                <p className={`text-lg font-semibold ${getStatusColor(record.status)}`}>
                  {formatPrice(record.amountPaid)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {billingHistory.length > 0 && (
          <div className='mt-6 border-t pt-4'>
            <p className='text-muted-foreground text-center text-sm'>
              Need help with billing?{' '}
              <a href='mailto:support@betterlytics.io' className='text-primary hover:underline'>
                Contact support
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
