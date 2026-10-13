'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ServerActionResponse } from '@/middlewares/serverActionHandler';

type MutationOptions<T> = {
  success?: string;
  onSuccess?: (data: T) => void;
  refresh?: boolean;
};

export function useAdminMutation() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run<T>(action: () => Promise<ServerActionResponse<T>>, options: MutationOptions<T> = {}) {
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        toast.error(result.error.message || 'Something went wrong');
        return;
      }
      if (options.success) toast.success(options.success);
      options.onSuccess?.(result.data);
      if (options.refresh !== false) router.refresh();
    });
  }

  return { run, isPending };
}
