'use server';
import { getPublicEnvironmentVariables } from '@/services/system/environment.service';

export async function fetchPublicEnvironmentVariablesAction() {
  return getPublicEnvironmentVariables();
}
