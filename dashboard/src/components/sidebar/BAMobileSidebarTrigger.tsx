'use client';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { MenuIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

type BAMobileSidebarTriggerProps = {
  /** Shown on the button's corner while the menu is closed, e.g. an alert dot from a sidebar item. */
  indicator?: ReactNode;
};

export default function BAMobileSidebarTrigger({ indicator }: BAMobileSidebarTriggerProps) {
  const { toggleSidebar, openMobile, setOpenMobile } = useSidebar();

  const pathname = usePathname();
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname]);

  return (
    <div className='bg-background fixed bottom-10 left-6 z-49 h-fit w-fit rounded-md'>
      <Button variant='outline' hidden={openMobile} className='relative md:hidden' onClick={toggleSidebar}>
        <MenuIcon />
        {indicator && <span className='absolute -top-1 -right-1 flex'>{indicator}</span>}
      </Button>
    </div>
  );
}
