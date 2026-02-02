import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export function useRealtimeCandidates() {
  const [newCandidatesCount, setNewCandidatesCount] = useState(0);
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);
  const queryClient = useQueryClient();
  const lastSeenRef = useRef<string | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel('candidates-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'candidates'
        },
        (payload) => {
          console.log('New candidate detected:', payload.new);
          // Avoid duplicate notifications
          if (payload.new.id !== lastSeenRef.current) {
            lastSeenRef.current = payload.new.id as string;
            setNewCandidatesCount(prev => prev + 1);
            setShowRefreshPrompt(true);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refreshData = useCallback(async () => {
    // Invalidate all relevant queries to fetch fresh data
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['candidates'] }),
      queryClient.invalidateQueries({ queryKey: ['applications'] }),
      queryClient.invalidateQueries({ queryKey: ['job-orders'] }),
    ]);
    
    setNewCandidatesCount(0);
    setShowRefreshPrompt(false);
  }, [queryClient]);

  const dismissPrompt = useCallback(() => {
    setShowRefreshPrompt(false);
  }, []);

  return {
    newCandidatesCount,
    showRefreshPrompt,
    refreshData,
    dismissPrompt
  };
}
