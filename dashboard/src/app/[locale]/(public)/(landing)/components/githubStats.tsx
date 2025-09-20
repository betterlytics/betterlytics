import { Star } from 'lucide-react';
import { getGitHubStats } from '@/lib/github';

export async function GitHubStats() {
  const stars = await getGitHubStats();

  if (!stars) {
    return null;
  }

  return (
    <div className='text-muted-foreground mt-8 flex items-center justify-center text-sm'>
      <div className='flex items-center'>
        <Star className='mr-1 h-4 w-4 text-yellow-500' />
        <span className='font-medium'>{stars.toLocaleString()}</span>
        <span className='ml-1'>stars on GitHub</span>
      </div>
    </div>
  );
}
