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
            <div className="prose prose-sm max-w-none dark:prose-invert 
              prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
              prose-h2:text-base prose-h2:border-b prose-h2:border-border prose-h2:pb-1
              prose-h3:text-sm
              prose-p:text-foreground prose-p:my-2 prose-p:leading-relaxed
              prose-strong:text-foreground prose-strong:font-semibold
              prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4
              prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-4
              prose-li:my-0.5 prose-li:text-foreground
              prose-hr:my-4 prose-hr:border-border
              prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
              prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-4
              prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-md prose-pre:p-3
              [&_br]:block [&_br]:my-1">
              <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
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
