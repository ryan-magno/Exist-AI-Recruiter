import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Check, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  status: 'ready' | 'processing' | 'complete';
}

const demoFiles: UploadedFile[] = [
  { id: '1', name: 'Maria_Santos_CV.pdf', size: '245 KB', status: 'ready' },
  { id: '2', name: 'John_Rodriguez_Resume.docx', size: '189 KB', status: 'ready' },
  { id: '3', name: 'Angela_Cruz_CV.pdf', size: '312 KB', status: 'ready' },
  { id: '4', name: 'Michael_Tan_Resume.pdf', size: '278 KB', status: 'ready' },
  { id: '5', name: 'Patricia_Reyes_CV.docx', size: '156 KB', status: 'ready' },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const { isVectorized, setIsVectorized } = useApp();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setFiles(demoFiles);
    toast.success('Files uploaded successfully');
  }, []);

  const handleClick = () => {
    setFiles(demoFiles);
    toast.success('Files uploaded successfully');
  };

  const handleVectorize = async () => {
    setIsProcessing(true);
    
    for (let i = 0; i < files.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 400));
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'processing' } : f));
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    setFiles(prev => prev.map(f => ({ ...f, status: 'complete' })));
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsVectorized(true);
    setIsProcessing(false);
    toast.success('Vectorization Complete: 15 Candidates Processed');
    
    setTimeout(() => navigate('/dashboard'), 1000);
  };

  const handleStartOver = () => {
    setFiles([]);
    setIsVectorized(false);
    toast.info('Ready for new uploads');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">CV Ingestion & Vectorization</h1>
          <p className="text-muted-foreground">Upload candidate CVs to enable AI-powered matching.</p>
        </div>

        <div
          className={cn(
            'dropzone text-center mb-6',
            isDragging && 'dropzone-active',
            isVectorized && 'opacity-50 pointer-events-none'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground mb-1">Drag and drop CVs here</p>
              <p className="text-sm text-muted-foreground">Supports PDF, DOCX files • Click to browse</p>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card rounded-xl border shadow-sm mb-6 overflow-hidden">
              <div className="p-4 border-b bg-muted/30">
                <h3 className="font-medium text-foreground">Uploaded Files ({files.length})</h3>
              </div>
              <div className="divide-y">
                {files.map((file, index) => (
                  <motion.div key={file.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{file.size}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status === 'ready' && <span className="status-badge bg-secondary text-secondary-foreground">Ready</span>}
                      {file.status === 'processing' && <span className="status-badge bg-primary/10 text-primary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing</span>}
                      {file.status === 'complete' && <span className="status-badge bg-primary text-primary-foreground"><Check className="w-3 h-3 mr-1" />Complete</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center gap-4">
          {isVectorized ? (
            <Button size="lg" variant="outline" onClick={handleStartOver} className="gap-2 px-8">
              <RotateCcw className="w-5 h-5" />
              Start Over
            </Button>
          ) : (
            <Button size="lg" onClick={handleVectorize} disabled={files.length === 0 || isProcessing} className="gap-2 px-8">
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Processing...</> : <><Sparkles className="w-5 h-5" />Vectorize Documents</>}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
