/**
 * Generates a display name from a user's name and email
 * Falls back to email username part if no name is provided
 */
export function getDisplayName(userName?: string | null, email?: string): string {
  if (userName?.trim()) {
    return userName.trim();
  }

  if (email?.includes('@')) {
    return email.split('@')[0];
  }

  // This should never happen unless the user is not logged in
  return 'User';
}
