export function generateSiteId(domain: string) {
  const [name] = domain.replace('https://', '').replace('http://', '').split('.');
  const id = new Date().valueOf().toString(36);
  return `${name}-${id}`;
}
