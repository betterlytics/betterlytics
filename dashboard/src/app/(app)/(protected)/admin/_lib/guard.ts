import 'server-only';

import { notFound } from 'next/navigation';
import { getCurrentAdminActor } from '@/auth/admin-auth';
import {
  isAdminSectionAvailable,
  type AdminActor,
  type AdminSectionKey,
} from '@/entities/admin/adminAccess.entities';

// Pages render in parallel with the layout, so each page repeats the gate before it loads any data
export async function requireAdminPage(section: AdminSectionKey): Promise<AdminActor> {
  const actor = await getCurrentAdminActor();
  if (!actor || !isAdminSectionAvailable(section, actor.edition)) notFound();
  return actor;
}
