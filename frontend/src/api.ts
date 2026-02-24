/**
 * SafeScribe API client - calls backend for recording, meetings, export.
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchApi<T>(
  path: string,
  options?: RequestInit & { body?: unknown }
): Promise<T> {
  const { body, ...rest } = options || {};
  const init: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...rest.headers,
    },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

export const api = {
  // Recording
  startRecording: () =>
    fetchApi<{ status: string }>('/recording/start', { method: 'POST' }),
  abortRecording: () =>
    fetchApi<{ status: string }>('/recording/abort', { method: 'POST' }),
  pauseRecording: () =>
    fetchApi<{ status: string }>('/recording/pause', { method: 'POST' }),
  resumeRecording: () =>
    fetchApi<{ status: string }>('/recording/resume', { method: 'POST' }),
  stopRecording: (startTime: number) =>
    fetchApi<{ meetingId: string }>('/recording/stop', {
      method: 'POST',
      body: { start_time: startTime } as Record<string, unknown>,
    }),
  getTranscript: () =>
    fetchApi<{ transcript: string }>('/recording/transcript'),
  getRecordingStatus: () =>
    fetchApi<{ state: string }>('/recording/status'),

  // Meetings
  listMeetings: () =>
    fetchApi<{
      meetings: MeetingFromApi[];
      storageUsedMB: number;
      storageTotalMB: number;
    }>('/meetings'),
  getMeeting: (id: string) =>
    fetchApi<MeetingFromApi>(`/meetings/${id}`),
  deleteMeeting: (id: string) =>
    fetchApi<{ status: string }>(`/meetings/${id}`, { method: 'DELETE' }),

  // Export (email only)
  emailMeeting: (meetingId: string) =>
    fetchApi<{ status: string }>(`/export/email/${meetingId}`, {
      method: 'POST',
    }),

  // Settings / WiFi
  wifiStatus: () =>
    fetchApi<{ connected: boolean; ssid: string | null }>('/settings/wifi/status'),
  wifiScan: () =>
    fetchApi<{ networks: { ssid: string; signal: number; secure: boolean }[] }>('/settings/wifi/scan'),
  wifiConnect: (ssid: string, password: string) =>
    fetchApi<{ status: string; message: string }>('/settings/wifi/connect', {
      method: 'POST',
      body: { ssid, password },
    }),

  // Settings
  getSettings: () =>
    fetchApi<{
      emailConfigured: boolean;
      emailAddress: string | null;
      setupComplete: boolean;
    }>('/settings'),

  // OTP email verification
  sendOtp: (email: string) =>
    fetchApi<{ status: string }>('/auth/send-otp', {
      method: 'POST',
      body: { email },
    }),
  verifyOtp: (email: string, code: string) =>
    fetchApi<{ status: string; email: string }>('/auth/verify-otp', {
      method: 'POST',
      body: { email, code },
    }),
  factoryReset: () =>
    fetchApi<{ status: string }>('/settings/factory-reset', { method: 'POST' }),
  setSetupComplete: (complete = true) =>
    fetchApi<{ status: string }>('/settings/setup-complete', {
      method: 'POST',
      body: { complete } as Record<string, unknown>,
    }),
};

export interface MeetingFromApi {
  id: string;
  createdAt: string;
  duration: number;
  title?: string;
  transcript?: string;
  summary?: string;
  actionItems?: string[];
  decisions?: string[];
  topics?: string[];
  exportedUsb?: boolean;
  emailed: boolean;
  emailedAt?: string | null;
  status?: 'processing';
  audioSize: number;
  transcriptSize: number;
  pdfSize: number;
}
