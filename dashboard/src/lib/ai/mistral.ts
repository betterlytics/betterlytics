'server-only';

import { env } from '@/lib/env';

const CHAT_API = 'https://api.mistral.ai/v1/chat/completions';

const CHAT_MODEL = 'mistral-small-latest'; //'mistral-medium-2508';

const BASE_PARAMS = {
  model: CHAT_MODEL,
  temperature: 0.2,
};

const SYSTEM_PROMPT = `
You are an analytics assistant. 
Summarize the most important insights from the following JSON data.
Rules:
- Focus on large or meaningful changes.
- Ignore small/noisy differences.
- Write short bullet points.
- For each insight, suggest what chart/table to display.

`;

export async function getMistralChatResponse(input: string) {
  try {
    const response = await callMistralChat(input);
    const data = await response.json();
    console.log('Response: ');
    console.log(data);
    console.log(JSON.stringify(data));
    return data;
  } catch (e) {
    console.error(e);
  }

  return null;
}

async function callMistralChat(input: string) {
  const message = `${SYSTEM_PROMPT}\nData:\n${input}`;

  const messages = [
    {
      role: 'user',
      content: message,
    },
  ];

  const body = {
    ...BASE_PARAMS,
    messages,
  };

  console.log(JSON.stringify(body));
  console.log(env.MISTRAL_API_KEY);
  console.log(`Bearer ${env.MISTRAL_API_KEY}`);

  return fetch(CHAT_API, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.MISTRAL_API_KEY}`,
    },
  });
}
