'use server';

import { getMistralChatResponse } from '@/lib/ai/mistral';

export async function getMistralReport(data: string) {
  const response = await getMistralChatResponse(data);

  return response.choices[0].message.content;
}
