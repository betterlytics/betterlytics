'use server';
import { getDashboardAccess } from '@/services/auth.service';

export async function getDashboardAccessAction(dashboardId: string) {
  return getDashboardAccess(dashboardId);
}
