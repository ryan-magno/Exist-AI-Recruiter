// Azure PostgreSQL API client
// This is the sole data layer - no Supabase, just direct API calls to Edge Function

const AZURE_DB_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/azure-db`;

async function apiCall<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${AZURE_DB_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export const azureDb = {
  // Initialize tables and seed data
  init: () => apiCall<{ success: boolean; message: string }>('/init', { method: 'POST' }),
  
  // Job Orders
  jobOrders: {
    list: () => apiCall<any[]>('/job-orders'),
    create: (data: any) => apiCall<any>('/job-orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall<any>(`/job-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiCall<{ success: boolean }>(`/job-orders/${id}`, { method: 'DELETE' }),
    count: () => apiCall<{ count: number }>('/job-orders/count'),
  },
  
  // Candidates
  candidates: {
    list: (includeProcessing = false) => apiCall<any[]>(`/candidates${includeProcessing ? '?include_processing=true' : ''}`),
    get: (id: string) => apiCall<any>(`/candidates/${id}`),
    getFull: (id: string) => apiCall<any>(`/candidates/${id}/full`),
    create: (data: any) => apiCall<any>('/candidates', { method: 'POST', body: JSON.stringify(data) }),
    createFromWebhook: (data: any) => apiCall<any>('/candidates/from-webhook', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall<any>(`/candidates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiCall<{ success: boolean }>(`/candidates/${id}`, { method: 'DELETE' }),
    processingStatus: (params?: { batch_id?: string; since?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.batch_id) searchParams.set('batch_id', params.batch_id);
      if (params?.since) searchParams.set('since', params.since);
      const query = searchParams.toString();
      return apiCall<any>(`/candidates/processing-status${query ? `?${query}` : ''}`);
    },
  },
  
  // Applications
  applications: {
    list: (params?: { job_order_id?: string; candidate_id?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.job_order_id) searchParams.set('job_order_id', params.job_order_id);
      if (params?.candidate_id) searchParams.set('candidate_id', params.candidate_id);
      const query = searchParams.toString();
      return apiCall<any[]>(`/applications${query ? `?${query}` : ''}`);
    },
    create: (data: any) => apiCall<any>('/applications', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall<any>(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  
  // Departments
  departments: {
    list: () => apiCall<any[]>('/departments'),
  },
  
  // CV Uploaders
  cvUploaders: {
    list: () => apiCall<any[]>('/cv-uploaders'),
    create: (name: string) => apiCall<any>('/cv-uploaders', { method: 'POST', body: JSON.stringify({ name }) }),
  },
  
  // HR Interviews
  hrInterviews: {
    get: (applicationId: string) => apiCall<any>(`/hr-interviews?application_id=${applicationId}`),
    listByCandidate: (candidateId: string) => apiCall<any[]>(`/hr-interviews?candidate_id=${candidateId}`),
    upsert: (data: any) => apiCall<any>('/hr-interviews', { method: 'POST', body: JSON.stringify(data) }),
  },
  
  // Tech Interviews
  techInterviews: {
    get: (applicationId: string) => apiCall<any>(`/tech-interviews?application_id=${applicationId}`),
    listByCandidate: (candidateId: string) => apiCall<any[]>(`/tech-interviews?candidate_id=${candidateId}`),
    upsert: (data: any) => apiCall<any>('/tech-interviews', { method: 'POST', body: JSON.stringify(data) }),
  },
  
  // Timeline
  timeline: {
    list: (params?: { application_id?: string; candidate_id?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.application_id) searchParams.set('application_id', params.application_id);
      if (params?.candidate_id) searchParams.set('candidate_id', params.candidate_id);
      const query = searchParams.toString();
      return apiCall<any[]>(`/timeline${query ? `?${query}` : ''}`);
    },
  },
  
  // Offers
  offers: {
    get: (applicationId: string) => apiCall<any>(`/offers?application_id=${applicationId}`),
    listByCandidate: (candidateId: string) => apiCall<any[]>(`/offers?candidate_id=${candidateId}`),
    upsert: (data: any) => apiCall<any>('/offers', { method: 'POST', body: JSON.stringify(data) }),
  },
};
