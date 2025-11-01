'use server';
import { getDashboardAccess } from '@/services/authorization.service';

export async function getDashboardAccessAction(dashboardId: string) {
  return getDashboardAccess(dashboardId);
}
