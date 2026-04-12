import { JobDescription, MatchSummary, MatchDetail, UploadResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

export async function uploadCandidatesExcel(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  return request<UploadResponse>(
    '/ingest/candidates/upload-excel',
    {
      method: 'POST',
      body: formData,
    }
  );
}

export async function addJobsBulk(payload: {
  job_descriptions: Array<{
    title: string;
    company?: string | null;
    overview?: string | null;
    core_requirements?: string | null;
    preferred_quals?: string | null;
    responsibilities?: string | null;
    required_skills?: string | null;
    employment_type?: string | null;
    location?: string | null;
  }>;
}): Promise<UploadResponse> {
  return request<UploadResponse>(
    '/ingest/jobs/bulk',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );
}

export async function listJobs(): Promise<JobDescription[]> {
  return request<JobDescription[]>('/ingest/jobs', {
    method: 'GET',
  });
}

export async function getRankedCandidates(
  jdId: string,
  forceRerun: boolean = false,
  limit: number = 20
): Promise<MatchSummary[]> {
  const params = new URLSearchParams();
  if (forceRerun) params.append('force_rerun', 'true');
  if (limit) params.append('limit', limit.toString());
  
  const query = params.toString();
  const endpoint = `/match/${jdId}${query ? '?' + query : ''}`;
  
  return request<MatchSummary[]>(endpoint, {
    method: 'GET',
  });
}

export async function getMatchDetail(
  jdId: string,
  candidateId: string
): Promise<MatchDetail> {
  return request<MatchDetail>(
    `/match/${jdId}/${candidateId}`,
    {
      method: 'GET',
    }
  );
}

export async function triggerMatch(jdId: string): Promise<UploadResponse> {
  return request<UploadResponse>(
    `/match/${jdId}/run`,
    {
      method: 'POST',
    }
  );
}
