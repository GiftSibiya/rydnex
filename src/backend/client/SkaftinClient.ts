/**
 * Skaftin SDK Client
 * Unified client for all Skaftin API interactions
 * Adapted for React Native (Expo)
 */

// Import expo-constants (available through expo package)
// Fallback to null if not available
import Constants from 'expo-constants';
import useAuthStore from '../../stores/data/AuthStore'; // For JWT token injection

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  data: T;
}

/** Extra options for `request` / `post` — not passed to `fetch`. */
export type SkaftinRequestOptions = RequestInit & {
  /** When true, only platform auth (API key); no Bearer from AuthStore (login/register/verify-otp). */
  skipUserAuthorization?: boolean;
};

class SkaftinClient {
  private config: {
    apiUrl: string;
    apiKey: string;
    accessToken: string;
    projectId: string | null;
  };
  private initialized = false;

  constructor() {
    // React Native Expo environment variables
    // Use EXPO_PUBLIC_ prefix for public env vars (available in client)
    const apiUrl = 
      process.env.EXPO_PUBLIC_SKAFTIN_API_URL || 
      Constants.expoConfig?.extra?.skaftinApiUrl ||
      'http://localhost:4006';
    
    const apiKey = 
      process.env.EXPO_PUBLIC_SKAFTIN_API_KEY || 
      process.env.EXPO_PUBLIC_SKAFTIN_API ||
      Constants.expoConfig?.extra?.skaftinApiKey ||
      '';
    
    const accessToken = 
      process.env.EXPO_PUBLIC_SKAFTIN_ACCESS_TOKEN ||
      Constants.expoConfig?.extra?.skaftinAccessToken ||
      '';
    
    const projectId = 
      process.env.EXPO_PUBLIC_SKAFTIN_PROJECT_ID ||
      Constants.expoConfig?.extra?.skaftinProjectId ||
      null;

    this.config = { apiUrl, apiKey, accessToken, projectId };

    if (!apiKey && !accessToken) {
      console.warn(
        '⚠️ No Skaftin credentials configured!\n' +
        '   Set EXPO_PUBLIC_SKAFTIN_API_KEY or EXPO_PUBLIC_SKAFTIN_ACCESS_TOKEN in .env\n' +
        '   Or configure in app.json/app.config.js under extra.skaftinApiKey'
      );
      // Don't throw in React Native - allow graceful degradation
    }

    if (__DEV__) {
      console.log('🔧 Skaftin Client initialized:', {
        apiUrl: this.config.apiUrl,
        hasApiKey: !!this.config.apiKey,
        hasAccessToken: !!this.config.accessToken,
        projectId: this.config.projectId || 'auto-detected',
      });
    }

    this.initialized = true;
  }

  getApiUrl(): string {
    return this.config.apiUrl;
  }

  getProjectId(): string | null {
    return this.config.projectId;
  }

  isAuthenticated(): boolean {
    return !!(this.config.apiKey || this.config.accessToken);
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {};
    
    // Always include X-API-Key header (platform authentication)
    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    } else if (this.config.accessToken) {
      headers['x-access-token'] = this.config.accessToken;
    }
    
    return headers;
  }

  private buildHeaders(
    customHeaders: Record<string, string> = {},
    isFormData = false,
    skipUserAuthorization = false
  ): HeadersInit {
    const headers: Record<string, string> = {
      ...(this.getAuthHeaders() as Record<string, string>),
      ...customHeaders,
    };

    if (!skipUserAuthorization) {
      const userState = useAuthStore.getState();
      const jwtToken = userState.accessToken;
      if (jwtToken && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
      }
    }

    // CRITICAL: When using FormData, DO NOT set Content-Type header
    // React Native will automatically set it with the correct boundary
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    } else if (isFormData) {
      // Explicitly remove Content-Type if it was set by customHeaders
      delete headers['Content-Type'];
    }

    return headers;
  }

  private refreshing = false;

  /**
   * Parse JSON bodies; avoid `response.json()` on HTML error pages (wrong base URL / proxy).
   */
  private async parseResponseBody(response: Response, endpoint: string): Promise<Record<string, unknown>> {
    const text = await response.text();
    const trimmed = text.trim();
    if (!trimmed) return {};
    if (trimmed.startsWith('<') || trimmed.startsWith('<!')) {
      const hint =
        'The server returned HTML, not JSON. Use EXPO_PUBLIC_SKAFTIN_API_URL as the API host root ' +
        '(no trailing /app-api), and confirm the device can reach it (same VPN if required).';
      throw new Error(`${hint} Request: ${endpoint} HTTP ${response.status}`);
    }
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error(
        `Skaftin response was not valid JSON (HTTP ${response.status}). First bytes: ${trimmed.slice(0, 80)}`
      );
    }
  }

  private async attemptSessionRefresh(): Promise<boolean> {
    if (this.refreshing) return false;
    this.refreshing = true;
    try {
      // Lazy-import to avoid circular deps (routes → client → routes)
      const { default: routes } = await import('@/constants/ApiRoutes');
      const refreshUrl = `${this.config.apiUrl}${routes.auth.sessionRefresh}`;
      const headers = this.buildHeaders({});
      const response = await fetch(refreshUrl, { method: 'POST', headers });
      return response.ok;
    } catch {
      return false;
    } finally {
      this.refreshing = false;
    }
  }

  async request<T>(endpoint: string, options: SkaftinRequestOptions = {}): Promise<ApiResponse<T>> {
    if (!this.initialized) throw new Error('Skaftin client not initialized');

    const { skipUserAuthorization, ...fetchInit } = options;
    const url = `${this.config.apiUrl}${endpoint}`;
    const method = fetchInit.method || 'GET';
    const isFormData = fetchInit.body instanceof FormData;

    const headers = this.buildHeaders(
      (fetchInit.headers as Record<string, string>) || {},
      isFormData,
      !!skipUserAuthorization
    );

    let finalBody: BodyInit | undefined;
    if (isFormData) {
      finalBody = fetchInit.body as FormData;
    } else if (fetchInit.body) {
      finalBody = typeof fetchInit.body === 'string'
        ? fetchInit.body
        : JSON.stringify(fetchInit.body);
    }

    // Log request in development mode
    if (__DEV__) {
      console.log(`[${method}] ${endpoint}`, fetchInit.body || '');
    }

    try {
      const response = await fetch(url, {
        ...fetchInit,
        method,
        headers,
        body: finalBody,
      });

      const data = await this.parseResponseBody(response, `${method} ${endpoint}`);

      // Log response in development mode
      if (__DEV__) {
        console.log(`[${method}] ${endpoint} →`, response.status, data);
      }

      // Handle 401 — attempt session refresh then retry once
      if (response.status === 401 && this.isUserAuthenticated() && !skipUserAuthorization) {
        const refreshed = await this.attemptSessionRefresh();
        if (refreshed) {
          const retryHeaders = this.buildHeaders(
            (fetchInit.headers as Record<string, string>) || {},
            isFormData,
            !!skipUserAuthorization
          );
          const retryResponse = await fetch(url, { ...fetchInit, method, headers: retryHeaders, body: finalBody });
          const retryData = await this.parseResponseBody(retryResponse, `${method} ${endpoint} (retry)`);
          if (!retryResponse.ok) {
            const errorMsg =
              (retryData.message as string) ||
              (retryData.error as string) ||
              `Request failed with status ${retryResponse.status}`;
            const error = new Error(errorMsg);
            (error as any).status = retryResponse.status;
            (error as any).data = retryData;
            throw error;
          }
          return retryData as unknown as ApiResponse<T>;
        }
        // Refresh failed — clear auth state
        useAuthStore.getState().logout();
      }

      if (!response.ok) {
        const errorMsg =
          (data.message as string) || (data.error as string) || `Request failed with status ${response.status}`;
        const error = new Error(errorMsg);
        (error as any).status = response.status;
        (error as any).data = data;
        throw error;
      }

      return data as unknown as ApiResponse<T>;
    } catch (error: any) {
      if (__DEV__) {
        console.error(`[${method}] ${endpoint} ❌`, error);
      }
      throw error;
    }
  }

  private isUserAuthenticated(): boolean {
    const userState = useAuthStore.getState();
    return !!userState.accessToken;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params && Object.keys(params).length > 0) {
      const query = new URLSearchParams(
        Object.entries(params).reduce((acc, [k, v]) => {
          if (v !== undefined && v !== null) {
            acc[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString();
      url += `?${query}`;
    }
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    body?: any,
    opts?: { skipUserAuthorization?: boolean }
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body,
      skipUserAuthorization: opts?.skipUserAuthorization,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const options: RequestInit = { method: 'DELETE' };
    
    // If body is provided, we need to decide whether to send it as query params or request body
    // Most DELETE endpoints in the Skaftin API expect the body in the request body (JSON)
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    return this.request<T>(endpoint, options);
  }

  /**
   * Get a presigned download URL for a file in storage
   */
  async getDownloadUrl(bucket: string, path: string): Promise<string | null> {
    try {
      const response = await this.get<any>('/app-api/storage/files/download', {
        bucket,
        path,
        returnUrl: 'true'
      });
      if (response.success && response.data?.url) {
        return response.data.url;
      }
      return null;
    } catch (error) {
      console.error('Error getting download URL:', error);
      return null;
    }
  }

  /**
   * Upload file using FormData
   * 
   * IMPORTANT: When using FormData, the Content-Type header is automatically
   * set by React Native with the correct boundary. Do NOT set it manually.
   */
  async postFormData<T>(endpoint: string, body: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }
}

export const skaftinClient = new SkaftinClient();
export { SkaftinClient };
export default skaftinClient;

