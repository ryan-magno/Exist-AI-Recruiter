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
    console.log('NDJSON: Sending request to n8n:', { chatInput, sessionId });

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ chatInput, sessionId }),
      signal: controller.signal,
    });

    console.log('NDJSON: Response status:', response.status, response.ok);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIdx;
      while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIdx).trim();
        buffer = buffer.slice(newlineIdx + 1);

        if (!line) continue;

        try {
          const parsed = JSON.parse(line);

          if (parsed.type === 'item' && parsed.content) {
            // Skip wrapped JSON from "Respond to Webhook" node
            if (parsed.content.startsWith('{') && parsed.content.includes('"output"')) {
              console.log('Skipping wrapped JSON from Respond to Webhook node');
              continue;
            }
            accumulated += parsed.content;
            options.onChunk(accumulated);
          } else if (parsed.type === 'end') {
            console.log('Stream ended, accumulated:', accumulated.length, 'chars');
            options.onComplete();
            return;
          }
        } catch {
          console.warn('NDJSON: Failed to parse line:', line);
        }
      }
    }

    console.log('NDJSON: Stream ended, accumulated length:', accumulated.length);
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
