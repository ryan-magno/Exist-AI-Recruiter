import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/types/chat.types';
import { sendStreamingMessage } from '@/lib/chatApi';
import { getSessionId, saveMessages, loadMessages, clearSession } from '@/lib/chatStorage';
import { toast } from '@/hooks/use-toast';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `Hi! I'm your HR Assistant. I can help you with candidate searches, job order analysis, interview preparation, and more.

Try asking me something like:
- "Who are the best candidates for our Data Engineer position?"
- "Summarize the qualifications of the latest applicants"
- "Generate interview questions for a Senior Developer role"`,
  timestamp: new Date(),
};

const RATE_LIMIT_MS = 2000;
const MAX_RETRIES = 3;

export function useStreamingChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = loadMessages();
    return saved.length > 0 ? saved : [WELCOME_MESSAGE];
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const lastSendRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const sessionId = useRef(getSessionId());

  // Persist messages when they change (skip streaming updates for perf)
  const persistRef = useRef(messages);
  persistRef.current = messages;

  useEffect(() => {
    if (!isStreaming) {
      saveMessages(persistRef.current);
    }
  }, [isStreaming, messages]);

  const sendMessage = useCallback(async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    // Rate limit
    const now = Date.now();
    if (now - lastSendRef.current < RATE_LIMIT_MS) {
      toast({ title: 'Please wait', description: 'You can send another message in a moment.', variant: 'default' });
      return;
    }
    lastSendRef.current = now;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let contentSoFar = '';
    let attempt = 0;
    let success = false;

    while (attempt < MAX_RETRIES && !success) {
      attempt++;
      try {
        await sendStreamingMessage(trimmed, sessionId.current, {
          signal: controller.signal,
          onChunk: (chunk) => {
            contentSoFar = chunk;
            const snapshot = contentSoFar;
            setMessages(prev =>
              prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: snapshot } : m
              )
            );
          },
          onComplete: () => {
            success = true;
          },
          onError: (error) => {
            throw error;
          },
        });
        success = true;
      } catch (err) {
        if (controller.signal.aborted) break;
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
          contentSoFar = '';
        } else {
          const errorContent = contentSoFar
            ? `${contentSoFar}\n\n---\n*Connection lost. Response may be incomplete.*`
            : 'Failed to connect to assistant. Please try again.';
          setMessages(prev =>
            prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: errorContent, isStreaming: false } : m
            )
          );
          toast({ title: 'Error', description: err instanceof Error ? err.message : 'Connection failed', variant: 'destructive' });
        }
      }
    }

    // Finalize
    setMessages(prev =>
      prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, isStreaming: false } : m
      )
    );
    setIsStreaming(false);
    abortRef.current = null;
  }, [isStreaming]);

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    clearSession();
    sessionId.current = getSessionId();
    setMessages([{ ...WELCOME_MESSAGE, id: crypto.randomUUID(), timestamp: new Date() }]);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, sendMessage, clearChat };
}
