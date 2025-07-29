import NextAuth from 'next-auth';
import { getAuthOptions } from '@/lib/auth';
import { lazyCache } from '@/lib/lazy-cache';

const getHandler = lazyCache(() => NextAuth(getAuthOptions()));

export const GET = async (...options: any[]) => {
  const handler = getHandler();
  return handler(...options);
};

export const POST = async (...options: any[]) => {
  const handler = getHandler();
  return handler(...options);
};
