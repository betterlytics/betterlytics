'use client';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { MenuIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function BAMobileSidebarTrigger() {
  const { toggleSidebar, isMobile, openMobile, setOpenMobile } = useSidebar();

  const pathname = usePathname();
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname]);

  return (
    <div className='bg-background fixed bottom-10 left-6 z-49 h-fit w-fit rounded-md'>
      <Button variant='outline' hidden={openMobile} className={cn(!isMobile && 'hidden')} onClick={toggleSidebar}>
        <MenuIcon />
      </Button>
    </div>
  );
}
