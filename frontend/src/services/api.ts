import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth.store';

// Em Docker: /api-proxy (relativo — browser → Next.js server → backend container)
// Em dev local: http://localhost:3001/api (apenas quando Next.js roda fora do Docker)
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api-proxy';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { refreshToken, user, setTokens, logout } = useAuthStore.getState();

      if (refreshToken && user) {
        try {
          const res = await axios.post(`${API_URL}/v1/auth/refresh`, {
            userId: user.id,
            refreshToken,
          });
          const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;
          setTokens(newAccess, newRefresh);
          original.headers = { ...original.headers, Authorization: `Bearer ${newAccess}` };
          return api(original);
        } catch {
          logout();
          window.location.href = '/login';
        }
      } else {
        logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string, mfaCode?: string) =>
    api.post('/v1/auth/login', { email, password, mfaCode }),
  register: (name: string, email: string, password: string) =>
    api.post('/v1/auth/register', { name, email, password }),
  logout: () => api.post('/v1/auth/logout'),
  setupMfa: () => api.get('/v1/auth/mfa/setup'),
  verifyMfa: (code: string) => api.post('/v1/auth/mfa/verify', { code }),
};

export const environmentsApi = {
  list: () => api.get('/v1/environments'),
  create: (data: any) => api.post('/v1/environments', data),
  update: (id: string, data: any) => api.put(`/v1/environments/${id}`, data),
  delete: (id: string) => api.delete(`/v1/environments/${id}`),
};

export const apisApi = {
  list: (params?: any) => api.get('/v1/apis', { params }),
  create: (data: any) => api.post('/v1/apis', data),
  get: (id: string) => api.get(`/v1/apis/${id}`),
  update: (id: string, data: any) => api.put(`/v1/apis/${id}`, data),
  delete: (id: string) => api.delete(`/v1/apis/${id}`),
  stats: () => api.get('/v1/apis/stats'),
};

export const oauthApi = {
  listProfiles: (environmentId?: string) =>
    api.get('/v1/oauth/profiles', { params: { environmentId } }),
  createProfile: (data: any) => api.post('/v1/oauth/profiles', data),
  getToken: (profileId: string) => api.post(`/v1/oauth/profiles/${profileId}/token`),
  testToken: (profileId: string) => api.post(`/v1/oauth/profiles/${profileId}/test`),
  invalidateToken: (profileId: string) => api.delete(`/v1/oauth/profiles/${profileId}/token`),
};

export const executorApi = {
  execute: (data: any) => api.post('/v1/executor/execute', data),
  history: (params?: any) => api.get('/v1/executor/history', { params }),
  stats: () => api.get('/v1/executor/stats'),
};

export const analyzerApi = {
  analyzeXml: (xml: string, useAi = true) => api.post('/v1/analyzer/xml', { xml, useAi }),
  analyzeJson: (json: string) => api.post('/v1/analyzer/json', { json }),
  compareCig: (data: any) => api.post('/v1/analyzer/cig', data),
};

export const aiApi = {
  diagnose: (data: any) => api.post('/v1/ai/diagnose', data),
  chat: (messages: any[], history?: any[]) => api.post('/v1/ai/chat', { messages, history }),
  analyzeXml: (xml: string) => api.post('/v1/ai/analyze-xml', { xml }),
};

export const knowledgeApi = {
  list: (params?: any) => api.get('/v1/knowledge-base', { params }),
  search: (q: string, category?: string) =>
    api.get('/v1/knowledge-base/search', { params: { q, category } }),
  get: (id: string) => api.get(`/v1/knowledge-base/${id}`),
  create: (data: any) => api.post('/v1/knowledge-base', data),
};

export const evidencesApi = {
  list: () => api.get('/v1/evidences'),
  create: (data: any) => api.post('/v1/evidences', data),
  delete: (id: string) => api.delete(`/v1/evidences/${id}`),
};
