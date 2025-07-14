'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut, ExternalLink, LayoutDashboard, CreditCard } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/logo';
import UserSettingsDialog from '@/components/userSettings/UserSettingsDialog';
import { BAAvatar } from '../avatar/BAAvatar';

export default function BATopbar() {
  const { data: session, status } = useSession();
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleSettingsClick = () => {
    setShowSettingsDialog(true);
  };

  return (
    <>
      <header className='bg-background/95 supports-[backdrop-filter]:bg-background/60 w-full backdrop-blur'>
        <div className='mx-auto flex h-14 items-center justify-between px-8 border-border border-b'>
          <div className='flex items-center space-x-2'>
            <Link href='/dashboards' className='flex items-center space-x-2'>
              <Logo variant='icon' showText textSize='md' priority />
            </Link>
          </div>

          <div className='flex items-center space-x-4'>
            {status === 'loading' ? (
              <div className='flex items-center space-x-2'>
                <div className='bg-muted h-4 w-16 animate-pulse rounded' />
                <div className='bg-muted h-8 w-8 animate-pulse rounded-full' />
              </div>
            ) : session ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' className='flex h-10 items-center space-x-2 rounded-full px-3'>
                      <span className='text-foreground hidden text-sm font-medium sm:block'>
                        {session.user?.name || 'User'}
                      </span>
                      <BAAvatar />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className='w-56' align='end' forceMount>
                    <DropdownMenuLabel className='font-normal'>
                      <div className='flex flex-col space-y-1'>
                        <p className='text-sm leading-none font-medium'>{session.user?.name || 'User'}</p>
                        <p className='text-muted-foreground text-xs leading-none'>{session.user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className='cursor-pointer'>
                      <Link href='/dashboards'>
                        <LayoutDashboard className='mr-2 h-4 w-4' />
                        <span>Dashboards</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className='cursor-pointer'>
                      <Link href='/billing'>
                        <CreditCard className='mr-2 h-4 w-4' />
                        <span>Upgrade Plan</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSettingsClick} className='cursor-pointer'>
                      <Settings className='mr-2 h-4 w-4' />
                      <span>Settings</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild className='cursor-pointer'>
                      <a href='/docs' title='Complete Betterlytics Documentation'>
                        <ExternalLink className='mr-2 h-4 w-4' />
                        <span>Documentation</span>
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className='cursor-pointer'>
                      <LogOut className='mr-2 h-4 w-4' />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {session && <UserSettingsDialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog} />}
    </>
  );
}
