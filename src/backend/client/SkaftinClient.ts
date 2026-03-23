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

  private buildHeaders(customHeaders: Record<string, string> = {}, isFormData = false): HeadersInit {
    const headers: Record<string, string> = {
      ...(this.getAuthHeaders() as Record<string, string>),
      ...customHeaders,
    };

    // Always add Authorization Bearer token if user is authenticated
    // Get token from AuthStore (stored after login)
    const userState = useAuthStore.getState();
    const jwtToken = userState.accessToken;
    if (jwtToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${jwtToken}`;
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

  private async attemptSessionRefresh(): Promise<boolean> {
    if (this.refreshing) return false;
    this.refreshing = true;
    try {
      const refreshUrl = `${this.config.apiUrl}/app-api/auth/session/refresh`;
      const headers = this.buildHeaders({});
      const response = await fetch(refreshUrl, { method: 'POST', headers });
      return response.ok;
    } catch {
      return false;
    } finally {
      this.refreshing = false;
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    if (!this.initialized) throw new Error('Skaftin client not initialized');

    const url = `${this.config.apiUrl}${endpoint}`;
    const method = options.method || 'GET';
    const isFormData = options.body instanceof FormData;

    const headers = this.buildHeaders(
      (options.headers as Record<string, string>) || {},
      isFormData
    );

    let finalBody: BodyInit | undefined;
    if (isFormData) {
      finalBody = options.body as FormData;
    } else if (options.body) {
      finalBody = typeof options.body === 'string' 
        ? options.body 
        : JSON.stringify(options.body);
    }

    // Log request in development mode
    if (__DEV__) {
      console.log(`[${method}] ${endpoint}`, options.body || '');
    }

    try {
      const response = await fetch(url, {
        ...options,
        method,
        headers,
        // Note: 'credentials' is not supported in React Native fetch
        // Use Authorization headers instead for authentication
        body: finalBody,
      });

      const data = await response.json();

      // Log response in development mode
      if (__DEV__) {
        console.log(`[${method}] ${endpoint} →`, response.status, data);
      }

      // Handle 401 — attempt session refresh then retry once
      if (response.status === 401 && this.isUserAuthenticated()) {
        const refreshed = await this.attemptSessionRefresh();
        if (refreshed) {
          // Retry the original request with fresh headers
          const retryHeaders = this.buildHeaders(
            (options.headers as Record<string, string>) || {},
            isFormData
          );
          const retryResponse = await fetch(url, { ...options, method, headers: retryHeaders, body: finalBody });
          const retryData = await retryResponse.json();
          if (!retryResponse.ok) {
            const errorMsg = retryData.message || retryData.error || `Request failed with status ${retryResponse.status}`;
            const error = new Error(errorMsg);
            (error as any).status = retryResponse.status;
            (error as any).data = retryData;
            throw error;
          }
          return retryData;
        }
        // Refresh failed — clear auth state
        useAuthStore.getState().logout();
      }

      if (!response.ok) {
        const errorMsg = data.message || data.error || `Request failed with status ${response.status}`;
        const error = new Error(errorMsg);
        (error as any).status = response.status;
        (error as any).data = data;
        throw error;
      }

      return data;
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

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body });
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

