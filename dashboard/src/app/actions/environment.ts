'use server';
import { getPublicEnvironmentVariables } from '@/services/environment.service';

export async function fetchPublicEnvironmentVariablesAction() {
  return getPublicEnvironmentVariables();
}
