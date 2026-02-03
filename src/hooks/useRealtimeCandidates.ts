import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/context/AppContext';

interface ProcessingCandidate {
  id: string;
  full_name: string;
  processing_status: 'processing' | 'completed' | 'failed';
  processing_batch_id: string | null;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  cv_filename: string | null;
  applicant_type: string;
  created_at: string;
}

interface ProcessingStatusResponse {
  candidates: ProcessingCandidate[];
  counts: {
    processing?: number;
    completed?: number;
    failed?: number;
  };
}

export function useRealtimeCandidates() {
  const [newCandidatesCount, setNewCandidatesCount] = useState(0);
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const queryClient = useQueryClient();
  const { refreshCandidates } = useApp();
  const previousCompletedRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstCheckRef = useRef(true);

  // Poll for processing status changes
  const checkProcessingStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/azure-db/candidates/processing-status`
      );

      if (!response.ok) return;

      const data: ProcessingStatusResponse = await response.json();
      const processing = data.counts.processing || 0;
      setProcessingCount(processing);

      // Track completed candidates
      const currentCompleted = new Set(
        data.candidates
          .filter(c => c.processing_status === 'completed')
          .map(c => c.id)
      );

      // Find newly completed (not in previous check)
      const newlyCompleted = data.candidates.filter(
        c => c.processing_status === 'completed' && !previousCompletedRef.current.has(c.id)
      );

      // Skip notification on first check (initial load)
      if (!isFirstCheckRef.current && newlyCompleted.length > 0) {
        setNewCandidatesCount(newlyCompleted.length);
        setShowRefreshPrompt(true);
        
        // Auto-refresh query cache
        queryClient.invalidateQueries({ queryKey: ['candidates'] });
        queryClient.invalidateQueries({ queryKey: ['applications'] });
      }

      previousCompletedRef.current = currentCompleted;
      isFirstCheckRef.current = false;
    } catch (error) {
      console.error('Error checking processing status:', error);
    }
  }, [queryClient]);

  // Start polling on mount
  useEffect(() => {
    // Initial check
    checkProcessingStatus();

    // Poll every 5 seconds for active processing
    intervalRef.current = setInterval(checkProcessingStatus, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkProcessingStatus]);

  const refreshData = useCallback(async () => {
    // Invalidate React Query caches
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['candidates'] }),
      queryClient.invalidateQueries({ queryKey: ['applications'] }),
      queryClient.invalidateQueries({ queryKey: ['job-orders'] }),
    ]);
    
    // Refresh candidates in AppContext from Azure DB
    await refreshCandidates();
    
    setNewCandidatesCount(0);
    setShowRefreshPrompt(false);
  }, [queryClient, refreshCandidates]);

  const dismissPrompt = useCallback(() => {
    setShowRefreshPrompt(false);
  }, []);

  return {
    newCandidatesCount,
    showRefreshPrompt,
    processingCount,
    refreshData,
    dismissPrompt
  };
}
