export type Author = {
  name: string;
  role: string;
  avatar?: string;
};

export const AUTHORS: Record<string, Author> = {
  team: {
    name: "The Betterlytics Team",
    role: "Engineering & Product",
  },
};

export function getAuthor(key: string): Author {
  return (
    AUTHORS[key] ?? {
      name: key,
      role: "",
    }
  );
}
