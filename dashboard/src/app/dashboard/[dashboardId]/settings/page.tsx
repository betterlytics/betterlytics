import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getAuthOptions } from '@/lib/auth';
import SettingsSection from './SettingsSection';

export default async function SettingsPage() {
  const session = await getServerSession(getAuthOptions());

  if (!session) {
    redirect('/');
  }

  return (
    <div className='container mx-auto max-w-4xl p-6'>
      <div className='mb-8'>
        <h1 className='text-foreground mb-2 text-3xl font-bold'>Dashboard Settings</h1>
        <p className='text-muted-foreground'>Configure your dashboard preferences and data collection settings</p>
      </div>

      <SettingsSection />
    </div>
  );
}
