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

  // Merge caller signal with timeout
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ chatInput, sessionId }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
        buffer = buffer.slice(newlineIndex + 1);

        if (!line.startsWith('data: ')) continue;

        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          options.onComplete();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'message' && typeof parsed.data === 'string') {
            options.onChunk(parsed.data);
          }
        } catch {
          // skip malformed JSON
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      for (const raw of buffer.split('\n')) {
        const line = raw.replace(/\r$/, '');
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'message' && typeof parsed.data === 'string') {
            options.onChunk(parsed.data);
          }
        } catch { /* ignore */ }
      }
    }

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
