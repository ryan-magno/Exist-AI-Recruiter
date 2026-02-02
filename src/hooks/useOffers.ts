import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { azureDb } from '@/lib/azureDb';

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'negotiating' | 'unresponsive';

export interface Offer {
  id: string;
  application_id: string;
  candidate_id: string;
  offer_date: string | null;
  expiry_date: string | null;
  offer_amount: string | null;
  position: string | null;
  start_date: string | null;
  status: OfferStatus;
  benefits: string | null;
  remarks: string | null;
  negotiation_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OfferInsert {
  application_id: string;
  candidate_id: string;
  offer_date?: string | null;
  expiry_date?: string | null;
  offer_amount?: string | null;
  position?: string | null;
  start_date?: string | null;
  status?: OfferStatus;
  benefits?: string | null;
  remarks?: string | null;
  negotiation_notes?: string | null;
}

export function useOffer(applicationId: string | null) {
  return useQuery({
    queryKey: ['offers', applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      return azureDb.offers.get(applicationId) as Promise<Offer | null>;
    },
    enabled: !!applicationId
  });
}

export function useOffersByCandidate(candidateId: string | null) {
  return useQuery({
    queryKey: ['offers', 'candidate', candidateId],
    queryFn: async () => {
      if (!candidateId) return [];
      return azureDb.offers.listByCandidate(candidateId) as Promise<Offer[]>;
    },
    enabled: !!candidateId
  });
}

export function useUpsertOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offer: OfferInsert) => azureDb.offers.upsert(offer),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['offers', variables.application_id] });
      queryClient.invalidateQueries({ queryKey: ['offers', 'candidate', variables.candidate_id] });
    }
  });
}
