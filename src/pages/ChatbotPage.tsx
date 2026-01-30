import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const DEMO_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: `# Welcome to the HR Assistant 👋

I'm your AI-powered recruitment assistant. I can help you with:

- **Candidate Search**: Find candidates matching specific criteria
- **Job Order Analysis**: Get insights on job requirements
- **Interview Preparation**: Generate interview questions
- **Document Summarization**: Summarize CVs and reports

> This feature is currently in development. Stay tuned for updates!

---

*Example capabilities:*

\`\`\`
// Search for candidates
find candidates with Java AND AWS skills
filter by 5+ years experience
\`\`\`

Feel free to ask me anything once this feature goes live!`
  }
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [input, setInput] = useState('');
  const isDisabled = true; // Feature is grayed out

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Feature disabled
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <Bot className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">HR Assistant</h1>
          <p className="text-xs text-muted-foreground">AI-powered recruitment chatbot</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground bg-muted px-3 py-1.5 rounded-full text-xs">
          <Lock className="w-3 h-3" />
          Coming Soon
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <Card
              className={cn(
                'max-w-[80%] p-4',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border'
              )}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-pre:bg-muted prose-pre:border prose-pre:border-border">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm">{message.content}</p>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Disabled overlay message */}
      <div className="p-4 bg-muted/50 border-t border-border">
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-3">
          <Lock className="w-4 h-4" />
          <span>This feature is under development</span>
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isDisabled}
            className="flex-1 opacity-50 cursor-not-allowed"
          />
          <Button type="submit" disabled={isDisabled} className="opacity-50 cursor-not-allowed">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
