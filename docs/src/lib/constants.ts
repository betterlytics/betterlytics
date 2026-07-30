export const DOCS_BASE_PATH = "";

export const getAssetPath = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${DOCS_BASE_PATH}${normalizedPath}`;
};
