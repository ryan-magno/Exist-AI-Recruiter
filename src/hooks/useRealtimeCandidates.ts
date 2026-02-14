import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/context/AppContext';

// Module-level event emitter for triggering refresh prompt from anywhere
type RefreshListener = (count: number) => void;
const listeners = new Set<RefreshListener>();

export function emitRefreshPrompt(count: number) {
  listeners.forEach(fn => fn(count));
}

interface ProcessingCandidate {
  id: string;
  full_name: string;
  processing_status: 'processing' | 'completed' | 'failed';
  applicant_type: string | null;
  created_at: string;
  batch_id: string | null;
  batch_created_at: string | null;
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

  // Subscribe to external refresh prompt triggers
  useEffect(() => {
    const handler: RefreshListener = (count) => {
      setNewCandidatesCount(count);
      setShowRefreshPrompt(true);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  // Poll for processing status changes
  const checkProcessingStatus = useCallback(async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${apiUrl}/candidates/processing-status`
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

      // Auto-refresh query cache when new candidates complete (but don't show popup — popup is only triggered by webhook 200)
      if (!isFirstCheckRef.current && newlyCompleted.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['legacy-candidates'] });
      }

      previousCompletedRef.current = currentCompleted;
      isFirstCheckRef.current = false;

      // Stop polling if nothing is actively processing
      if (processing === 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (error) {
      console.error('Error checking processing status:', error);
    }
  }, [queryClient]);

  // Start polling on mount, but stop when nothing is actively processing
  useEffect(() => {
    // Initial check
    checkProcessingStatus();

    // Poll every 10 seconds (reduced from 5s to reduce load)
    intervalRef.current = setInterval(checkProcessingStatus, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkProcessingStatus]);

  const refreshData = useCallback(async () => {
    // Invalidate only candidates
    await queryClient.invalidateQueries({ queryKey: ['legacy-candidates'] });
    
    // Refresh candidates in AppContext from Azure DB
    await refreshCandidates();
    
    setNewCandidatesCount(0);
    setShowRefreshPrompt(false);
  }, [queryClient, refreshCandidates]);

  const triggerRefreshPrompt = useCallback((count: number) => {
    setNewCandidatesCount(count);
    setShowRefreshPrompt(true);
  }, []);

  return {
    newCandidatesCount,
    showRefreshPrompt,
    processingCount,
    refreshData,
    triggerRefreshPrompt
  };
}
