import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Check, Loader2, Sparkles, RotateCcw, User, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

// Mock list of uploaders for suggestions
const existingUploaders = [
  'John Smith',
  'Jane Doe',
  'Maria Garcia',
  'David Chen',
  'Sarah Johnson',
  'Michael Brown',
  'Emily Davis',
  'Robert Wilson',
];

export default function UploadPage() {
  const navigate = useNavigate();
  const { isVectorized, setIsVectorized } = useApp();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploaderName, setUploaderName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (uploaderName.trim()) {
      const filtered = existingUploaders.filter(name =>
        name.toLowerCase().includes(uploaderName.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(existingUploaders);
    }
  }, [uploaderName]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    
    if (!uploaderName.trim()) {
      toast.error('Please enter the uploader name first');
      return;
    }
    
    setFiles(demoFiles);
    toast.success('Files uploaded successfully');
  }, [uploaderName]);

  const handleClick = () => {
    if (!uploaderName.trim()) {
      toast.error('Please enter the uploader name first');
      return;
    }
    
    setFiles(demoFiles);
    toast.success('Files uploaded successfully');
  };

  const handleVectorize = async () => {
    if (!uploaderName.trim()) {
      toast.error('Please enter the uploader name first');
      return;
    }

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
    toast.success(`Vectorization Complete: 15 Candidates Processed (Uploaded by ${uploaderName})`);
    
    setTimeout(() => navigate('/dashboard'), 1000);
  };

  const handleStartOver = () => {
    setFiles([]);
    setIsVectorized(false);
    setUploaderName('');
    toast.info('Ready for new uploads');
  };

  const handleSelectSuggestion = (name: string) => {
    setUploaderName(name);
    setShowSuggestions(false);
  };

  const handleAddNewName = () => {
    if (uploaderName.trim() && !existingUploaders.includes(uploaderName.trim())) {
      toast.success(`"${uploaderName}" will be added as a new uploader`);
    }
    setShowSuggestions(false);
  };

  const isNewName = uploaderName.trim() && !existingUploaders.some(
    name => name.toLowerCase() === uploaderName.toLowerCase()
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">CV Ingestion & Vectorization</h1>
          <p className="text-muted-foreground">Upload candidate CVs to enable AI-powered matching.</p>
        </div>

        {/* Uploader Name Field */}
        <div className="bg-card rounded-xl border shadow-sm p-4 mb-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <User className="w-4 h-4 text-muted-foreground" />
              Uploaded By *
            </Label>
            <div className="relative">
              <Input
                ref={inputRef}
                placeholder="Enter your name..."
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                className={cn(
                  "h-10",
                  isVectorized && "opacity-50"
                )}
                disabled={isVectorized}
              />
              
              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && !isVectorized && (
                  <motion.div
                    ref={suggestionsRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden"
                  >
                    <div className="max-h-48 overflow-y-auto">
                      {filteredSuggestions.length > 0 ? (
                        filteredSuggestions.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => handleSelectSuggestion(name)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                          >
                            <User className="w-4 h-4 text-muted-foreground" />
                            {name}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No matching names found
                        </div>
                      )}
                      
                      {/* Add new name option */}
                      {isNewName && (
                        <button
                          type="button"
                          onClick={handleAddNewName}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors flex items-center gap-2 border-t text-primary font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          Add "{uploaderName}" as new uploader
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="text-xs text-muted-foreground">
              Start typing to see suggestions or add a new name
            </p>
          </div>
        </div>

        <div
          className={cn(
            'dropzone text-center mb-6',
            isDragging && 'dropzone-active',
            isVectorized && 'opacity-50 pointer-events-none',
            !uploaderName.trim() && 'opacity-70'
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
              {!uploaderName.trim() && (
                <p className="text-sm text-amber-600 mt-2 font-medium">Please enter your name above first</p>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card rounded-xl border shadow-sm mb-6 overflow-hidden">
              <div className="p-4 border-b bg-muted/30">
                <h3 className="font-medium text-foreground">Uploaded Files ({files.length})</h3>
                {uploaderName && (
                  <p className="text-xs text-muted-foreground mt-1">Uploaded by: {uploaderName}</p>
                )}
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
            <Button size="lg" onClick={handleVectorize} disabled={files.length === 0 || isProcessing || !uploaderName.trim()} className="gap-2 px-8">
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Processing...</> : <><Sparkles className="w-5 h-5" />Vectorize Documents</>}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
