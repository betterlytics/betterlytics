export type JobDefinition = {
  name: string;
  schedule?: string;
  retryLimit: number;
  retryBackoff: boolean;
  expireInSeconds: number;
  deadLetter?: string;
};

export type Job<TData = unknown> = JobDefinition & {
  runOnStart: boolean;
  handler: (data: TData) => Promise<void>;
};
