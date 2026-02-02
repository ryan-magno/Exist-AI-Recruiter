import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/context/AppContext';

export function useRealtimeCandidates() {
  const [newCandidatesCount, setNewCandidatesCount] = useState(0);
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);
  const queryClient = useQueryClient();
  const { refreshCandidates } = useApp();
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
    refreshData,
    dismissPrompt
  };
}
