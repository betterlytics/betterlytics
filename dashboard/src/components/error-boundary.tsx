'use client';

import React, { useCallback } from 'react';
import { AlertTriangle, RefreshCw, Home, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorPage;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

export function ErrorPage({ error, resetError }: ErrorFallbackProps) {
  const handleRefresh = useCallback(() => {
    resetError();
    window.location.reload();
  }, [resetError]);

  const handleGoHome = useCallback(() => {
    window.location.href = '/dashboards';
  }, []);

  const handleGoBack = useCallback(() => {
    window.history.back();
  }, []);

  const handleReportError = useCallback(() => {
    const subject = encodeURIComponent('Error Report - Betterlytics Dashboard');
    const body = encodeURIComponent(`
Error Details:
- Message: ${error?.message || 'Unknown error'}
- Stack: ${error?.stack || 'No stack trace available'}
- URL: ${window.location.href}
- User Agent: ${navigator.userAgent}
- Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
[Your description here]
    `);
    window.open(`mailto:support@betterlytics.com?subject=${subject}&body=${body}`);
  }, [error]);

  return (
    <div className='flex items-center justify-center p-4'>
      <div className='w-full max-w-2xl'>
        <Card>
          <CardContent className='p-8'>
            <div className='mb-8 text-center'>
              <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10'>
                <AlertTriangle className='h-8 w-8 text-red-400' />
              </div>
              <h2 className='text-foreground mb-2 text-2xl font-bold'>Something went wrong</h2>
              <p className='text-muted-foreground text-lg'>
                We encountered an unexpected error while loading your dashboard.
              </p>
            </div>

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === 'development' && error && (
              <div className='mb-8 rounded-lg border border-gray-700 bg-gray-800 p-4'>
                <h3 className='mb-2 text-sm font-medium text-red-400'>Error Details (Development)</h3>
                <p className='font-mono text-xs break-all text-gray-300'>{error.message}</p>
                {error.stack && (
                  <details className='mt-2'>
                    <summary className='cursor-pointer text-xs text-gray-400 hover:text-gray-300'>
                      Stack Trace
                    </summary>
                    <pre className='mt-2 max-h-32 overflow-auto text-xs text-gray-400'>{error.stack}</pre>
                  </details>
                )}
              </div>
            )}

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <Button onClick={handleRefresh} variant='default'>
                <RefreshCw className='mr-2 h-4 w-4' />
                Refresh Page
              </Button>
              <Button onClick={handleGoHome} variant='outline'>
                <Home className='mr-2 h-4 w-4' />
                Go to Dashboards
              </Button>
              <Button onClick={handleGoBack} variant='outline'>
                <ArrowLeft className='mr-2 h-4 w-4' />
                Go Back
              </Button>
              <Button onClick={handleReportError} variant='outline'>
                <Mail className='mr-2 h-4 w-4' />
                Report Issue
              </Button>
            </div>

            {/* Help Text */}
            <div className='mt-8 border-t border-gray-800 pt-6'>
              <div className='space-y-2 text-center'>
                <p className='text-muted-foreground text-sm'>
                  If this problem persists, please contact our support team.
                </p>
                <div className='text-muted-foreground flex items-center justify-center gap-4 text-xs'>
                  <span>Error ID: {Date.now().toString(36)}</span>
                  <span>•</span>
                  <span>Time: {new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='mt-6 text-center'>
          <p className='text-muted-foreground text-sm'>
            Need immediate help?{' '}
            <a href='mailto:support@betterlytics.com' className='text-blue-500 underline hover:text-blue-400'>
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
