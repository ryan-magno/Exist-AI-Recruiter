import { useState, useRef, useCallback, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  error?: boolean;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Enter text...', 
  className,
  minHeight = '120px',
  error = false
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const isInitialMount = useRef(true);

  // Only set innerHTML on initial mount or when value changes externally
  useEffect(() => {
    if (editorRef.current && isInitialMount.current) {
      editorRef.current.innerHTML = value || '';
      isInitialMount.current = false;
    }
  }, []);

  // Update content when value prop changes externally (not from user input)
  useEffect(() => {
    if (editorRef.current && !isFocused) {
      const currentContent = editorRef.current.innerHTML;
      if (currentContent !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, isFocused]);

  const execCommand = useCallback((command: string, commandValue?: string) => {
    document.execCommand(command, false, commandValue);
    editorRef.current?.focus();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const isEmpty = !value || value === '<br>' || value === '<p></p>' || value === '<div></div>';

  return (
    <div className={cn(
      'rounded-md border bg-background',
      isFocused && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
      error && 'border-destructive focus-visible:ring-destructive',
      className
    )}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1 border-b bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => execCommand('bold')}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => execCommand('italic')}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => execCommand('formatBlock', 'h1')}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => execCommand('formatBlock', 'h2')}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => execCommand('insertUnorderedList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => execCommand('insertOrderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          className={cn(
            'px-3 py-2 text-sm outline-none prose prose-sm max-w-none overflow-auto',
            '[&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-2 [&_h1]:mb-1',
            '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-2 [&_h2]:mb-1',
            '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1',
            '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1',
            '[&_li]:my-0.5',
            '[&_p]:my-1',
            '[&_strong]:font-bold',
            '[&_em]:italic'
          )}
          style={{ minHeight }}
          onInput={handleInput}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          suppressContentEditableWarning
        />
        {isEmpty && !isFocused && (
          <div className="absolute top-2 left-3 text-muted-foreground text-sm pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}

// Component to render rich text content
export function RichTextContent({ content, className }: { content: string; className?: string }) {
  return (
    <div 
      className={cn(
        'prose prose-sm max-w-none',
        '[&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-2 [&_h1]:mb-1',
        '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-2 [&_h2]:mb-1',
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1',
        '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1',
        '[&_li]:my-0.5',
        '[&_p]:my-1',
        '[&_strong]:font-bold',
        '[&_em]:italic',
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
