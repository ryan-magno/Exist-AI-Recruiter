

# CV Upload with n8n Webhook Integration

## Summary
Replace the simulated CV upload process with real file uploads from the user's local machine. When files are uploaded and the "Vectorize" button is clicked, send the CVs and their metadata to the n8n webhook at `https://workflow.exist.com.ph/webhook/vector-db-loader` using FormData. The app will wait for the webhook response before showing success/failure.

## User Flow

1. User enters their name in "Uploaded By" field
2. User selects default applicant type (External/Internal)
3. User drags and drops or clicks to select CV files (PDF, DOCX) from their local machine
4. Files appear in the list with editable metadata per file:
   - Type (Internal/External) - can override per file
   - For Internal: From Date, To Date, Department, Reason
5. User clicks "Vectorize Documents" button
6. App sends files + metadata to n8n webhook as FormData
7. App shows processing status while waiting for webhook response
8. On success: Shows success message and navigates to dashboard
9. On failure: Shows error message from webhook

## Changes Overview

### 1. Update UploadPage.tsx
- **Remove**: The `demoFiles` mock data array
- **Add**: Hidden file input element with `accept=".pdf,.docx"`
- **Add**: State to store actual `File` objects alongside metadata
- **Modify**: `handleDrop` to process actual dropped files from `e.dataTransfer.files`
- **Modify**: `handleClick` to trigger the hidden file input
- **Add**: `handleFileSelect` to process files from the file input
- **Modify**: `handleVectorize` to call the n8n webhook with FormData

### 2. Update UploadedFile Interface
```text
interface UploadedFile {
  id: string;
  file: File;           // Add: actual File object
  name: string;
  size: string;
  status: 'ready' | 'processing' | 'complete' | 'error';  // Add 'error' status
  isInternal: boolean;
  department?: string;
  fromDate?: string;
  toDate?: string;
  uploadReason?: 'role-change' | 'benched' | 'other';
  otherReason?: string;
}
```

### 3. Webhook Payload Structure
The FormData will be structured to allow n8n to iterate over each file with its metadata:

```text
FormData {
  // Global metadata
  "uploader_name": "Gabriel Magno"
  "upload_timestamp": "2026-01-31T10:30:00.000Z"
  "total_files": "3"
  
  // Per-file data (indexed for easy iteration)
  "files": [File, File, File]  // Array of actual files
  
  // Metadata as JSON array (parallel to files array)
  "metadata": JSON.stringify([
    {
      "index": 0,
      "filename": "John_Doe_CV.pdf",
      "size_bytes": 245000,
      "applicant_type": "external"
    },
    {
      "index": 1,
      "filename": "Jane_Smith_CV.pdf", 
      "size_bytes": 312000,
      "applicant_type": "internal",
      "from_date": "2024-01-15",
      "to_date": "2026-01-31",
      "department": "Engineering",
      "upload_reason": "role-change",
      "other_reason": null
    },
    {
      "index": 2,
      "filename": "Mike_Johnson_CV.docx",
      "size_bytes": 189000,
      "applicant_type": "internal",
      "from_date": "2023-06-01",
      "to_date": null,
      "department": "Product",
      "upload_reason": "other",
      "other_reason": "Career development"
    }
  ])
}
```

### 4. Updated handleVectorize Function
```text
const handleVectorize = async () => {
  // Validation
  if (!uploaderName.trim()) { show error; return; }
  if (files.length === 0) { show error; return; }

  setIsProcessing(true);
  
  // Build FormData
  const formData = new FormData();
  formData.append('uploader_name', uploaderName.trim());
  formData.append('upload_timestamp', new Date().toISOString());
  formData.append('total_files', files.length.toString());
  
  // Append all files
  files.forEach(f => formData.append('files', f.file));
  
  // Build metadata array
  const metadata = files.map((f, index) => ({
    index,
    filename: f.name,
    size_bytes: f.file.size,
    applicant_type: f.isInternal ? 'internal' : 'external',
    ...(f.isInternal && {
      from_date: f.fromDate || null,
      to_date: f.toDate || null,
      department: f.department || null,
      upload_reason: f.uploadReason || null,
      other_reason: f.uploadReason === 'other' ? f.otherReason : null,
    }),
  }));
  formData.append('metadata', JSON.stringify(metadata));
  
  // Update status to processing
  setFiles(prev => prev.map(f => ({ ...f, status: 'processing' })));
  
  try {
    const response = await fetch('https://workflow.exist.com.ph/webhook/vector-db-loader', {
      method: 'POST',
      body: formData,  // No Content-Type header - browser sets it with boundary
    });
    
    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Mark all as complete
    setFiles(prev => prev.map(f => ({ ...f, status: 'complete' })));
    setIsVectorized(true);
    toast.success(`Vectorization Complete: ${files.length} CVs Processed`);
    
    // Save uploader name to database
    await createUploader.mutateAsync(uploaderName.trim());
    
    setTimeout(() => navigate('/dashboard'), 1000);
  } catch (error) {
    // Mark as error
    setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
    toast.error(error.message || 'Failed to process CVs');
  } finally {
    setIsProcessing(false);
  }
};
```

### 5. File Selection Handlers
```text
// Hidden file input ref
const fileInputRef = useRef<HTMLInputElement>(null);

// Handle file selection from input
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFiles = e.target.files;
  if (!selectedFiles || selectedFiles.length === 0) return;
  
  const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file, idx) => ({
    id: `${Date.now()}-${idx}`,
    file,
    name: file.name,
    size: formatFileSize(file.size),
    status: 'ready',
    isInternal: defaultIsInternal,
  }));
  
  setFiles(prev => [...prev, ...newFiles]);
  toast.success(`${newFiles.length} file(s) added`);
  e.target.value = '';  // Reset input
};

// Handle drag and drop
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(false);
  
  if (!uploaderName.trim()) {
    toast.error('Please enter the uploader name first');
    return;
  }
  
  const droppedFiles = e.dataTransfer.files;
  const validFiles = Array.from(droppedFiles).filter(f => 
    f.type === 'application/pdf' || 
    f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
  
  if (validFiles.length === 0) {
    toast.error('Please upload PDF or DOCX files only');
    return;
  }
  
  const newFiles: UploadedFile[] = validFiles.map((file, idx) => ({
    id: `${Date.now()}-${idx}`,
    file,
    name: file.name,
    size: formatFileSize(file.size),
    status: 'ready',
    isInternal: defaultIsInternal,
  }));
  
  setFiles(prev => [...prev, ...newFiles]);
  toast.success(`${newFiles.length} file(s) uploaded`);
};

// Format file size helper
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
```

### 6. UI Updates
- Add hidden file input that triggers on dropzone click
- Add "Remove" button for each file row to allow removing files before submission
- Update status badge to show "Error" state in red
- Keep existing metadata fields (type, dates, department, reason)

## Technical Notes

### CORS Consideration
The n8n webhook must have CORS enabled to accept requests from the app's origin. If CORS issues occur, you may need to:
1. Configure n8n to accept the app's origin, OR
2. Proxy the request through the existing backend edge function

### File Size Limits
FormData file uploads have no built-in browser limit, but n8n or the server may have limits. The current implementation sends files directly.

### Error Handling
- Network errors show generic failure message
- Webhook errors (4xx, 5xx) show status code
- Individual file status is tracked but currently all succeed/fail together

## Files Modified
1. `src/pages/UploadPage.tsx` - Main implementation changes

