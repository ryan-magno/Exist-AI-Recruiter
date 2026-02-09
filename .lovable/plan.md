

# n8n Streaming Chatbot Integration

## Overview

Transform the currently disabled chatbot page into a fully functional AI assistant that streams responses from an n8n webhook endpoint using Server-Sent Events (SSE). The chat will support markdown rendering, session persistence, and a polished UI.

## File Structure

New files to create:
- `src/types/chat.types.ts` -- TypeScript interfaces
- `src/lib/chatApi.ts` -- SSE streaming handler
- `src/lib/chatStorage.ts` -- localStorage helpers
- `src/hooks/useStreamingChat.ts` -- Custom hook for chat logic
- `src/components/chat/MessageBubble.tsx` -- Individual message component with copy button and timestamp
- `src/components/chat/ChatInput.tsx` -- Input field with send button and rate limiting

Files to modify:
- `src/pages/ChatbotPage.tsx` -- Replace disabled demo with live chat UI

## Implementation Details

### 1. Types (`src/types/chat.types.ts`)

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface StreamOptions {
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}
```

### 2. Streaming API (`src/lib/chatApi.ts`)

- POST to `https://workflow.exist.com.ph/webhook/51c69627-4831-44a4-8d91-1824a7d38ebf`
- Send `{ chatInput, sessionId }` as JSON
- Set `Accept: text/event-stream` header
- Parse SSE line-by-line, handling `data: {"type":"message","data":"..."}` format
- Handle `[DONE]` sentinel
- 30-second timeout via AbortController
- Graceful handling of network errors, 500s, and malformed JSON

### 3. Storage (`src/lib/chatStorage.ts`)

- `getSessionId()` -- Reads or creates a `sessionId` in localStorage
- `saveMessages(messages)` -- Saves last 50 messages to localStorage
- `loadMessages()` -- Loads persisted messages (deserializes timestamps)
- `clearSession()` -- Clears sessionId and messages

### 4. Custom Hook (`src/hooks/useStreamingChat.ts`)

Manages all chat state:
- `messages` -- Array of `ChatMessage`, initialized from localStorage
- `isStreaming` -- Boolean flag
- `sendMessage(input)` -- Appends user message, creates empty assistant message, calls streaming API, updates assistant message content on each chunk
- `clearChat()` -- Resets session
- Rate limiting: 2-second cooldown between sends
- Auto-persists messages to localStorage after each update
- Retry logic: up to 3 attempts with exponential backoff on failure

### 5. Message Bubble (`src/components/chat/MessageBubble.tsx`)

- User messages: right-aligned, primary color background
- Assistant messages: left-aligned, card background with border, Bot icon avatar
- Markdown rendering via `ReactMarkdown` for assistant messages (reusing existing prose styles)
- Copy button (clipboard icon) on hover for assistant messages
- Timestamp displayed below each message (formatted with `date-fns`)
- Pulsing animation on the bubble when `isStreaming` is true

### 6. Chat Input (`src/components/chat/ChatInput.tsx`)

- Textarea (not single-line input) for multiline support
- Send button with Send icon
- Enter to send, Shift+Enter for newline
- Disabled state during streaming with "AI is thinking..." placeholder
- Rate limit indicator (brief disabled state after send)

### 7. ChatbotPage Refactor (`src/pages/ChatbotPage.tsx`)

- Remove the "Coming Soon" / disabled overlay
- Replace demo messages with the welcome message as initial assistant message
- Header: Bot icon, title "HR Assistant", subtitle "AI-powered recruitment chatbot", green "Online" status badge
- "Clear Chat" button in header
- Message area: ScrollArea with auto-scroll to bottom on new messages (using `useRef` + `scrollIntoView`)
- Wire up `useStreamingChat` hook for all state and actions
- Mobile responsive layout (full height, flex column)

## Data Flow

```
User types message -> ChatInput
  -> useStreamingChat.sendMessage()
    -> Append user message to state
    -> Append empty assistant message
    -> chatApi.sendStreamingMessage() via POST
      -> SSE chunks arrive
      -> onChunk updates last assistant message content
      -> onComplete sets isStreaming=false
    -> Messages auto-saved to localStorage
```

## Error Handling

- Network failures: Toast notification + error message in chat ("Failed to connect to assistant. Please try again.")
- Mid-stream disconnection: Partial response preserved, error appended, input re-enabled
- 500 from n8n: Retry up to 3 times with backoff, then show error
- Malformed SSE: Skip bad lines silently, continue processing
- Rate limit: 2-second cooldown enforced client-side with disabled send button

## Welcome Message

The initial assistant message (shown on first load / after clear):
```
Hi! I'm your HR Assistant. I can help you with candidate searches, job order analysis, interview preparation, and more.

Try asking me something like:
- "Who are the best candidates for our Data Engineer position?"
- "Summarize the qualifications of the latest applicants"
- "Generate interview questions for a Senior Developer role"
```
