'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DestructiveActionDialog } from '@/components/dialogs';
import { deleteUserAction } from '@/actions/superadmin/users.action';

interface DeleteUserButtonProps {
  userId: string;
  userEmail: string;
}

export function DeleteUserButton({ userId, userEmail }: DeleteUserButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteUserAction(userId);
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant='destructive' size='sm' onClick={() => setOpen(true)}>
        Delete
      </Button>
      <DestructiveActionDialog
        open={open}
        onOpenChange={setOpen}
        title='Delete user?'
        description={`This will anonymize ${userEmail}. PII is cleared and all sessions revoked. Cannot be undone.`}
        confirmLabel='Delete user'
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </>
  );
}
