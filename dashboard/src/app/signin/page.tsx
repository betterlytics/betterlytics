import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';
import Logo from '@/components/logo';
import { getServerSession } from 'next-auth';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboards');
  }

  return (
    <div className='bg-background flex min-h-screen items-center justify-center px-4 py-12 pt-20 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          <div className='mb-6 flex justify-center'>
            <Logo variant='full' width={200} height={60} priority />
          </div>
          <h2 className='text-foreground mt-6 text-2xl font-semibold'>Sign in to your account</h2>
          <p className='text-muted-foreground mt-2 text-sm'>Access your analytics dashboard</p>
        </div>
        <div className='bg-card rounded-lg border p-8 shadow-sm'>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
