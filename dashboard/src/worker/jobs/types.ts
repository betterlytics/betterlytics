export type Job<TData = unknown> = {
  name: string;
  schedule?: string;
  runOnStart: boolean;
  retryLimit: number;
  retryBackoff: boolean;
  expireInSeconds: number;
  deadLetter?: string;
  handler: (data: TData) => Promise<void>;
};
