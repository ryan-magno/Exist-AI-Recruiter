import type { StreamOptions } from '@/types/chat.types';

const WEBHOOK_URL = 'https://workflow.exist.com.ph/webhook/51c69627-4831-44a4-8d91-1824a7d38ebf';
const TIMEOUT_MS = 30_000;

export async function sendStreamingMessage(
  chatInput: string,
  sessionId: string,
  options: StreamOptions
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    console.log('1. Sending request to n8n:', { chatInput, sessionId });

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ chatInput, sessionId }),
      signal: controller.signal,
    });

    console.log('2. Response status:', response.status, response.ok);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('3. Raw response data:', data);

    if (!Array.isArray(data) || !data[0]?.output) {
      console.error('Invalid response structure:', data);
      throw new Error('Invalid response format from n8n');
    }

    const aiMessage = data[0].output;
    console.log('4. Extracted AI message:', aiMessage.substring(0, 100) + '...');

    if (!aiMessage || aiMessage.trim() === '') {
      throw new Error('Empty response from AI');
    }

    options.onChunk(aiMessage);
    options.onComplete();
  } catch (error) {
    if (controller.signal.aborted && !options.signal?.aborted) {
      options.onError(new Error('Request timed out after 30 seconds'));
    } else {
      options.onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
