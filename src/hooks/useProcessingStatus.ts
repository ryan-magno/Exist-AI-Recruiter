import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { azureDb } from '@/lib/azureDb';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import React from 'react';

export interface ProcessingCandidate {
  id: string;
  full_name: string;
  processing_status: 'processing' | 'completed' | 'failed';
  applicant_type: string | null;
  created_at: string;
  batch_id: string | null;
  batch_created_at: string | null;
}

export interface ProcessingStatusResponse {
  candidates: ProcessingCandidate[];
  counts: {
    processing?: number;
    completed?: number;
    failed?: number;
  };
}

interface UseProcessingStatusOptions {
  batchId?: string | null;
  enabled?: boolean;
  pollInterval?: number; // ms
  maxPollTime?: number; // ms
  onComplete?: (completedCount: number) => void;
}

export function useProcessingStatus(options: UseProcessingStatusOptions = {}) {
  const {
    batchId,
    enabled = true,
    pollInterval = 5000,
    maxPollTime = 210000, // 3.5 minutes
    onComplete
  } = options;

  const queryClient = useQueryClient();
  const [isPolling, setIsPolling] = useState(false);
  const [processingCandidates, setProcessingCandidates] = useState<ProcessingCandidate[]>([]);
  const [completedSinceStart, setCompletedSinceStart] = useState<Set<string>>(new Set());
  const pollStartTime = useRef<number | null>(null);
  const lastCheckTime = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (batchId) params.set('batch_id', batchId);
      if (lastCheckTime.current) params.set('since', lastCheckTime.current);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${apiUrl}/candidates/processing-status?${params.toString()}`
      );

      if (!response.ok) throw new Error('Failed to fetch processing status');

      const data: ProcessingStatusResponse = await response.json();
      setProcessingCandidates(data.candidates);

      // Track newly completed candidates
      const newlyCompleted = data.candidates.filter(
        c => c.processing_status === 'completed' && !completedSinceStart.has(c.id)
      );

      if (newlyCompleted.length > 0) {
        const newCompletedSet = new Set(completedSinceStart);
        newlyCompleted.forEach(c => newCompletedSet.add(c.id));
        setCompletedSinceStart(newCompletedSet);

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['legacy-candidates'] });

        // Show toast notification
        const completedNames = newlyCompleted
          .map(c => c.full_name)
          .filter(name => name && !name.includes('Processing'));

        toast.success(
          `${newlyCompleted.length} CV${newlyCompleted.length > 1 ? 's' : ''} processed!`,
          {
            description: completedNames.length > 0 
              ? completedNames.slice(0, 3).join(', ') + (completedNames.length > 3 ? '...' : '')
              : 'Analysis complete',
            action: {
              label: 'Refresh',
              onClick: () => {
                queryClient.invalidateQueries({ queryKey: ['legacy-candidates'] });
              }
            },
            duration: 10000
          }
        );

        onComplete?.(newlyCompleted.length);
      }

      // Check if all done or timeout
      const stillProcessing = data.counts.processing || 0;
      const elapsed = pollStartTime.current ? Date.now() - pollStartTime.current : 0;

      if (stillProcessing === 0 || elapsed > maxPollTime) {
        stopPolling();

        if (elapsed > maxPollTime && stillProcessing > 0) {
          toast.warning('Some CVs are taking longer than expected', {
            description: 'Processing will continue in the background',
            duration: 5000
          });
        }
      }

      lastCheckTime.current = new Date().toISOString();
    } catch (error) {
      console.error('Error checking processing status:', error);
    }
  }, [batchId, completedSinceStart, maxPollTime, onComplete, queryClient]);

  const startPolling = useCallback((newBatchId?: string) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsPolling(true);
    pollStartTime.current = Date.now();
    lastCheckTime.current = null;
    setCompletedSinceStart(new Set());

    // Immediate check
    checkStatus();

    // Start polling interval
    intervalRef.current = setInterval(checkStatus, pollInterval);
  }, [checkStatus, pollInterval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    pollStartTime.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-start polling when batchId changes and enabled
  useEffect(() => {
    if (enabled && batchId) {
      startPolling(batchId);
    }
    return () => stopPolling();
  }, [batchId, enabled]);

  return {
    isPolling,
    processingCandidates,
    completedCount: completedSinceStart.size,
    startPolling,
    stopPolling,
    checkStatus
  };
}

// useGlobalProcessingStatus removed - was unused and caused redundant polling
