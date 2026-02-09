import type { ChatMessage } from '@/types/chat.types';

const SESSION_KEY = 'hr-chat-session-id';
const MESSAGES_KEY = 'hr-chat-messages';
const MAX_MESSAGES = 50;

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function saveMessages(messages: ChatMessage[]): void {
  const toSave = messages.slice(-MAX_MESSAGES).map(m => ({
    ...m,
    timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
    isStreaming: undefined,
  }));
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(toSave));
}

export function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Omit<ChatMessage, 'timestamp'> & { timestamp: string }>;
    return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(MESSAGES_KEY);
}
