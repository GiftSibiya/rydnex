import skaftinClient from '@/backend/client/SkaftinClient';
import routes from '@/constants/ApiRoutes';
import { STATIC_DATA_MODE } from '@/constants/AppConfig';
import type {
  ApiResponseType,
  AuthOrganisation,
  AuthUser,
  AuthUserRole,
  LoginResponseData,
  RegistrationResponseData,
} from '@/types/Types';

type LoginPayload = { email: string; password: string };
type RegisterPayload = { name: string; email: string; password: string };

/** When register succeeds but email OTP is required before a session exists. */
export type RegisterResult =
  | ApiResponseType<RegistrationResponseData>
  | { success: true; requiresOtp: true; message?: string; data: null; userId?: number; email?: string }
  | { success: false; message?: string; error?: string; data: null };

export type LoginResult =
  | ApiResponseType<LoginResponseData>
  | {
      success: false;
      message?: string;
      error?: string;
      data: null;
      requiresOtp?: boolean;
      otpEmail?: string;
      userId?: number;
    };

function mapRole(r: Record<string, unknown>): AuthUserRole {
  return {
    id: Number(r.id),
    role_key: String(r.role_key ?? ''),
    role_name: r.role_name != null ? String(r.role_name) : undefined,
  };
}

function mapAuthUser(raw: Record<string, unknown> | null | undefined): AuthUser | null {
  if (!raw || raw.id == null) return null;
  const id = Number(raw.id);
  if (!Number.isFinite(id)) return null;
  const rolesRaw = raw.roles;
  const roles = Array.isArray(rolesRaw)
    ? rolesRaw.map((x) => mapRole(x as Record<string, unknown>))
    : undefined;
  return {
    id,
    name: String(raw.name ?? ''),
    email: String(raw.email ?? ''),
    phone: raw.phone != null ? String(raw.phone) : undefined,
    last_name: raw.last_name != null ? String(raw.last_name) : undefined,
    roles,
  };
}

function accessTokenFromPayload(data: Record<string, unknown> | null | undefined): string {
  if (!data) return '';
  const session = data.session as Record<string, unknown> | undefined;
  if (session?.accessToken != null) return String(session.accessToken);
  if (data.accessToken != null) return String(data.accessToken);
  return '';
}

function organisationFromPayload(data: Record<string, unknown> | null | undefined): AuthOrganisation | null {
  if (!data) return null;
  const org = data.organisation as Record<string, unknown> | undefined;
  if (org?.id != null && org?.name != null) {
    return { id: Number(org.id), name: String(org.name) };
  }
  if (data.organisation_id != null && data.organisation_name != null) {
    return { id: Number(data.organisation_id), name: String(data.organisation_name) };
  }
  return null;
}

function loginDataFromApi(data: Record<string, unknown> | null | undefined): LoginResponseData | null {
  if (!data) return null;
  const user = mapAuthUser(data.user as Record<string, unknown>);
  const accessToken = accessTokenFromPayload(data);
  if (!user || !accessToken) return null;
  return {
    user,
    accessToken,
    organisation: organisationFromPayload(data),
  };
}

function registrationDataFromApi(data: Record<string, unknown> | null | undefined): RegistrationResponseData | null {
  if (!data) return null;
  const user = mapAuthUser(data.user as Record<string, unknown>);
  const accessToken = accessTokenFromPayload(data);
  if (!user || !accessToken) return null;
  return { user, accessToken };
}

/** Full JSON body attached by SkaftinClient on HTTP errors (`{ success, message, data? }`). */
function parseThrownApiBody(err: unknown): Record<string, unknown> | null {
  if (err && typeof err === 'object' && 'data' in err) {
    const d = (err as { data: unknown }).data;
    if (d && typeof d === 'object') return d as Record<string, unknown>;
  }
  return null;
}

/** API may return `user_id` as number or string (JSON). */
function parseUserId(value: unknown): number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value === 'string') {
    const n = Number(value.trim());
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
}

/** Register `data` often exposes `user_id` at the top level for OTP flows. */
function userIdFromRegisterPayload(payloadData: Record<string, unknown> | null | undefined): number | undefined {
  if (!payloadData) return undefined;
  const top = parseUserId(payloadData.user_id ?? payloadData.userId);
  if (top != null) return top;
  const userData =
    payloadData.user && typeof payloadData.user === 'object'
      ? (payloadData.user as Record<string, unknown>)
      : null;
  const nested = parseUserId(userData?.id);
  if (nested != null) return nested;
  return parseUserId(payloadData.id);
}

/**
 * Some responses put `user_id` on the JSON root; others only under `data`
 * (see client-sdk-mobile `01-AUTH-REQUESTS.md` register / verify-otp flow).
 */
function userIdFromRegisterApiResponse(res: Record<string, unknown>): number | undefined {
  const data =
    res.data != null && typeof res.data === 'object' ? (res.data as Record<string, unknown>) : null;
  const fromData = userIdFromRegisterPayload(data);
  if (fromData != null) return fromData;
  return parseUserId(res.user_id ?? res.userId);
}

/** `verify-otp` body sends `otp` as a string (trimmed), never a number. */
function otpForVerifyRequest(otp: string): string {
  return otp.trim();
}

class AuthService {
  async login(payload: LoginPayload): Promise<LoginResult> {
    if (STATIC_DATA_MODE) {
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
      return { success: true, data } as ApiResponseType<LoginResponseData>;
    }

    try {
      const res = await skaftinClient.post<Record<string, unknown>>(
        routes.auth.login,
        {
          username: payload.email.trim(),
          password: payload.password,
          method: 'email',
        },
        { skipUserAuthorization: true }
      );

      if (!res.success) {
        return {
          success: false,
          message: res.message,
          error: res.error,
          data: null,
        };
      }

      const payloadData = res.data as Record<string, unknown> | null | undefined;
      const mapped = loginDataFromApi(payloadData ?? null);
      if (mapped) {
        return { success: true, data: mapped } as ApiResponseType<LoginResponseData>;
      }

      const requiresOtp =
        payloadData?.requires_otp === true || payloadData?.requiresOtp === true;
      const userFromPayload =
        payloadData?.user && typeof payloadData.user === 'object'
          ? (payloadData.user as Record<string, unknown>)
          : null;
      const userId = parseUserId(
        payloadData?.user_id ?? payloadData?.userId ?? userFromPayload?.id
      );
      if (requiresOtp && userId != null) {
        return {
          success: false,
          message: res.message ?? 'Check your email for a verification code.',
          data: null,
          requiresOtp: true,
          otpEmail: String(payloadData?.email ?? payload.email.trim()),
          userId,
        };
      }

      return {
        success: false,
        message: res.message ?? 'Login failed',
        data: null,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Login failed';
      const body = parseThrownApiBody(e);
      const nested =
        body?.data && typeof body.data === 'object'
          ? (body.data as Record<string, unknown>)
          : null;
      const requiresOtp =
        nested?.requires_otp === true ||
        body?.requires_otp === true ||
        nested?.requiresOtp === true ||
        body?.requiresOtp === true;
      const otpEmail =
        (nested?.email as string) ?? (body?.email as string) ?? payload.email.trim();
      const userId = parseUserId(nested?.user_id ?? body?.user_id ?? nested?.userId ?? body?.userId);

      if (requiresOtp) {
        return {
          success: false,
          message,
          data: null,
          requiresOtp: true,
          otpEmail,
          userId,
        };
      }

      return { success: false, message, data: null };
    }
  }

  async register(payload: RegisterPayload): Promise<RegisterResult> {
    if (STATIC_DATA_MODE) {
      // Mirror production: register then verify-otp (`POST .../verify-otp` with `{ user_id, otp }`).
      return {
        success: true,
        requiresOtp: true,
        message: 'Check your email for a verification code.',
        data: null,
        userId: 999001,
        email: payload.email.trim(),
      };
    }

    try {
      const res = await skaftinClient.post<Record<string, unknown>>(
        routes.auth.register,
        {
          name: payload.name.trim(),
          email: payload.email.trim(),
          password: payload.password,
          role_key: 'user',
          otp_method: 'email',
        },
        { skipUserAuthorization: true }
      );

      if (!res.success) {
        return {
          success: false,
          message: res.message,
          error: res.error,
          data: null,
        };
      }

      const root = res as unknown as Record<string, unknown>;
      const payloadData = res.data as Record<string, unknown> | null | undefined;
      const mapped = registrationDataFromApi(payloadData ?? null);

      // We always send `otp_method: 'email'`. Some backends still return `user` + accessToken on
      // register; the session must only be applied after `verify-otp`, so never short-circuit to
      // `data` here when we can continue with a user id.
      let userId =
        userIdFromRegisterApiResponse(root) ??
        (mapped?.user?.id != null && Number.isFinite(mapped.user.id) ? mapped.user.id : undefined);

      if (userId != null) {
        const userObj =
          payloadData?.user && typeof payloadData.user === 'object'
            ? (payloadData.user as Record<string, unknown>)
            : null;
        return {
          success: true,
          requiresOtp: true,
          message: res.message ?? 'Check your email for a verification code.',
          data: null,
          userId,
          email: String(
            userObj?.email ?? payloadData?.email ?? root.email ?? mapped?.user?.email ?? payload.email.trim()
          ),
        };
      }

      if (mapped) {
        return { success: true, data: mapped } as ApiResponseType<RegistrationResponseData>;
      }

      return {
        success: true,
        requiresOtp: true,
        message: res.message ?? 'Check your email for a verification code.',
        data: null,
        userId: undefined,
        email: String(payloadData?.email ?? root.email ?? payload.email.trim()),
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Registration failed';
      const body = parseThrownApiBody(e);
      const nested =
        body?.data && typeof body.data === 'object'
          ? (body.data as Record<string, unknown>)
          : null;
      const requiresOtp =
        nested?.requires_otp === true ||
        body?.requires_otp === true ||
        nested?.requiresOtp === true ||
        body?.requiresOtp === true;
      const mergedRoot: Record<string, unknown> = { ...(body ?? {}), ...(nested ?? {}) };
      const userId =
        userIdFromRegisterApiResponse(mergedRoot) ??
        userIdFromRegisterPayload(nested) ??
        userIdFromRegisterPayload(body);

      if (requiresOtp) {
        return {
          success: true,
          requiresOtp: true,
          message,
          data: null,
          userId,
          email: String(
            (nested?.email as string) ?? (body?.email as string) ?? payload.email.trim()
          ),
        };
      }

      return { success: false, message, data: null };
    }
  }

  async verifyRegistrationOtp(
    userId: number,
    otp: string
  ): Promise<
    | { success: true; data: RegistrationResponseData | null; message?: string }
    | { success: false; message?: string; error?: string }
  > {
    if (STATIC_DATA_MODE) {
      const data: RegistrationResponseData = {
        user: {
          id: userId || 1,
          name: 'Rydnex Driver',
          email: 'driver@rydnex.local',
          roles: [{ id: 1, role_key: 'user', role_name: 'User' }],
        },
        accessToken: 'static-mode-access-token',
      };
      return { success: true, data };
    }

    try {
      const verifyBody = { user_id: userId, otp: otpForVerifyRequest(otp) };
      const res = await skaftinClient.post<Record<string, unknown>>(
        routes.auth.verifyOtp,
        verifyBody,
        { skipUserAuthorization: true }
      );

      if (!res.success) {
        return {
          success: false,
          message: res.message,
          error: res.error,
        };
      }

      const payloadData = res.data as Record<string, unknown> | null | undefined;
      const mapped = registrationDataFromApi(payloadData ?? null);
      if (!mapped) {
        return { success: true, data: null, message: res.message };
      }
      return { success: true, data: mapped, message: res.message };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Verification failed';
      return { success: false, message };
    }
  }

  async resendRegistrationOtp(
    userId: number
  ): Promise<{ success: true; message?: string } | { success: false; message?: string; error?: string }> {
    if (STATIC_DATA_MODE) {
      return { success: true, message: 'A new code has been sent.' };
    }

    try {
      const res = await skaftinClient.post<Record<string, unknown>>(
        routes.auth.resendOtp,
        { user_id: userId },
        { skipUserAuthorization: true }
      );
      if (!res.success) {
        return { success: false, message: res.message, error: res.error };
      }
      return { success: true, message: res.message };
    } catch (e: unknown) {
      return {
        success: false,
        message: e instanceof Error ? e.message : 'Failed to resend verification code',
      };
    }
  }

  async refreshSession(): Promise<{ success: boolean; expired: boolean }> {
    if (STATIC_DATA_MODE) {
      return { success: true, expired: false };
    }

    try {
      const res = await skaftinClient.post<Record<string, unknown>>(routes.auth.sessionRefresh, {});
      return { success: res.success, expired: false };
    } catch (e: unknown) {
      const status = (e as any)?.status;
      if (status === 401) {
        return { success: false, expired: true };
      }
      // Network error or server error — don't treat as expired
      return { success: false, expired: false };
    }
  }

  async logout(): Promise<ApiResponseType<null>> {
    if (STATIC_DATA_MODE) {
      return { success: true, data: null };
    }

    try {
      await skaftinClient.post(routes.auth.logout, {});
      return { success: true, data: null };
    } catch {
      return { success: true, data: null };
    }
  }
}

export const authService = new AuthService();
