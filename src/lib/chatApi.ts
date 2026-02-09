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
          const eventType = String(parsed.type || '').trim();

          console.log(`NDJSON event: type="${eventType}", hasContent=${parsed.hasOwnProperty('content')}`);

          if (eventType === 'item' && parsed.hasOwnProperty('content')) {
            const content = String(parsed.content);

            // Skip wrapped JSON ONLY if it's definitely the Respond to Webhook output
            if (content.startsWith('{') && content.includes('"output"') && content.includes('\\"')) {
              console.log('NDJSON: Skipping wrapped JSON from Respond to Webhook');
              continue;
            }

            accumulated += content;
            console.log(`NDJSON chunk: +${content.length} chars, total: ${accumulated.length}`);
            options.onChunk(accumulated);
          } else if (eventType === 'end') {
            console.log('NDJSON: end event, accumulated:', accumulated.length, 'chars');
            if (accumulated.length > 0) {
              options.onComplete();
              return;
            }
            console.log('NDJSON: ignoring end event (no content yet)');
          }
        } catch {
          console.warn('NDJSON: Failed to parse line:', line.substring(0, 200));
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
