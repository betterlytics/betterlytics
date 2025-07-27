'use server';
import { getPublicEnvironmentVaraibles } from '@/services/environment.service';

export async function fetchPublicEnvironmentVariablesAction() {
  return getPublicEnvironmentVaraibles();
}
