'use server';
import { getDashboardAccessCached } from '@/services/auth.service';

export async function getDashboardAccessAction(dashboardId: string) {
  return getDashboardAccessCached(dashboardId);
}
