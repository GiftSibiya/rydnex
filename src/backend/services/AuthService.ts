import type {
  ApiResponseType,
  LoginResponseData,
  RegistrationResponseData,
} from '@/types/Types';
import { STATIC_DATA_MODE } from '@/constants/AppConfig';

type LoginPayload = { email: string; password: string };
type RegisterPayload = { name: string; email: string; password: string };

class AuthService {
  async login(payload: LoginPayload) {
    if (!STATIC_DATA_MODE) {
      throw new Error('Static mode disabled. Wire login back to Skaftin.');
    }
    const data: LoginResponseData = {
      user: {
        id: 1,
        name: payload.email ? payload.email.split('@')[0] : 'Rydnex Driver',
        email: payload.email || 'driver@rydnex.local',
        phone: '+27710000000',
        roles: [{ id: 1, role_key: 'user', role_name: 'User' }],
      },
      accessToken: 'static-mode-access-token',
    };
    return Promise.resolve({ success: true, data } as ApiResponseType<LoginResponseData>);
  }

  async register(payload: RegisterPayload) {
    if (!STATIC_DATA_MODE) {
      throw new Error('Static mode disabled. Wire register back to Skaftin.');
    }
    const data: RegistrationResponseData = {
      user: {
        id: 1,
        name: payload.name || 'Rydnex Driver',
        email: payload.email || 'driver@rydnex.local',
        roles: [{ id: 1, role_key: 'user', role_name: 'User' }],
      },
      accessToken: 'static-mode-access-token',
    };
    return Promise.resolve({ success: true, data } as ApiResponseType<RegistrationResponseData>);
  }

  async logout() {
    return Promise.resolve({ success: true, data: null } as ApiResponseType<null>);
  }
}

export const authService = new AuthService();
