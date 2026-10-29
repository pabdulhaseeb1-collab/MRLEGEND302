import { User, Conversation, Message, Group, StatusItem, AdminSettings, AppNotification, UserUsageData } from '../types';

const TOKEN_KEY = 'mrl_session_token';
const ADMIN_TOKEN_KEY = 'mrl_admin_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setStoredAdminToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const adminToken = getStoredAdminToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (adminToken) {
    headers['x-admin-token'] = adminToken;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error: any = new Error(data.error || 'Server request failed');
    error.status = res.status;
    error.code = data.code;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (payload: any) => request<{ token: string; user: User; usage: any }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  login: (payload: { identifier: string; password: string }) => request<{ token: string; user: User; usage: any }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  getMe: () => request<{ user: User; usage: any; adminSettings: any }>('/api/auth/me'),

  logout: () => request('/api/auth/logout', { method: 'POST' }),

  forgotPassword: (payload: { identifier?: string; email?: string }) => request<any>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Users
  searchUsers: (q: string) => request<{ users: User[] }>(`/api/users/search?q=${encodeURIComponent(q)}`),

  // Chats
  getConversations: () => request<{ conversations: Conversation[] }>('/api/chats'),
  openConversation: (targetUserId: string) => request<{ conversation: Conversation }>('/api/chats/open', {
    method: 'POST',
    body: JSON.stringify({ targetUserId }),
  }),
  getMessages: (conversationId: string) => request<{ messages: Message[] }>(`/api/chats/${conversationId}/messages`),
  sendMessage: (conversationId: string, payload: { text?: string; mediaUrl?: string; mediaType?: string; fileName?: string }) =>
    request<{ message: Message; usage: any }>(`/api/chats/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Groups
  getGroups: () => request<{ groups: Group[] }>('/api/groups'),
  createGroup: (payload: { name: string; description: string; avatarUrl?: string }) =>
    request<{ group: Group }>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  joinGroup: (groupId: string) => request<{ message: string }>(`/api/groups/${groupId}/join`, { method: 'POST' }),
  respondGroupRequest: (groupId: string, targetUserId: string, approve: boolean) =>
    request<{ message: string }>(`/api/groups/${groupId}/requests`, {
      method: 'POST',
      body: JSON.stringify({ targetUserId, approve }),
    }),
  updateGroupAudio: (groupId: string, active: boolean, sourceUrl?: string) =>
    request<{ message: string }>(`/api/groups/${groupId}/audio`, {
      method: 'POST',
      body: JSON.stringify({ active, sourceUrl }),
    }),

  // Statuses
  getStatuses: () => request<{ statuses: StatusItem[] }>('/api/statuses'),
  createStatus: (payload: any) => request<{ status: StatusItem }>('/api/statuses', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  viewStatus: (statusId: string) => request<{ success: boolean }>(`/api/statuses/${statusId}/view`, { method: 'POST' }),
  deleteStatus: (statusId: string) => request<{ message: string }>(`/api/statuses/${statusId}`, { method: 'DELETE' }),

  // Premium
  getPlans: () => request<any>('/api/premium/plans'),
  activateKey: (key: string) => request<{ message: string; plan: string; user: User; usage: any }>('/api/premium/activate', {
    method: 'POST',
    body: JSON.stringify({ key }),
  }),

  // Downloader
  getVideoInfo: (url: string, platform?: string) => request<any>('/api/downloader/info', {
    method: 'POST',
    body: JSON.stringify({ url, platform }),
  }),
  triggerDownload: (url: string, quality: string, title?: string) => request<any>('/api/downloader/download', {
    method: 'POST',
    body: JSON.stringify({ url, quality, title }),
  }),

  // Calling
  initiateCall: (receiverId: string, type: 'voice' | 'video', sdpOffer?: any) =>
    request<any>('/api/calls/initiate', {
      method: 'POST',
      body: JSON.stringify({ receiverId, type, sdpOffer }),
    }),
  pollCalls: (callId?: string) => request<any>(`/api/calls/poll${callId ? `?callId=${callId}` : ''}`),
  respondCall: (payload: { callId: string; action: 'accept' | 'decline' | 'end' | 'ice'; sdpAnswer?: any; candidate?: any; role?: string }) =>
    request<any>('/api/calls/respond', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  reportCallDuration: (seconds: number) => request<any>('/api/calls/duration', {
    method: 'POST',
    body: JSON.stringify({ seconds }),
  }),

  // Notifications
  getNotifications: () => request<{ notifications: AppNotification[] }>('/api/notifications'),
  markNotificationsRead: () => request<{ success: boolean }>('/api/notifications/mark-read', { method: 'POST' }),

  // Upload
  uploadFile: (dataUrl: string, fileName?: string) => request<{ url: string; fileName: string }>('/api/upload', {
    method: 'POST',
    body: JSON.stringify({ dataUrl, fileName }),
  }),

  // Admin
  adminLogin: (adminKey: string) => request<{ adminToken: string; message: string }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ adminKey }),
  }),
  adminGetOverview: () => request<any>('/api/admin/overview'),
  adminGetUsers: (q?: string) => request<{ users: User[] }>(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  adminUpdateUser: (userId: string, updates: any) => request<{ user: User }>(`/api/admin/users/${userId}/update`, {
    method: 'POST',
    body: JSON.stringify(updates),
  }),
  adminGenerateKey: (plan: 'monthly' | 'lifetime', targetEmail?: string) =>
    request<{ key: any }>('/api/admin/keys/generate', {
      method: 'POST',
      body: JSON.stringify({ plan, targetEmail }),
    }),
  adminRevokeKey: (keyId: string) => request<{ message: string }>('/api/admin/keys/revoke', {
    method: 'POST',
    body: JSON.stringify({ keyId }),
  }),
  adminGetSettings: () => request<{ settings: AdminSettings }>('/api/admin/settings'),
  adminSaveSettings: (settings: Partial<AdminSettings>) => request<any>('/api/admin/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  }),
  adminBroadcastAudio: (active: boolean, sourceUrl?: string, title?: string) =>
    request<any>('/api/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify({ active, sourceUrl, title }),
    }),
};
