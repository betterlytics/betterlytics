export type GetGravatarUrlProps = {
  size?: number;
  defaultImage?: 'blank';
};

export async function getGravatarUrl(
  email?: string,
  { size = 128, defaultImage = 'blank' }: GetGravatarUrlProps = {},
): Promise<string | undefined> {
  if (!email) return;

  const hashHex = await sha256Hex(email.trim().toLowerCase());
  return `https://secure.gravatar.com/avatar/${hashHex}?d=${defaultImage}&s=${size}`;
}

async function sha256Hex(str: string): Promise<string> {
  const buffer = await window.crypto.subtle.digest('sha-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
