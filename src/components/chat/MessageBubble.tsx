import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Copy, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { ChatMessage } from '@/types/chat.types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex gap-2', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}

      <div className={cn('max-w-[80%] group', isUser ? 'items-end' : 'items-start')}>
        <Card
          className={cn(
            'px-4 py-3 relative',
            isUser
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border',
            message.isStreaming && 'animate-pulse'
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm leading-relaxed text-foreground">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => <h2 className="text-base font-bold mt-6 mb-3 text-foreground border-b border-border pb-1">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mt-6 mb-3 text-foreground">{children}</h3>,
                  p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-6 my-4 space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-6 my-4 space-y-2">{children}</ol>,
                  li: ({ children }) => <li className="text-foreground">{children}</li>,
                  hr: () => <hr className="my-6 border-t border-border" />,
                  strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                  code: ({ children }) => <code className="text-primary bg-muted px-1 py-0.5 rounded text-xs">{children}</code>,
                  pre: ({ children }) => <pre className="bg-muted border border-border rounded-md p-3 my-4 overflow-x-auto">{children}</pre>,
                  blockquote: ({ children }) => <blockquote className="border-l-2 border-primary bg-muted/50 py-1 px-4 my-4">{children}</blockquote>,
                }}
              >
                {message.content || '...'}
              </ReactMarkdown>
            </div>
          )}

          {!isUser && message.content && !message.isStreaming && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
          )}
        </Card>

        <span className="text-[10px] text-muted-foreground mt-1 px-1 block">
          {format(message.timestamp, 'h:mm a')}
        </span>
      </div>
    </motion.div>
  );
}
