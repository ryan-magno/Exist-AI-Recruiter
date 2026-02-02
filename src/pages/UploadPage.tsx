import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Check, Loader2, Sparkles, User, Plus, Building, Calendar, MessageSquare, X, AlertCircle, ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCVUploaderNames, useCreateCVUploader } from '@/hooks/useCVUploaders';
import { useDepartmentNames } from '@/hooks/useDepartments';
import { useJobOrders } from '@/hooks/useJobOrders';
import { useCreateCandidateFromWebhook } from '@/hooks/useCandidates';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: string;
  status: 'ready' | 'processing' | 'complete' | 'error';
  isInternal: boolean;
  department?: string;
  fromDate?: string;
  toDate?: string;
  uploadReason?: 'role-change' | 'benched' | 'other';
  otherReason?: string;
  applyingFor?: string; // 'ai-decide' or job order id
}

const UPLOAD_REASONS = [
  { value: 'role-change', label: 'Looking for Role Change' },
  { value: 'benched', label: 'Benched' },
  { value: 'other', label: 'Other' },
];

// Use our edge function as a proxy to bypass CORS issues with the n8n webhook
const WEBHOOK_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/azure-db/webhook-proxy`;

// Helper to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function UploadPage() {
  const navigate = useNavigate();
  const { isVectorized, setIsVectorized } = useApp();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploaderName, setUploaderName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [defaultIsInternal, setDefaultIsInternal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Database hooks
  const { data: existingUploaders = [], isLoading: loadingUploaders } = useCVUploaderNames();
  const { data: departmentNames = [], isLoading: loadingDepartments } = useDepartmentNames();
  const { data: jobOrders = [], isLoading: loadingJobOrders } = useJobOrders();
  const createUploader = useCreateCVUploader();
  const createCandidateFromWebhook = useCreateCandidateFromWebhook();

  // Auto-reset on page load (unless processing)
  useEffect(() => {
    if (!isProcessing) {
      setFiles([]);
      setIsVectorized(false);
      setUploaderName('');
      setDefaultIsInternal(false);
    }
  }, []); // Only run on mount

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
  }, [uploaderName, existingUploaders]);

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

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const validFiles = Array.from(fileList).filter(f => validTypes.includes(f.type));
    
    if (validFiles.length === 0) {
      toast.error('Please upload PDF or DOCX files only');
      return;
    }
    
    const invalidCount = fileList.length - validFiles.length;
    if (invalidCount > 0) {
      toast.warning(`${invalidCount} file(s) skipped - only PDF and DOCX are supported`);
    }
    
    const newFiles: UploadedFile[] = validFiles.map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      file,
      name: file.name,
      size: formatFileSize(file.size),
      status: 'ready',
      isInternal: defaultIsInternal,
      applyingFor: 'ai-decide',
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    toast.success(`${validFiles.length} file(s) added`);
  }, [defaultIsInternal]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!uploaderName.trim()) {
      toast.error('Please enter the uploader name first');
      return;
    }
    
    const droppedFiles = e.dataTransfer.files;
    processFiles(droppedFiles);
  }, [uploaderName, processFiles]);

  const handleClick = () => {
    if (!uploaderName.trim()) {
      toast.error('Please enter the uploader name first');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    processFiles(selectedFiles);
    e.target.value = ''; // Reset input to allow selecting same files again
  };

  const updateFile = (fileId: string, updates: Partial<UploadedFile>) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, ...updates } : f));
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleVectorize = async () => {
    if (!uploaderName.trim()) {
      toast.error('Please enter the uploader name first');
      return;
    }

    if (files.length === 0) {
      toast.error('Please upload at least one CV');
      return;
    }

    setIsProcessing(true);
    
    // Build FormData
    const formData = new FormData();
    formData.append('uploader_name', uploaderName.trim());
    formData.append('upload_timestamp', new Date().toISOString());
    formData.append('total_files', files.length.toString());
    
    // Append all files
    files.forEach(f => formData.append('files', f.file));
    
    // Build metadata array with job order info
    const metadata = files.map((f, index) => {
      const jobOrder = f.applyingFor && f.applyingFor !== 'ai-decide' 
        ? jobOrders.find(jo => jo.id === f.applyingFor) 
        : null;
      
      return {
        index,
        filename: f.name,
        size_bytes: f.file.size,
        applicant_type: f.isInternal ? 'internal' : 'external',
        applying_for: f.applyingFor === 'ai-decide' ? 'ai-decide' : {
          job_order_id: jobOrder?.id || null,
          job_order_title: jobOrder?.title || null,
          jo_number: jobOrder?.jo_number || null,
        },
        ...(f.isInternal && {
          from_date: f.fromDate || null,
          to_date: f.toDate || null,
          department: f.department || null,
          upload_reason: f.uploadReason || null,
          other_reason: f.uploadReason === 'other' ? f.otherReason : null,
        }),
      };
    });
    formData.append('metadata', JSON.stringify(metadata));
    
    // Update all files to processing status
    setFiles(prev => prev.map(f => ({ ...f, status: 'processing' as const })));
    
    // Show loading toast for long operations
    const loadingToastId = toast.loading('Processing CVs with AI... This may take a few minutes.', {
      duration: Infinity
    });
    
    try {
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5-minute timeout
      
      let response: Response;
      try {
        response = await fetch(WEBHOOK_PROXY_URL, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        // Check if it was an abort (timeout)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timed out. The AI processing is taking longer than expected. Please try again.');
        }
        // For network errors, provide a helpful message
        throw new Error('Network error connecting to AI service. Please check your connection and try again.');
      }
      
      if (!response.ok) {
        throw new Error(`Webhook failed with status: ${response.status}`);
      }
      
      // Parse response
      let result;
      try {
        result = await response.json();
        console.log('Webhook response:', result);
      } catch {
        console.log('Webhook returned non-JSON response');
        result = null;
      }
      
      toast.dismiss(loadingToastId);
      
      // Process webhook response and store candidates in database
      if (result && Array.isArray(result)) {
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < result.length; i++) {
          const webhookOutput = result[i]?.output;
          if (!webhookOutput) {
            console.warn(`Skipping result ${i}: no output field`);
            errorCount++;
            continue;
          }
          
          const fileMeta = metadata[i];
          try {
            await createCandidateFromWebhook.mutateAsync({
              webhook_output: webhookOutput,
              uploader_name: uploaderName.trim(),
              applicant_type: fileMeta.applicant_type === 'internal' ? 'internal' : 'external',
              job_order_id: typeof fileMeta.applying_for === 'object' 
                ? fileMeta.applying_for?.job_order_id 
                : null,
              internal_metadata: fileMeta.applicant_type === 'internal' ? {
                from_date: fileMeta.from_date || undefined,
                to_date: fileMeta.to_date || undefined,
                department: fileMeta.department || undefined,
                upload_reason: fileMeta.upload_reason || undefined,
              } : null
            });
            successCount++;
            // Mark this file as complete
            setFiles(prev => prev.map((f, idx) => 
              idx === i ? { ...f, status: 'complete' as const } : f
            ));
          } catch (err) {
            console.error(`Error storing candidate ${i}:`, err);
            errorCount++;
            // Mark this file as error
            setFiles(prev => prev.map((f, idx) => 
              idx === i ? { ...f, status: 'error' as const } : f
            ));
          }
        }
        
        if (successCount > 0) {
          toast.success(`${successCount} candidate(s) processed and stored successfully`);
        }
        if (errorCount > 0) {
          toast.warning(`${errorCount} candidate(s) failed to store`);
        }
      } else {
        // Mark all as complete even if no structured response (webhook succeeded)
        setFiles(prev => prev.map(f => ({ ...f, status: 'complete' as const })));
        toast.success('CVs processed successfully');
      }
      
      setIsVectorized(true);
      
      // Save uploader name to database
      try {
        await createUploader.mutateAsync(uploaderName.trim());
      } catch (error) {
        console.error('Error saving uploader:', error);
      }
      
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      toast.dismiss(loadingToastId);
      // Mark all as error
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' as const })));
      const errorMessage = error instanceof Error ? error.message : 'Failed to process CVs';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectSuggestion = (name: string) => {
    setUploaderName(name);
    setShowSuggestions(false);
  };

  const handleAddNewName = async () => {
    if (uploaderName.trim() && !existingUploaders.some(n => n.toLowerCase() === uploaderName.toLowerCase())) {
      try {
        await createUploader.mutateAsync(uploaderName.trim());
        toast.success(`"${uploaderName}" added as a new uploader`);
      } catch (error) {
        console.error('Error adding uploader:', error);
      }
    }
    setShowSuggestions(false);
  };

  const isNewName = uploaderName.trim() && !existingUploaders.some(
    name => name.toLowerCase() === uploaderName.toLowerCase()
  );

  // Get active job orders for the dropdown
  const activeJobOrders = jobOrders.filter(jo => jo.status === 'in-progress' || jo.status === 'draft');

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">CV Ingestion & Vectorization</h1>
          <p className="text-muted-foreground">Upload candidate CVs to enable AI-powered matching.</p>
        </div>

        {/* Uploader Name Field */}
        <div className="bg-card rounded-xl border shadow-sm p-5 mb-6">
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <User className="w-4 h-4 text-muted-foreground" />
              Uploaded By <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                ref={inputRef}
                placeholder={loadingUploaders ? "Loading..." : "Enter your name..."}
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                className={cn(
                  "h-11",
                  isVectorized && "opacity-50"
                )}
                disabled={isVectorized || loadingUploaders}
              />
              
              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && !isVectorized && !loadingUploaders && (
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
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                          >
                            <User className="w-4 h-4 text-muted-foreground" />
                            {name}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2.5 text-sm text-muted-foreground">
                          No matching names found
                        </div>
                      )}
                      
                      {/* Add new name option */}
                      {isNewName && (
                        <button
                          type="button"
                          onClick={handleAddNewName}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-primary/10 transition-colors flex items-center gap-2 border-t text-primary font-medium"
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

        {/* Internal/External Classification */}
        <div className="bg-card rounded-xl border shadow-sm p-5 mb-6">
          <Label className="flex items-center gap-2 text-sm font-medium mb-4">
            <User className="w-4 h-4 text-muted-foreground" />
            Default Applicant Type
          </Label>
          <RadioGroup
            value={defaultIsInternal ? 'internal' : 'external'}
            onValueChange={(val) => {
              setDefaultIsInternal(val === 'internal');
              // Update existing files
              setFiles(prev => prev.map(f => ({ ...f, isInternal: val === 'internal' })));
            }}
            className="flex gap-6"
            disabled={isVectorized}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="external" id="external" />
              <Label htmlFor="external" className="cursor-pointer font-normal">External Applicant</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="internal" id="internal" />
              <Label htmlFor="internal" className="cursor-pointer font-normal">Internal Employee</Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground mt-3">
            Internal employees will have additional fields for dates and department
          </p>
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
              <div className="p-5 border-b bg-muted/30">
                <h3 className="font-medium text-foreground">Uploaded Files ({files.length})</h3>
                {uploaderName && (
                  <p className="text-sm text-muted-foreground mt-1">Uploaded by: {uploaderName}</p>
                )}
              </div>
              <div className="divide-y">
                {files.map((file, index) => (
                  <FileRow 
                    key={file.id} 
                    file={file} 
                    index={index} 
                    onUpdate={(updates) => updateFile(file.id, updates)}
                    onRemove={() => removeFile(file.id)}
                    departments={departmentNames}
                    jobOrders={activeJobOrders}
                    disabled={isVectorized || file.status !== 'ready'}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center gap-4">
          <Button 
            size="lg" 
            onClick={handleVectorize} 
            disabled={files.length === 0 || isProcessing || !uploaderName.trim()} 
            className="gap-2 px-8"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Vectorize Documents
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

interface FileRowProps {
  file: UploadedFile;
  index: number;
  onUpdate: (updates: Partial<UploadedFile>) => void;
  onRemove: () => void;
  departments: string[];
  jobOrders: Array<{ id: string; title: string; jo_number: string }>;
  disabled: boolean;
}

function FileRow({ file, index, onUpdate, onRemove, departments, jobOrders, disabled }: FileRowProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ delay: index * 0.05 }} 
      className="p-5"
    >
      {/* File Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{file.name}</p>
          <p className="text-sm text-muted-foreground">{file.size}</p>
        </div>
        <div className="flex items-center gap-3">
          {file.status === 'ready' && (
            <>
              <span className="status-badge bg-secondary text-secondary-foreground">Ready</span>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-muted rounded-md transition-colors"
                title={isExpanded ? "Collapse settings" : "Expand settings"}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              <button
                onClick={onRemove}
                className="p-2 hover:bg-destructive/10 rounded-md transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
              </button>
            </>
          )}
          {file.status === 'processing' && (
            <span className="status-badge bg-primary/10 text-primary">
              <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
              Processing
            </span>
          )}
          {file.status === 'complete' && (
            <span className="status-badge bg-primary text-primary-foreground">
              <Check className="w-3 h-3 mr-1.5" />
              Complete
            </span>
          )}
          {file.status === 'error' && (
            <span className="status-badge bg-destructive text-destructive-foreground">
              <AlertCircle className="w-3 h-3 mr-1.5" />
              Error
            </span>
          )}
        </div>
      </div>

      {/* Expandable Settings */}
      <AnimatePresence>
        {isExpanded && file.status === 'ready' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-16 space-y-5 border-l-2 border-muted pl-5"
          >
            {/* Applicant Type Toggle */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Internal Employee</Label>
                  <p className="text-xs text-muted-foreground">Toggle on if this is an internal applicant</p>
                </div>
              </div>
              <Switch
                checked={file.isInternal}
                onCheckedChange={(checked) => onUpdate({ isInternal: checked })}
                disabled={disabled}
              />
            </div>

            {/* Applying For / Fit For */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Applying / Fit For</Label>
                <span className="text-xs text-muted-foreground">(Optional)</span>
              </div>
              <Select
                value={file.applyingFor || 'ai-decide'}
                onValueChange={(val) => onUpdate({ applyingFor: val })}
                disabled={disabled}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Let AI decide" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai-decide">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Let AI decide
                    </span>
                  </SelectItem>
                  {jobOrders.map(jo => (
                    <SelectItem key={jo.id} value={jo.id}>
                      {jo.jo_number} - {jo.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a specific job order or let AI match based on skills
              </p>
            </div>

            {/* Internal Employee Fields */}
            {file.isInternal && (
              <>
                {/* Employment Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">From Date</Label>
                    </div>
                    <Input
                      type="date"
                      value={file.fromDate || ''}
                      onChange={(e) => onUpdate({ fromDate: e.target.value })}
                      className="h-10"
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">To Date</Label>
                    </div>
                    <Input
                      type="date"
                      value={file.toDate || ''}
                      onChange={(e) => onUpdate({ toDate: e.target.value })}
                      className="h-10"
                      disabled={disabled}
                    />
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Department</Label>
                  </div>
                  <Select
                    value={file.department || ''}
                    onValueChange={(val) => onUpdate({ department: val })}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Upload Reason */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Reason for Upload</Label>
                  </div>
                  <Select
                    value={file.uploadReason || ''}
                    onValueChange={(val) => onUpdate({ uploadReason: val as UploadedFile['uploadReason'] })}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {UPLOAD_REASONS.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Other Reason Input */}
                {file.uploadReason === 'other' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Specify Reason</Label>
                    <Input
                      placeholder="Enter the reason..."
                      value={file.otherReason || ''}
                      onChange={(e) => onUpdate({ otherReason: e.target.value })}
                      className="h-10"
                      disabled={disabled}
                    />
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
